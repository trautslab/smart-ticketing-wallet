#!/usr/bin/env node
/**
 * 🛡️ Task Correlative & Registry Validator
 * Cortafuegos físico que previene colisiones, duplicaciones o creación a ciegas de tareas.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const tasksDir = resolve(process.cwd(), '.agents', 'tasks');
const registryPath = resolve(tasksDir, 'INDEX.md');

console.log('🔍 [Task Validator] Escaneando correlativos en .agents/tasks/...\n');

if (!existsSync(tasksDir)) {
  console.error('❌ Error: El directorio .agents/tasks/ no existe.');
  process.exit(1);
}

if (!existsSync(registryPath)) {
  console.error('❌ Error Crítico: Falta el registro central de correlativos .agents/tasks/INDEX.md');
  process.exit(1);
}

const registryContent = readFileSync(registryPath, 'utf-8');
const files = readdirSync(tasksDir).filter(
  (f) => f.startsWith('TASK-') && f.endsWith('.md') && f !== 'TASK_TEMPLATE.md'
);

const idMap = new Map();
let hasErrors = false;

for (const file of files) {
  const match = file.match(/^(TASK-\d{3})/i);
  if (!match) {
    console.error(`❌ [Formato Inválido] El archivo "${file}" no cumple el formato TASK-XXX-nombre.md`);
    hasErrors = true;
    continue;
  }

  const taskId = match[1].toUpperCase();

  // 1. Detectar duplicaciones de correlativos
  if (idMap.has(taskId)) {
    console.error(`🚨 [COLISIÓN DETECTADA] El correlativo "${taskId}" está duplicado:`);
    console.error(`    ↳ Archivo 1: ${idMap.get(taskId)}`);
    console.error(`    ↳ Archivo 2: ${file}`);
    hasErrors = true;
  } else {
    idMap.set(taskId, file);
  }

  // 2. Verificar que esté registrado en el INDEX.md
  if (!registryContent.includes(taskId)) {
    console.error(`⚠️ [Falta de Registro] La tarea "${taskId}" (${file}) no está registrada en .agents/tasks/INDEX.md`);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error('\n💥 ERROR: Se detectaron violaciones en los correlativos de tareas. Abortando.');
  process.exit(1);
}

console.log(`✅ [Éxito] ${idMap.size} tareas verificadas sin colisiones de correlativos:`);
for (const [id, file] of idMap.entries()) {
  console.log(`   ✔ ${id} ➔ ${file}`);
}
console.log('\n🎉 Task Correlative Registry: 100% VÁLIDO\n');
process.exit(0);
