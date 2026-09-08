#!/usr/bin/env node
/**
 * 🧪 AI-SDLC Eval Harness
 * Evaluador automatizado estilo SWE-bench / Minions para agentes de IA.
 * Ejecuta pruebas estructuradas y devuelve feedback en JSON / Markdown para auto-corrección.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
const taskIndex = args.indexOf('--task');
const taskId = taskIndex !== -1 ? args[taskIndex + 1] : 'eval-task-001';

console.log(`\n🤖 [AI-SDLC Eval Harness] Iniciando evaluación para tarea: ${taskId}\n`);

const taskFilePath = resolve(process.cwd(), 'evals', 'tasks', `${taskId}.json`);

if (!existsSync(taskFilePath)) {
  console.error(`❌ Error: No se encontró la definición de la tarea en: ${taskFilePath}`);
  process.exit(1);
}

const taskDef = JSON.parse(readFileSync(taskFilePath, 'utf-8'));
let totalChecks = 0;
let passedChecks = 0;
const results = [];

for (const check of taskDef.checks) {
  totalChecks++;
  process.stdout.write(`⏳ Evaluando check: [${check.id}] ${check.description}... `);

  try {
    if (check.type === 'file_exists') {
      const target = resolve(process.cwd(), check.path);
      if (existsSync(target)) {
        console.log('✅ PASÓ');
        passedChecks++;
        results.push({ id: check.id, status: 'PASSED' });
      } else {
        console.log('❌ FALLÓ (Archivo no existe)');
        results.push({ id: check.id, status: 'FAILED', reason: `El archivo ${check.path} no existe.` });
      }
    } else if (check.type === 'command') {
      execSync(check.command, { stdio: 'pipe', encoding: 'utf-8' });
      console.log('✅ PASÓ');
      passedChecks++;
      results.push({ id: check.id, status: 'PASSED' });
    }
  } catch (err) {
    console.log('❌ FALLÓ (Ejecución fallida)');
    results.push({
      id: check.id,
      status: 'FAILED',
      reason: err.message,
      stdout: err.stdout?.toString(),
      stderr: err.stderr?.toString()
    });
  }
}

const successRate = ((passedChecks / totalChecks) * 100).toFixed(1);
console.log(`\n📊 [Resultado de Evaluación] ${passedChecks}/${totalChecks} checks pasados (${successRate}% éxito)`);

if (passedChecks === totalChecks) {
  console.log('🎉 STATUS: PASSED — Todos los invariantes y pruebas de la tarea se cumplen.\n');
  process.exit(0);
} else {
  console.log('⚠️ STATUS: FAILED — El agente debe corregir los fallos listados arriba.\n');
  process.exit(1);
}
