/**
 * Lógica Core Frotas
 * Baseado na skill: core_logic/SKILL.md
 */

// --- Smart Odometer ---

export const KM_VALIDATION_CONFIG = {
  ROLLOVER_THRESHOLD: 900000, // 900k km
  ROLLOVER_RESET_LIMIT: 100000, // 100k km
  MAX_GAP_WARNING: 10000, // 10k km gap for typo check
};

/**
 * Valida o input de quilometragem e detecta viradas de odômetro.
 * @param {number} inputKM - O valor digitado pelo usuário (ex: 50.000)
 * @param {number} currentKM - O valor atual total do veículo (ex: 980.000)
 * @param {boolean} allowLower - Se true, permite registrar KM menor que atual (retroativo)
 * @returns {object} { valid: boolean, newTotalKM: number, isRollover: boolean, warning: string|null }
 */
export const validarKMInput = (inputKM, currentKM, allowLower = false) => {
  const diff = inputKM - currentKM;

  // 1. Detecção de Virada de Odômetro (Rollover)
  // Cenário: Veículo tinha 990.000, agora usuário digitou 10.000
  if (currentKM > KM_VALIDATION_CONFIG.ROLLOVER_THRESHOLD && inputKM < KM_VALIDATION_CONFIG.ROLLOVER_RESET_LIMIT) {
    // Assumimos que virou o milhão
    // Pega a casa do milhão atual (ex: 1.990.000 -> 1.000.000)
    const currentMillion = Math.floor(currentKM / 1000000) * 1000000;
    const nextMillion = currentMillion + 1000000;
    const newTotalKM = nextMillion + inputKM;
    
    return {
      valid: true,
      newTotalKM,
      isRollover: true,
      warning: `Virada de odômetro detectada! Novo total: ${newTotalKM}`
    };
  }

  // 2. KM Menor que atual (Erro ou Retroativo)
  if (inputKM < currentKM) {
    if (allowLower) {
      return {
        valid: true,
        newTotalKM: currentKM, // Não reduz o KM total do veículo
        isRollover: false,
        warning: "Registro retroativo: KM do veículo não será reduzido."
      };
    } else {
        // Se a diferença for muito grande, pode ser tentativa de fraude ou erro crasso
        return {
            valid: false,
            newTotalKM: currentKM,
            isRollover: false,
            error: "KM menor que o atual. Para lançamentos retroativos, ajuste a data."
        };
    }
  }

  // 3. Trava de Erro de Digitação (Salto muito grande)
  if (diff > KM_VALIDATION_CONFIG.MAX_GAP_WARNING) {
    return {
      valid: true, // É válido, mas suspeito
      newTotalKM: inputKM,
      isRollover: false,
      warning: `Atenção: A diferença de KM (${diff}) é muito alta. Verifique se digitou corretamente.`
    };
  }

  return {
    valid: true,
    newTotalKM: inputKM,
    isRollover: false,
    warning: null
  };
};

// --- GPS Logic ---

export const GPS_CONFIG = {
  TIMEOUT: 45000, // 45 segundos
  MAXIMUM_AGE: 60000, // 1 minuto (cache)
  ENABLE_HIGH_ACCURACY: true
};

/**
 * Obtém a posição atual com as regras de resiliência.
 * @returns {Promise<GeolocationPosition>}
 */
export const obterLocalizacao = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalização não suportada pelo navegador."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      {
        enableHighAccuracy: GPS_CONFIG.ENABLE_HIGH_ACCURACY,
        timeout: GPS_CONFIG.TIMEOUT,
        maximumAge: GPS_CONFIG.MAXIMUM_AGE
      }
    );
  });
};

// --- Maintenance Logic ---

/**
 * Calcula a próxima manutenção preventiva.
 * @param {number} currentKM 
 * @param {number} intervalKM 
 * @returns {number} Próximo KM de manutenção
 */
export const calcularProximaPreventiva = (currentKM, intervalKM) => {
  if (!intervalKM || intervalKM <= 0) return null;
  // Ex: 10500 atual, intervalo 10000. 
  // Math.ceil(10500 / 10000) = 2. 2 * 10000 = 20000.
  // Se for 10000, Math.ceil(1) = 1. 1 * 10000 = 10000. (Já venceu ou é agora)
  // Melhor lógica: Última preventiva + Intervalo? 
  // O skill diz: "Baseada no intervalo". Geralmente é (KmAtual + Intervalo) ou Múltiplo.
  // Vamos usar múltiplos para padronização de frota (10k, 20k, 30k...), a menos que seja input manual.
  
  // Assumindo múltiplos perfeitos:
  const nextMultiple = Math.ceil((currentKM + 1) / intervalKM) * intervalKM;
  return nextMultiple;
};
