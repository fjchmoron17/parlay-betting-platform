// backend/services/schedulerService.js
// Servicio para programar tareas automáticas

import cron from 'node-cron';
import { processUnsettledBets } from './betSettlementService.js';

let settlementJob = null;
let isRunning = false;

/**
 * Ejecutar el proceso de resolución de apuestas
 */
async function runSettlementProcess() {
  if (isRunning) {
    console.log('⚠️ Proceso de resolución ya en ejecución, saltando...');
    return;
  }

  try {
    isRunning = true;
    const timestamp = new Date().toISOString();
    console.log(`\n🤖 [${timestamp}] Iniciando resolución automática de apuestas...`);
    
    const result = await processUnsettledBets();
    
    console.log(`✅ [${timestamp}] Resolución completada:`);
    console.log(`   📊 Procesadas: ${result.processed}`);
    console.log(`   🎯 Resueltas: ${result.settled}`);
    console.log(`   ⏳ Pendientes: ${result.processed - result.settled}\n`);
  } catch (error) {
    console.error('❌ Error en resolución automática:', error.message);
  } finally {
    isRunning = false;
  }
}

/**
 * Iniciar el scheduler de resolución automática
 * Por defecto se ejecuta cada 2 horas
 */
export function startAutoSettlement(cronExpression = '0 */2 * * *') {
  if (settlementJob) {
    console.log('⚠️ Scheduler ya está en ejecución');
    return;
  }

  // Validar expresión cron
  if (!cron.validate(cronExpression)) {
    console.error('❌ Expresión cron inválida:', cronExpression);
    return;
  }

  console.log(`\n🔄 Iniciando Auto-Resolución de Apuestas`);
  console.log(`   📅 Programación: ${cronExpression}`);
  console.log(`   ⏰ Próxima ejecución: ${getNextExecution(cronExpression)}`);
  console.log(`   🎯 Función: Resolver apuestas pendientes automáticamente\n`);

  settlementJob = cron.schedule(cronExpression, async () => {
    await runSettlementProcess();
  });

  // Ejecutar inmediatamente al iniciar (opcional)
  const runOnStartup = process.env.AUTO_SETTLE_ON_STARTUP === 'true';
  if (runOnStartup) {
    console.log('🚀 Ejecutando resolución inicial al arranque...');
    setTimeout(() => runSettlementProcess(), 5000); // Esperar 5 segundos después del inicio
  }
}

/**
 * Detener el scheduler
 */
export function stopAutoSettlement() {
  if (settlementJob) {
    settlementJob.stop();
    settlementJob = null;
    console.log('🛑 Auto-Resolución detenida');
  }
}

/**
 * Obtener estado del scheduler
 */
export function getSchedulerStatus() {
  return {
    active: settlementJob !== null,
    running: isRunning,
    nextExecution: settlementJob ? getNextExecution('0 */2 * * *') : null
  };
}

/**
 * Ejecutar manualmente el proceso (usado por el endpoint)
 */
export async function runManualSettlement() {
  return await runSettlementProcess();
}

/**
 * Calcular próxima ejecución basada en expresión cron
 */
function getNextExecution(cronExpression) {
  try {
    const now = new Date();
    const parts = cronExpression.split(' ');
    
    // Interpretación simple de cron (minuto hora * * *)
    if (parts[1].includes('*/')) {
      const hours = parseInt(parts[1].split('*/')[1]);
      const nextHour = Math.ceil(now.getHours() / hours) * hours;
      const nextDate = new Date(now);
      nextDate.setHours(nextHour, 0, 0, 0);
      
      if (nextDate <= now) {
        nextDate.setHours(nextDate.getHours() + hours);
      }
      
      return nextDate.toLocaleString('es-ES', {
        dateStyle: 'short',
        timeStyle: 'short'
      });
    }
    
    return 'Calculando...';
  } catch (error) {
    return 'No disponible';
  }
}

export default {
  startAutoSettlement,
  stopAutoSettlement,
  getSchedulerStatus,
  runManualSettlement
};
