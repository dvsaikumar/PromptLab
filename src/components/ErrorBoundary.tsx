import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                    <div className="max-w-3xl w-full bg-white rounded-2xl border border-red-100 shadow-xl p-8">
                        <div className="flex items-center gap-4 mb-6 text-red-600">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <h1 className="text-3xl font-bold">Something went wrong</h1>
                        </div>

                        <p className="text-slate-600 mb-6 text-lg">
                            An unexpected error occurred. Please report this details:
                        </p>

                        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-inner">
                            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Error Log</span>
                            </div>
                            <div className="p-4 overflow-x-auto">
                                <pre className="text-red-400 font-mono text-sm mb-4 whitespace-pre-wrap font-bold">
                                    {this.state.error?.toString()}
                                </pre>
                                {this.state.errorInfo && (
                                    <pre className="text-slate-400 font-mono text-xs whitespace-pre-wrap opacity-75">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="mt-8 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
