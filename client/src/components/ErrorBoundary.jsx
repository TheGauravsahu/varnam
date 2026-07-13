import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import sound from './SoundEngine.js';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an uncaught React crash:", error, errorInfo);
  }

  handleReset = () => {
    sound.playClick();
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
          <div className="w-full max-w-md p-8 rounded-3xl border border-red-500/20 bg-white dark:bg-zinc-900 shadow-premium text-center space-y-6">
            
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-heading font-bold">Something went wrong</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                An unexpected application error occurred. We have logged the error details.
              </p>
            </div>

            {this.state.error && (
              <pre className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-left text-xs text-red-500 font-mono overflow-auto max-h-40">
                {this.state.error.toString()}
              </pre>
            )}

            <button 
              onClick={this.handleReset}
              className="btn-premium w-full py-3.5 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset & Go to Dashboard</span>
            </button>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
