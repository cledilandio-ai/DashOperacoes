import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Factory, Wrench, ShieldCheck, AlertCircle } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    // Perfil selecionado pelo usuário (Visual)
    const [mode, setMode] = useState('PRODUCAO'); // PRODUCAO | MANUTENCAO | GESTOR
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Formulário
    const [formData, setFormData] = useState({ user: '', pass: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Tenta logar independende da aba (para simplificar UX)
        // O backend/banco já valida se é user/senha corretos
        const res = await login(formData.user, formData.pass);

        if (res.success) {
            const perfilUsuario = res.user.perfil; // ADMIN, TECNICO, OPERADOR...

            // Validação visual opcional: Se o cara clicou na aba MANUTENÇÃO mas é OPERADOR, avisa ou redireciona pro certo?
            // Vamos redirecionar para o certo sempre, ignorando a aba, pela inteligência.

            switch (perfilUsuario) {
                case 'ADMIN':
                case 'GESTOR':
                    navigate('/admin');
                    break;
                case 'TECNICO':
                    navigate('/tecnico');   // App mobile do técnico
                    break;
                case 'EXPEDICAO':
                    navigate('/expedicao');
                    break;
                default: // OPERADOR
                    navigate('/producao');
            }
        } else {
            setError(res.message);
            setLoading(false);
        }
    };

    // Cores dinâmicas baseadas na aba
    const getHeaderColor = () => {
        switch (mode) {
            case 'PRODUCAO': return 'from-blue-700 to-blue-500';
            case 'MANUTENCAO': return 'from-amber-600 to-amber-500'; // Laranja para manutenção
            case 'GESTOR': return 'from-slate-800 to-slate-600';
            default: return 'from-blue-700 to-blue-500';
        }
    };

    const getIcon = () => {
        switch (mode) {
            case 'PRODUCAO': return <Factory className="w-12 h-12 mx-auto mb-2 opacity-90" />;
            case 'MANUTENCAO': return <Wrench className="w-12 h-12 mx-auto mb-2 opacity-90" />;
            case 'GESTOR': return <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-90" />;
            default: return <Factory className="w-12 h-12 mx-auto mb-2 opacity-90" />;
        }
    };

    const getTitle = () => {
        switch (mode) {
            case 'PRODUCAO': return 'Chão de Fábrica';
            case 'MANUTENCAO': return 'Técnico / Manutenção';
            case 'GESTOR': return 'Administração';
            default: return 'Login';
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">

            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">

                {/* Header Colorido Dinâmico */}
                <div className={`p-8 text-center text-white bg-gradient-to-r transition-colors duration-500 ${getHeaderColor()}`}>
                    {getIcon()}
                    <h1 className="text-3xl font-bold">DashOperações</h1>
                    <p className="opacity-90 mt-1">
                        Acesso: {getTitle()}
                    </p>
                </div>

                {/* Seletor de Perfil (Abas) */}
                <div className="flex border-b border-gray-100">
                    <button
                        type="button"
                        onClick={() => { setMode('PRODUCAO'); setError(''); }}
                        className={`flex-1 py-3 text-xs md:text-sm font-medium transition-colors border-b-2
                            ${mode === 'PRODUCAO' ? 'text-blue-600 border-blue-600 bg-blue-50' : 'text-gray-500 border-transparent hover:text-gray-700'}
                        `}
                    >
                        Produção
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode('MANUTENCAO'); setError(''); }}
                        className={`flex-1 py-3 text-xs md:text-sm font-medium transition-colors border-b-2
                            ${mode === 'MANUTENCAO' ? 'text-amber-600 border-amber-600 bg-amber-50' : 'text-gray-500 border-transparent hover:text-gray-700'}
                        `}
                    >
                        Manutenção
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode('GESTOR'); setError(''); }}
                        className={`flex-1 py-3 text-xs md:text-sm font-medium transition-colors border-b-2
                            ${mode === 'GESTOR' ? 'text-slate-600 border-slate-600 bg-slate-50' : 'text-gray-500 border-transparent hover:text-gray-700'}
                        `}
                    >
                        Gestão
                    </button>
                </div>

                {/* Formulário */}
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100 flex items-center justify-center gap-2">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Usuário / Login
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: joao.silva"
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none"
                                        value={formData.user}
                                        onChange={e => setFormData({ ...formData, user: e.target.value.toLowerCase() })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Senha
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••"
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none"
                                        value={formData.pass}
                                        onChange={e => setFormData({ ...formData, pass: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full text-white font-bold py-3 px-4 rounded-lg transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl
                                ${mode === 'PRODUCAO' ? 'bg-blue-600 hover:bg-blue-700' :
                                    mode === 'MANUTENCAO' ? 'bg-amber-600 hover:bg-amber-700' :
                                        'bg-slate-800 hover:bg-slate-900'}
                            `}
                        >
                            {loading ? 'Acessando...' : 'Entrar no Sistema'}
                        </button>

                    </form>

                    <p className="mt-6 text-center text-xs text-gray-400 px-4 leading-normal">
                        Sistema interno DashOperações. O acesso é monitorado.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default Login;
