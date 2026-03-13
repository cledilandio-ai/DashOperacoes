import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="flex items-center justify-center h-screen text-slate-500">Carregando acesso...</div>;
    }

    if (!user) {
        // Redireciona para Login, salvando a tentativa original
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Verifica Permissão (Role)
    // O campo no banco é 'funcao' (ex: 'Gerente', 'ADMIN', 'Operador')
    const userRole = (user.funcao || user.perfil || '').toUpperCase();

    // Mapeamento de nomes do banco para roles do sistema
    const roleMap = {
        'GERENTE': 'GESTOR',
        'ADMINISTRADOR': 'ADMIN',
        'OPERADOR': 'OPERADOR',
        'TECNICO': 'TECNICO',
        'EXPEDICAO': 'EXPEDICAO',
    };
    const normalizedRole = roleMap[userRole] || userRole;

    if (allowedRoles && !allowedRoles.includes(normalizedRole)) {
        return <div className="flex flex-col items-center justify-center h-screen text-red-500 gap-4">
            <h1 className="text-2xl font-bold">Acesso Negado</h1>
            <p>Seu perfil ({user.funcao}) não tem permissão para acessar esta área.</p>
            <button onClick={() => window.history.back()} className="px-4 py-2 bg-slate-200 rounded">Voltar</button>
        </div>;
    }

    return children;
};

export default ProtectedRoute;
