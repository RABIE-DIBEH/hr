import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught component error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans rtl:dir-rtl">
          <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
            <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            
            <h1 className="text-2xl font-black text-white mb-2 arabic-text">عذرًا، حدث خطأ غير متوقع</h1>
            <p className="text-slate-400 text-sm mb-6">لقد واجه النظام مشكلة في عرض هذه الواجهة. يرجى تحديث الصفحة والمحاولة مرة أخرى.</p>
            
            <div className="bg-white/5 rounded-xl p-4 mb-8 text-left overflow-x-auto text-xs font-mono text-red-400/80 border border-white/5">
              {this.state.error?.message || "Unknown rendering error"}
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors shadow-xl shadow-white/5"
            >
              <RefreshCw size={18} />
              تحديث الصفحة الآن
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
