import { Component, type ErrorInfo, type ReactNode } from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props & WithTranslation, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      const { t } = this.props;
      return (
        <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-8 bg-red-500/5 rounded-[2.5rem] border border-red-500/10">
          <div className="bg-red-500/10 p-4 rounded-2xl text-red-400 mb-6">
            <AlertTriangle size={48} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 arabic-text">{t('errorBoundary.title')}</h2>
          <p className="text-slate-400 text-center max-w-md mb-8">
            {t('errorBoundary.message')}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
          >
            <RefreshCcw size={20} />
            <span>{t('errorBoundary.refresh')}</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);
