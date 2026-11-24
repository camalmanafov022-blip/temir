import { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

try {
  registerSW({ immediate: true });
} catch {
  // Ignore service worker registration failures in restricted contexts
}

interface BoundaryState {
  errorMessage: string | null;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { errorMessage: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { errorMessage: error.message || 'Tətbiqdə gözlənilməz xəta baş verdi.' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UstaLab runtime error:', error, info);
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3">
            <h1 className="text-lg font-bold text-slate-900">
              Səhifə yüklənərkən xəta baş verdi
            </h1>
            <p className="text-sm text-slate-600">{this.state.errorMessage}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-orange-600 rounded-xl cursor-pointer"
            >
              Yenidən Yüklə
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
