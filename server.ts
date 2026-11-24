import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

interface StoredOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  district: string;
  address: string;
  category: string;
  issueTitle: string;
  description: string;
  urgency: 'Planlı' | 'Təcili';
  preferredTime: string;
  status: 'Gözləmədə' | 'Usta təyin edilib' | 'Tamamlandı' | 'Ləğv edilib';
  estimatedCostAzn: string;
  assignedTechnician: string;
  createdAt: string;
  diagnosticSummary?: {
    likelyFault: string;
    severity: 'Təcili' | 'Orta' | 'Yüngül';
    deviceOrArea: string;
    estimatedCostRangeAzn: string;
  };
}

const TECHNICIANS_BY_CATEGORY: Record<string, string[]> = {
  kondisioner: ['Rəşad Məmmədov (İqlim sistemləri)', 'Elvin Qasımov (Soyutma texnikası)'],
  paltaryuyan: ['Tural Əliyev (Məişət texnikası)', 'Orxan Həsənov (Ağ əşya ustası)'],
  televizor: ['Kamran Nəsirov (Elektronika və TV)', 'Fərid İsmayılov (Plata mütəxəssisi)'],
  santexnika: ['Vüsal Rzayev (Santexnika və istilik)', 'Samir Babayev (Boru və kombi)'],
  elektrik: ['Nurlan Cəfərov (Baş elektrik)', 'Elnur Kərimov (Şit və xətt ustası)'],
  ev_temiri: ['Cavid Quliyev (Daxili təmir)', 'Anar Hüseynov (Montaj və bərpa)'],
};

function ensureOrdersFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readOrders(): StoredOrder[] {
  ensureOrdersFile();
  try {
    const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOrders(orders: StoredOrder[]): void {
  ensureOrdersFile();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
}

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));

  app.use('/api', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/diagnose', async (req, res) => {
    const { imageBase64, mimeType, categoryHint, userNote } = req.body ?? {};

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      res.status(400).json({
        error: 'Diaqnostika üçün kamera görüntüsü və ya foto tələb olunur.',
      });
      return;
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const safeMimeType =
      typeof mimeType === 'string' && allowedMimeTypes.includes(mimeType)
        ? mimeType
        : 'image/jpeg';

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '').trim();
    if (!cleanBase64 || cleanBase64.length < 100) {
      res.status(400).json({
        error: 'Göndərilən şəkil formatı düzgün deyil və ya boşdur.',
      });
      return;
    }

    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'Diaqnostika xidməti üçün Gemini API açarı təyin edilməyib. Zəhmət olmasa Settings > Secrets bölməsindən GEMINI_API_KEY əlavə edin.',
      });
      return;
    }

    const contextLines: string[] = [];
    if (categoryHint && typeof categoryHint === 'string' && categoryHint !== 'auto') {
      contextLines.push(`İstifadəçinin seçdiyi ilkin sahə: ${categoryHint}`);
    }
    if (userNote && typeof userNote === 'string' && userNote.trim().length > 0) {
      contextLines.push(`İstifadəçinin qeydi: "${userNote.trim()}"`);
    }

    const promptText = `Şəkli diqqətlə təhlil et və texniki nasazlıq diaqnostikası apar.
${contextLines.length > 0 ? contextLines.join('\n') : 'İstifadəçi əlavə mətn daxil etməyib, şəkildəki problemi müəyyən et.'}

Tələblər:
1. Bütün mətnləri təbii, aydın və peşəkar Azərbaycan dilində yaz.
2. Əgər şəkildə kondisioner, paltaryuyan, televizor, santexnika borusu/kranı, elektrik şiti/rozetkası, yaxud ev təmiri ilə bağlı problem görünürsə, dəqiq texniki diaqnoz ver.
3. Əgər şəkildə xəta kodu (məs. E1, E4, UE, F21), sızma izi, yanmış detal, buzlanma, ekran xətti və ya qırıq hissə varsa, bunu mütləq qeyd et.
4. Əgər şəkil tamamilə qaranlıq, bulanıq və ya texniki problemlə əlaqəsizdirsə, isTechnicalProblemDetected dəyərini false et və istifadəçiyə şəkli daha aydın çəkməyi tövsiyə et.
5. Təxmini təmir qiymətini Bakı bazarına uyğun AZN ilə real aralıqda göstər (məs. "40 – 85 AZN").`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: safeMimeType,
                data: cleanBase64,
              },
            },
            {
              text: promptText,
            },
          ],
        },
        config: {
          systemInstruction:
            'Sən təcrübəli baş texniki mühəndis və məişət cihazları, santexnika, elektrik və ev təmiri üzrə diaqnostika ekspertisən. Yalnız faktlara əsaslanan, təhlükəsizlik qaydalarını ön planda tutan, konkret və faydalı cavablar verirsən.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isTechnicalProblemDetected: {
                type: Type.BOOLEAN,
                description:
                  'Şəkildə texniki cihaz, kommunikasiya və ya təmir tələb edən obyekt aşkar edilib-edilməməsi.',
              },
              deviceOrArea: {
                type: Type.STRING,
                description: 'Şəkildə görünən cihaz, qovşaq və ya ev sahəsi (Azərbaycan dilində).',
              },
              recommendedCategory: {
                type: Type.STRING,
                description:
                  'Yalnız bunlardan biri: kondisioner, paltaryuyan, televizor, santexnika, elektrik, ev_temiri',
              },
              severity: {
                type: Type.STRING,
                description: 'Yalnız bunlardan biri: Təcili, Orta, Yüngül',
              },
              likelyFault: {
                type: Type.STRING,
                description: 'Ehtimal olunan əsas nasazlığın qısa adı.',
              },
              technicalExplanation: {
                type: Type.STRING,
                description:
                  'Şəkildə görünənlərə əsaslanan 2-3 cümləlik texniki izahat.',
              },
              possibleCauses: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Nasazlığın 2-4 mümkün texniki səbəbi.',
              },
              safetyWarnings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Dərhal görülməli təhlükəsizlik tədbirləri (1-3 bənd).',
              },
              diyChecks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  'Usta gələnə qədər istifadəçinin təhlükəsiz yoxlaya biləcəyi 1-3 sadə addım.',
              },
              estimatedCostRangeAzn: {
                type: Type.STRING,
                description: 'Təxmini təmir dəyəri aralığı, məsələn: 45 – 90 AZN',
              },
              estimatedRepairDuration: {
                type: Type.STRING,
                description: 'Təxmini təmir müddəti, məsələn: 45 – 90 dəqiqə',
              },
              requiredParts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Ehtimal olunan lazım olan ehtiyat hissələri və ya materiallar.',
              },
            },
            required: [
              'isTechnicalProblemDetected',
              'deviceOrArea',
              'recommendedCategory',
              'severity',
              'likelyFault',
              'technicalExplanation',
              'possibleCauses',
              'safetyWarnings',
              'diyChecks',
              'estimatedCostRangeAzn',
              'estimatedRepairDuration',
              'requiredParts',
            ],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({
          error: 'Diaqnostika modeli boş cavab qaytardı. Zəhmət olmasa yenidən cəhd edin.',
        });
        return;
      }

      const parsed = JSON.parse(rawText);
      const validCategories = [
        'kondisioner',
        'paltaryuyan',
        'televizor',
        'santexnika',
        'elektrik',
        'ev_temiri',
      ];
      const validSeverities = ['Təcili', 'Orta', 'Yüngül'];

      const normalized = {
        isTechnicalProblemDetected: Boolean(parsed.isTechnicalProblemDetected),
        deviceOrArea: String(parsed.deviceOrArea || 'Texniki obyekt'),
        recommendedCategory: validCategories.includes(parsed.recommendedCategory)
          ? parsed.recommendedCategory
          : 'ev_temiri',
        severity: validSeverities.includes(parsed.severity) ? parsed.severity : 'Orta',
        likelyFault: String(parsed.likelyFault || 'İlkin texniki baxış tələb olunur'),
        technicalExplanation: String(parsed.technicalExplanation || ''),
        possibleCauses: Array.isArray(parsed.possibleCauses)
          ? parsed.possibleCauses.map(String)
          : [],
        safetyWarnings: Array.isArray(parsed.safetyWarnings)
          ? parsed.safetyWarnings.map(String)
          : [],
        diyChecks: Array.isArray(parsed.diyChecks) ? parsed.diyChecks.map(String) : [],
        estimatedCostRangeAzn: String(parsed.estimatedCostRangeAzn || '35 – 80 AZN'),
        estimatedRepairDuration: String(parsed.estimatedRepairDuration || '45 – 90 dəqiqə'),
        requiredParts: Array.isArray(parsed.requiredParts)
          ? parsed.requiredParts.map(String)
          : [],
        capturedAt: new Date().toISOString(),
      };

      res.json(normalized);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Bilinməyən diaqnostika xətası baş verdi.';
      console.error('Gemini diagnose error:', err);

      if (message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED')) {
        res.status(403).json({
          error:
            'Gemini API açarı etibarsızdır və ya icazə verilmədi. Settings > Secrets bölməsini yoxlayın.',
        });
        return;
      }
      if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
        res.status(429).json({
          error: 'Sorğu limiti müvəqqəti dolub. Zəhmət olmasa bir neçə saniyə sonra yenidən cəhd edin.',
        });
        return;
      }

      res.status(500).json({
        error: `Diaqnostika zamanı xəta baş verdi: ${message}`,
      });
    }
  });

  app.get('/api/orders', (_req, res) => {
    const orders = readOrders();
    res.json({ orders });
  });

  app.post('/api/orders', (req, res) => {
    const {
      customerName,
      phone,
      district,
      address,
      category,
      issueTitle,
      description,
      urgency,
      preferredTime,
      estimatedCostAzn,
      diagnosticSummary,
    } = req.body ?? {};

    if (
      !customerName ||
      typeof customerName !== 'string' ||
      customerName.trim().length < 2
    ) {
      res.status(400).json({ error: 'Zəhmət olmasa ad və soyadınızı daxil edin.' });
      return;
    }

    if (!phone || typeof phone !== 'string' || phone.replace(/\D/g, '').length < 9) {
      res.status(400).json({ error: 'Düzgün əlaqə nömrəsi daxil edin.' });
      return;
    }

    if (!address || typeof address !== 'string' || address.trim().length < 4) {
      res.status(400).json({ error: 'Zəhmət olmasa dəqiq ünvanı qeyd edin.' });
      return;
    }

    const validCategories = [
      'kondisioner',
      'paltaryuyan',
      'televizor',
      'santexnika',
      'elektrik',
      'ev_temiri',
    ];
    const safeCategory = validCategories.includes(category) ? category : 'ev_temiri';

    const orders = readOrders();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `UL-${randomDigits}`;
    const techPool = TECHNICIANS_BY_CATEGORY[safeCategory] || TECHNICIANS_BY_CATEGORY.ev_temiri;
    const assignedTechnician = techPool[orders.length % techPool.length];
    const safeUrgency: 'Planlı' | 'Təcili' = urgency === 'Təcili' ? 'Təcili' : 'Planlı';

    const newOrder: StoredOrder = {
      id: `${Date.now()}-${randomDigits}`,
      orderNumber,
      customerName: customerName.trim(),
      phone: phone.trim(),
      district: typeof district === 'string' && district.trim() ? district.trim() : 'Nəsimi rayonu',
      address: address.trim(),
      category: safeCategory,
      issueTitle:
        typeof issueTitle === 'string' && issueTitle.trim()
          ? issueTitle.trim()
          : 'Texniki baxış və təmir',
      description: typeof description === 'string' ? description.trim() : '',
      urgency: safeUrgency,
      preferredTime:
        typeof preferredTime === 'string' && preferredTime.trim()
          ? preferredTime.trim()
          : safeUrgency === 'Təcili'
            ? '1–2 saat ərzində'
            : 'Bu gün günorta',
      status: safeUrgency === 'Təcili' ? 'Usta təyin edilib' : 'Gözləmədə',
      estimatedCostAzn:
        typeof estimatedCostAzn === 'string' && estimatedCostAzn.trim()
          ? estimatedCostAzn.trim()
          : '35 – 90 AZN',
      assignedTechnician,
      createdAt: new Date().toISOString(),
      diagnosticSummary: diagnosticSummary ?? undefined,
    };

    const updatedOrders = [newOrder, ...orders];
    writeOrders(updatedOrders);
    res.status(201).json({ order: newOrder });
  });

  app.patch('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body ?? {};
    const validStatuses = ['Gözləmədə', 'Usta təyin edilib', 'Tamamlandı', 'Ləğv edilib'];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Yanlış sifariş statusu.' });
      return;
    }

    const orders = readOrders();
    const index = orders.findIndex((o) => o.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Sifariş tapılmadı.' });
      return;
    }

    orders[index] = { ...orders[index], status };
    writeOrders(orders);
    res.json({ order: orders[index] });
  });

  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`UstaLab server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
