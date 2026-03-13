import React from 'react';

/**
 * ErrorBoundary - Captura erros de renderização e exibe mensagem amigável
 * em vez de deixar a tela branca.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary capturou um erro:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8">
                    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center border border-red-100">
                        <div className="text-5xl mb-4">⚠️</div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Algo deu errado</h1>
                        <p className="text-slate-500 mb-4">
                            Ocorreu um erro inesperado. Tente recarregar a página.
                        </p>
                        <p className="text-xs text-red-400 bg-red-50 rounded p-2 mb-6 font-mono text-left break-all">
                            {this.state.error?.message || 'Erro desconhecido'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                        >
                            Recarregar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
