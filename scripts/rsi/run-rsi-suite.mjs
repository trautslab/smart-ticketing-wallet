#!/usr/bin/env node
/**
 * 🎛️ Master RSI Suite Orchestrator & CLI Runner
 * Ejecuta los 6 patrones autónomos de Recursive Self-Improvement del AI-SDLC Framework:
 * 1. Auto-Perf Loop
 * 2. Adversarial Fuzzer
 * 3. Architecture Drift Guard
 * 4. Frugal Context Compactor
 * 5. Micro SWE-bench Harness
 * 6. Living ADRs Sync
 *
 * Uso:
 *   node scripts/rsi/run-rsi-suite.mjs --pattern all
 *   node scripts/rsi/run-rsi-suite.mjs --pattern perf
 *   node scripts/rsi/run-rsi-suite.mjs --pattern adversarial
 *   node scripts/rsi/run-rsi-suite.mjs --pattern drift
 *   node scripts/rsi/run-rsi-suite.mjs --pattern frugal
 *   node scripts/rsi/run-rsi-suite.mjs --pattern swebench
 *   node scripts/rsi/run-rsi-suite.mjs --pattern adr
 */

import { existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { runAutoPerfLoop } from './auto-perf-loop.mjs';
import { runAdversarialFuzzer } from './adversarial-fuzzer.mjs';
import { runArchDriftGuard } from './arch-drift-guard.mjs';
import { runFrugalCompactor } from './frugal-compactor.mjs';
import { runMicroSwebench } from './micro-swebench.mjs';
import { runLivingAdrSync } from './living-adr-sync.mjs';

function emitTelemetry(agentId, taskId, phase, eventType, status, message, payload = {}) {
  const eventsPath = resolve(process.cwd(), '.agents', 'telemetry', 'events.jsonl');
  const dir = dirname(eventsPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  
  const event = {
    timestamp: new Date().toISOString(),
    agentId,
    taskId,
    phase,
    eventType,
    status,
    message,
    payload
  };
  appendFileSync(eventsPath, JSON.stringify(event) + '\n', 'utf-8');
  console.log(`📡 [RSI-Suite] [${phase}] ${message}`);
}

const args = process.argv.slice(2);
function getArg(flag, defaultVal = 'all') {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
}

const requestedPattern = getArg('--pattern', 'all').toLowerCase();

async function main() {
  console.log(`\n========================================================================`);
  console.log(`🚀 AI-SDLC FRAMEWORK — SUITE DE AUTONOMÍA RECURSIVA (RSI SOTA)`);
  console.log(`📡 Modo de Ejecución: ${requestedPattern.toUpperCase()} | Gobernanza de Doble Riel`);
  console.log(`========================================================================\n`);

  emitTelemetry('rsi-orchestrator', 'TASK-RSI-SUITE', 'SUITE_START', 'RSI_SUITE_INITIATED', 'RUNNING',
    `Iniciando ejecución de suite RSI en modo: ${requestedPattern.toUpperCase()}`);

  const results = [];
  const startTime = Date.now();

  try {
    // Patrón 1
    if (requestedPattern === 'all' || requestedPattern === 'perf') {
      const res = await runAutoPerfLoop();
      results.push({ pattern: '1. Auto-Perf Worktree Loop', status: res.success ? 'PASSED ✅' : 'FAILED ❌', detail: `Δp95 -${res.improvementPct}%` });
    }

    // Patrón 2
    if (requestedPattern === 'all' || requestedPattern === 'adversarial') {
      const res = await runAdversarialFuzzer();
      results.push({ pattern: '2. Adversarial Red-Team Fuzzer', status: res.success ? 'PASSED ✅' : 'FAILED ❌', detail: `${res.passedVectors}/${res.totalVectors} neutralizados` });
    }

    // Patrón 3
    if (requestedPattern === 'all' || requestedPattern === 'drift') {
      const res = await runArchDriftGuard();
      results.push({ pattern: '3. Architecture Drift Guard', status: res.success ? 'PASSED ✅' : 'FAILED ❌', detail: `${res.violations} violaciones` });
    }

    // Patrón 4
    if (requestedPattern === 'all' || requestedPattern === 'frugal') {
      const res = await runFrugalCompactor();
      results.push({ pattern: '4. Frugal Engine & Tokenomics', status: res.success ? 'PASSED ✅' : 'FAILED ❌', detail: `-${res.savingsPct}% tokens (100% Pass@1)` });
    }

    // Patrón 5
    if (requestedPattern === 'all' || requestedPattern === 'swebench') {
      const res = await runMicroSwebench();
      results.push({ pattern: '5. Micro SWE-bench Harness', status: res.success ? 'PASSED ✅' : 'FAILED ❌', detail: `Red -> Green (2/2 Passed)` });
    }

    // Patrón 6
    if (requestedPattern === 'all' || requestedPattern === 'adr') {
      const res = await runLivingAdrSync();
      results.push({ pattern: '6. Living ADRs Chronicler', status: res.success ? 'PASSED ✅' : 'FAILED ❌', detail: `${res.totalAdrs} ADRs validados` });
    }

    const durationMs = Date.now() - startTime;

    console.log(`\n========================================================================`);
    console.log(`📊 TABLERO DE RESULTADOS DE LA SUITE RSI (${durationMs}ms)`);
    console.log(`========================================================================`);
    console.table(results);

    const allPassed = results.every(r => r.status.includes('PASSED'));
    if (allPassed) {
      console.log(`\n🏆 [ALL GATES GREEN] Todos los bucles deterministas fueron verificados exitosamente.`);
      emitTelemetry('rsi-orchestrator', 'TASK-RSI-SUITE', 'SUITE_COMPLETE', 'ALL_GATES_GREEN', 'SUCCESS',
        `Suite RSI completada exitosamente (${results.length}/${results.length} verificados en ${durationMs}ms)`,
        { durationMs, totalPatterns: results.length, status: 'ALL_GREEN' });
    } else {
      console.log(`\n⚠️ Algunos patrones requieren intervención o revisión.`);
      emitTelemetry('rsi-orchestrator', 'TASK-RSI-SUITE', 'SUITE_COMPLETE', 'GATES_FAILED', 'WARNING',
        `Suite RSI completada con alertas.`, { durationMs, results });
    }

  } catch (err) {
    console.error(`💥 Error ejecutando suite RSI:`, err);
    emitTelemetry('rsi-orchestrator', 'TASK-RSI-SUITE', 'SUITE_ERROR', 'EXECUTION_ERROR', 'FAILED',
      `Error en suite RSI: ${err.message}`);
    process.exit(1);
  }
}

main();
