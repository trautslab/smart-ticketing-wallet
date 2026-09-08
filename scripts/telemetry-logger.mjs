#!/usr/bin/env node
/**
 * 📡 Telemetry Logger Helper
 * Utilidad CLI para emitir eventos estructurados a .agents/telemetry/events.jsonl
 * Uso: node scripts/telemetry-logger.mjs --agent subagent-1 --task TASK-001 --phase CODING --event CODE_WRITTEN --status SUCCESS --msg "Mensaje descriptivo" --payload '{"key":"value"}'
 */

import { appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const args = process.argv.slice(2);

function getArg(flag, defaultVal = '') {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
}

const agentId = getArg('--agent', 'coordinator');
const taskId = getArg('--task', 'GENERAL');
const phase = getArg('--phase', 'EXECUTION');
const eventType = getArg('--event', 'EVENT');
const status = getArg('--status', 'SUCCESS');
const message = getArg('--msg', 'Operación completada');
const payloadRaw = getArg('--payload', '{}');

let payload = {};
try {
  payload = JSON.parse(payloadRaw);
} catch (_) {
  payload = { raw: payloadRaw };
}

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

const eventsPath = resolve(process.cwd(), '.agents', 'telemetry', 'events.jsonl');
const dir = dirname(eventsPath);

if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

appendFileSync(eventsPath, JSON.stringify(event) + '\n', 'utf-8');
console.log(`📡 [Telemetry] Evento registrado: [${agentId}] [${phase}] ${message}`);
