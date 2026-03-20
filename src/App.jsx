import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

/* CONTEXTOS */
import { AuthProvider } from './contexts/AuthContext';
import { ProducaoProvider } from './contexts/ProducaoContext';
import { IndustriaProvider } from './contexts/IndustriaContext';
import { ManutencaoProvider } from './contexts/ManutencaoContext';
import { ConfiguracoesProvider } from './contexts/ConfiguracoesContext';

/* PÁGINAS */
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Analista from './pages/Analista';
import Ativos from './pages/Ativos';
import Expedicao from './pages/Expedicao';
import Manutencao from './pages/Manutencao';
import Configuracoes from './pages/Configuracoes';
import Relatorios from './pages/Relatorios';

/* APPS MOBILE (chão de fábrica e técnicos) */
import ProducaoApp from './pages/mobile/ProducaoApp';
import TecnicoApp from './pages/mobile/TecnicoApp';

/* LAYOUT E PROTEÇÃO */
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ConfiguracoesProvider>
            <ProducaoProvider>
              <IndustriaProvider>
                <ManutencaoProvider>
                  <Routes>

                  {/* ROTA PÚBLICA */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<Navigate to="/login" replace />} />

                  {/* PAINEL GESTÃO (Admin + Gestor) */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'GESTOR']}>
                      <MainLayout><Dashboard /></MainLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'GESTOR']}>
                      <MainLayout><Admin /></MainLayout>
                    </ProtectedRoute>
                  } />

                  <Route path="/analista" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'GESTOR']}>
                      <MainLayout><Analista /></MainLayout>
                    </ProtectedRoute>
                  } />

                  {/* MÓDULO ATIVOS / INDÚSTRIA */}
                  <Route path="/ativos" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'GESTOR', 'TECNICO']}>
                      <MainLayout><Ativos /></MainLayout>
                    </ProtectedRoute>
                  } />

                  {/* MÓDULO MANUTENÇÃO (TPM) */}
                  <Route path="/manutencao" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'GESTOR', 'TECNICO']}>
                      <MainLayout><Manutencao /></MainLayout>
                    </ProtectedRoute>
                  } />

                  {/* MÓDULO EXPEDIÇÃO */}
                  <Route path="/expedicao" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'GESTOR', 'EXPEDICAO']}>
                      <MainLayout><Expedicao /></MainLayout>
                    </ProtectedRoute>
                  } />

                  {/* MÓDULO CONFIGURAÇÕES (ADMIN & GESTOR) */}
                  <Route path="/configuracoes" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'GESTOR']}>
                      <MainLayout><Configuracoes /></MainLayout>
                    </ProtectedRoute>
                  } />

                  {/* RELATÓRIOS */}
                  <Route path="/relatorios" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'GESTOR']}>
                      <MainLayout><Relatorios /></MainLayout>
                    </ProtectedRoute>
                  } />

                  {/* APPS OPERACIONAIS (mobile / sem sidebar) */}

                  {/* App Chão de Fábrica (Operadores) */}
                  <Route path="/producao" element={
                    <ProtectedRoute allowedRoles={['OPERADOR', 'PRODUCAO', 'ADMIN', 'GESTOR']}>
                      <ProducaoApp />
                    </ProtectedRoute>
                  } />

                  {/* App Técnico de Manutenção */}
                  <Route path="/tecnico" element={
                    <ProtectedRoute allowedRoles={['TECNICO', 'ADMIN', 'GESTOR']}>
                      <TecnicoApp />
                    </ProtectedRoute>
                  } />

                  {/* 404 → Login */}
                  <Route path="*" element={<Navigate to="/login" replace />} />

                </Routes>
                </ManutencaoProvider>
              </IndustriaProvider>
            </ProducaoProvider>
          </ConfiguracoesProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
