#!/usr/bin/env node
/**
 * 🎬 Live Multi-Agent Execution Simulator (TrautsLab AI-SDLC)
 * Levanta automáticamente el servidor HTTP/SSE, abre el navegador en http://localhost:3333
 * y transmite la ejecución de todos los agentes en tiempo real.
 */

import { createServer } from 'node:http';
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { exec } from 'node:child_process';

const PORT = 3333;
const htmlPath = resolve(process.cwd(), 'observability', 'index.html');
const eventsPath = resolve(process.cwd(), '.agents', 'telemetry', 'events.jsonl');
const dir = dirname(eventsPath);

if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

// Resetear eventos para la simulación
writeFileSync(eventsPath, '', 'utf-8');

const sseClients = new Set();

function readAllEvents() {
  if (!existsSync(eventsPath)) return [];
  const content = readFileSync(eventsPath, 'utf-8').trim();
  if (!content) return [];
  return content
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((l, idx) => {
      try {
        return { id: idx, ...JSON.parse(l) };
      } catch (_) {
        return null;
      }
    })
    .filter(Boolean);
}

function broadcastEvents() {
  const events = readAllEvents();
  const payload = `data: ${JSON.stringify(events)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (_) {
      sseClients.delete(client);
    }
  }
}

// Iniciar Servidor HTTP & SSE
const server = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.url === '/' || req.url === '/index.html') {
    if (!existsSync(htmlPath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Dashboard HTML no encontrado');
    }
    const html = readFileSync(htmlPath, 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  if (req.url === '/api/telemetry') {
    const events = readAllEvents();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(events));
  }

  if (req.url === '/api/telemetry/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    });

    const initialEvents = readAllEvents();
    res.write(`data: ${JSON.stringify(initialEvents)}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

const colors = {
  cyan: '\x1b[36m',
  sky: '\x1b[94m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function emit(agentId, taskId, phase, eventType, status, message, payload = {}, delayMs = 1800) {
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
  broadcastEvents();

  let color = colors.sky;
  if (agentId === 'subagent-1') color = colors.green;
  if (agentId === 'subagent-2') color = colors.yellow;
  if (agentId === 'subagent-3') color = colors.magenta;

  console.log(`${colors.bold}[${event.timestamp.split('T')[1].substring(0, 8)}]${colors.reset} ${color}[${agentId.toUpperCase()}]${colors.reset} ${colors.bold}${phase}${colors.reset} ➔ ${message}`);
  await delay(delayMs);
}

server.listen(PORT, async () => {
  console.log(`\n${colors.bold}${colors.sky}══════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.sky}  🎬 TRAUTSLAB AI-SDLC: SIMULADOR DE OBSERVABILIDAD EN TIEMPO REAL    ${colors.reset}`);
  console.log(`${colors.bold}${colors.sky}  🌐 Dashboard activo en: http://localhost:${PORT}                      ${colors.reset}`);
  console.log(`${colors.bold}${colors.sky}══════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  // Abrir automáticamente el navegador
  const openCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  try {
    exec(`${openCmd} http://localhost:${PORT}`);
    console.log(`🚀 ${colors.bold}Abriendo dashboard en tu navegador predeterminado...${colors.reset}\n`);
  } catch (_) {}

  // Esperar a que el navegador cargue y conecte el SSE
  await delay(2500);

  // FASE 1: Ingestión
  await emit('coordinator', 'INIT', 'INGESTION', 'SCOPE_INGESTED', 'SUCCESS',
    'Documento de alcance PDF ingerido (ShopFast S.A. - 20 páginas: 2,500 productos, Stripe, CourierFast)',
    { pages: 20, catalogItems: 2500, modulesDetected: 7 }, 2200);

  // FASE 2: Arquitectura
  await emit('coordinator', 'INIT', 'DESIGN', 'C4_GENERATED', 'SUCCESS',
    'Matriz de Arquitectura C4 (Context, Container, Component), BDD Gherkin y ERD generados en docs/',
    { c4Levels: 3, useCases: 3, diagrams: 4, adrs: 2 }, 2400);

  // FASE 3: Bloqueo de Tareas
  await emit('coordinator', 'TASK-REGISTRY', 'TASK_DISPATCH', 'SEQUENCE_LOCKED', 'SUCCESS',
    '7 contratos de tareas registrados y correlativos bloqueados atómicamente en .agents/tasks/INDEX.md',
    { tasksAllocated: ['TASK-001', 'TASK-002', 'TASK-003', 'TASK-004', 'TASK-005', 'TASK-006', 'TASK-007'] }, 2000);

  // FASE 4: Montaje Paralelo de Worktrees
  console.log(`\n${colors.bold}${colors.cyan}🌳 Spawneando 3 Subagentes en Git Worktrees Aislados...${colors.reset}`);
  await emit('subagent-1', 'TASK-001', 'WORKTREE_ISOLATION', 'WORKTREE_MOUNTED', 'RUNNING',
    'Worktree montado en directorio físico .worktrees/subagent-1 (rama feat/task-001-catalog)',
    { targetModule: 'src/modules/catalog/', isolationMode: 'GIT_WORKTREE' }, 1200);

  await emit('subagent-2', 'TASK-002', 'WORKTREE_ISOLATION', 'WORKTREE_MOUNTED', 'RUNNING',
    'Worktree montado en directorio físico .worktrees/subagent-2 (rama feat/task-002-cart)',
    { targetModule: 'src/modules/cart/', freeShippingThreshold: 50000 }, 1200);

  await emit('subagent-3', 'TASK-003', 'WORKTREE_ISOLATION', 'WORKTREE_MOUNTED', 'RUNNING',
    'Worktree montado en directorio físico .worktrees/subagent-3 (rama feat/task-003-orders)',
    { targetModule: 'src/modules/orders/', pciDssMode: 'STRIPE_ELEMENTS' }, 2200);

  // FASE 5: Codificación en Paralelo (Vertical Slices)
  console.log(`\n${colors.bold}${colors.cyan}⚙️ Subagentes programando simultáneamente en sus Vertical Slices...${colors.reset}`);
  await emit('subagent-1', 'TASK-001', 'CODING', 'CODE_WRITTEN', 'SUCCESS',
    'CatalogService implementado con búsqueda jerárquica y caché Redis L2 (< 1.0s latencia)',
    { files: ['catalog.service.ts', 'catalog.types.ts'], latencyTarget: '< 1000ms' }, 2200);

  await emit('subagent-2', 'TASK-002', 'CODING', 'CODE_WRITTEN', 'SUCCESS',
    'CartService implementado con persistencia dual y regla de envío gratis sobre $50,000',
    { files: ['cart.service.ts', 'cart.types.ts'], discountRuleApplied: true }, 2200);

  await emit('subagent-3', 'TASK-003', 'CODING', 'CODE_WRITTEN', 'SUCCESS',
    'OrderService y StripePaymentAdapter implementados con bloqueo transaccional ACID de inventario',
    { files: ['order.service.ts', 'stripe.adapter.ts'], acidLock: true }, 2400);

  // FASE 6: Eval Harness y Tests Unitarios Locales
  console.log(`\n${colors.bold}${colors.cyan}🧪 Ejecutando Evaluaciones SWE-bench locales por Worktree...${colors.reset}`);
  await emit('subagent-1', 'TASK-001', 'EVAL_HARNESS', 'TESTS_PASSED', 'SUCCESS',
    'Suite de tests unitarios de Catálogo: 100% PASSED (1.8ms)',
    { suite: 'catalog.service.test.mjs', tests: 1, passed: 1, durationMs: 1.8 }, 1800);

  await emit('subagent-2', 'TASK-002', 'EVAL_HARNESS', 'TESTS_PASSED', 'SUCCESS',
    'Suite de tests unitarios de Carrito: 100% PASSED (1.6ms)',
    { suite: 'cart.service.test.mjs', tests: 2, passed: 2, durationMs: 1.6 }, 1800);

  await emit('subagent-3', 'TASK-003', 'EVAL_HARNESS', 'TESTS_PASSED', 'SUCCESS',
    'Suite de tests unitarios de Checkout & Stripe: 100% PASSED (1.6ms)',
    { suite: 'order.service.test.mjs', tests: 2, passed: 2, durationMs: 1.6 }, 2200);

  // FASE 7: Merge Fast-Forward y Limpieza
  console.log(`\n${colors.bold}${colors.cyan}🔀 Integrando ramas y desmontando Worktrees...${colors.reset}`);
  await emit('coordinator', 'MERGE', 'MERGE', 'FAST_FORWARD_MERGE', 'SUCCESS',
    '3 Worktrees fusionados sin conflictos en rama main (git worktree remove & prune)',
    { branchesMerged: ['feat/task-001', 'feat/task-002', 'feat/task-003'], conflicts: 0, strategy: 'FAST_FORWARD' }, 2200);

  // FASE 8: Verificación Global de Quality Gates
  await emit('coordinator', 'ALL', 'QUALITY_GATES', 'GLOBAL_EVAL_PASSED', 'SUCCESS',
    'Global Eval Harness: 16/16 tests verdes (101ms), 0 fallos, Servidor MCP activo, Estado: ALL GATES GREEN',
    { totalTests: 16, totalPassed: 16, overallDurationMs: 101, status: 'PASSED' }, 1500);

  console.log(`\n${colors.bold}${colors.green}══════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.green}  🎉 SIMULACIÓN COMPLETADA AL 100%: 14/14 EVENTOS TRANSMITIDOS EN VIVO ${colors.reset}`);
  console.log(`${colors.bold}${colors.green}  👉 El dashboard sigue activo en http://localhost:${PORT}             ${colors.reset}`);
  console.log(`${colors.bold}${colors.green}     (Presiona Ctrl+C para detener el servidor)                       ${colors.reset}`);
  console.log(`${colors.bold}${colors.green}══════════════════════════════════════════════════════════════════════${colors.reset}\n`);
});
