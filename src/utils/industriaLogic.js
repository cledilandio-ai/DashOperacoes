/**
 * Lógica Industrial Frotas
 * Adaptação de frotasLogic.js
 * 
 * V2: Baseado em Estimativa de Horas por Data (Sem horímetro físico conectado)
 */

export const PREVENTIVA_CONFIG = {
  // Buffer padrão para alertas (ex: 7 dias antes)
  DEFAULT_ALERT_DAYS: 7,
};

/**
 * Calcula a data estimada para a próxima preventiva baseada na média de uso diário.
 * 
 * @param {Date} lastMaintenanceDate - Data da última execução
 * @param {number} maintenanceIntervalHours - Intervalo da manutenção (ex: 4000h)
 * @param {number} dailyUsageHours - Carga horária média diária (ex: 16h/dia)
 * @returns {Date} Data estimada da próxima manutenção
 */
export const calcularDataEstimada = (lastMaintenanceDate, maintenanceIntervalHours, dailyUsageHours) => {
  if (!lastMaintenanceDate || !maintenanceIntervalHours || !dailyUsageHours) return null;
  if (dailyUsageHours <= 0) return null;

  // Dias estimados = Intervalo / Uso Diário
  const daysUntilNext = Math.ceil(maintenanceIntervalHours / dailyUsageHours);

  const estimatedDate = new Date(lastMaintenanceDate);
  estimatedDate.setDate(estimatedDate.getDate() + daysUntilNext);

  return estimatedDate;
};

/**
 * Calcula status da preventiva baseada em Data.
 * @param {string|Date} nextServiceDate - Data calculada da próxima manutenção
 * @param {number} alertDays - Dias de antecedência para alerta
 * @returns {object} { status: 'OK'|'ALERTA'|'VENCIDA', daysRemaining: number }
 */
export const getStatusPreventivaData = (nextServiceDate, alertDays = PREVENTIVA_CONFIG.DEFAULT_ALERT_DAYS) => {
  if (!nextServiceDate) return { status: 'OK', daysRemaining: null };

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time for accurate day calc

  const target = new Date(nextServiceDate);
  target.setHours(0, 0, 0, 0);

  // Diferença em milissegundos
  const diffTime = target - today;
  // Diferença em dias
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) return { status: 'VENCIDA', daysRemaining };
  if (daysRemaining <= alertDays) return { status: 'ALERTA', daysRemaining };
  return { status: 'OK', daysRemaining };
};
