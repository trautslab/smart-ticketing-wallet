# 🤖 Protocolo de Empaquetado y Generación Autónoma de Pull Requests

Cuando un agente autónomo concluye una tarea, debe ejecutar este protocolo estricto antes de solicitar revisión humana o fusionar el código:

---

## 1. Verificación de Quality Gates
El agente ejecuta secuencialmente:
1. `npm run lint` — Confirmar cero errores y formateo según [`style-guide.md`](../rules/style-guide.md).
2. `npm run typecheck` — Validar tipado estático al 100%.
3. `node evals/harness.mjs --task <TASK_ID>` — Confirmar que el harness de evaluación devuelve status `PASSED`.

---

## 2. Estructura del Pull Request Generado

El agente debe redactar la descripción del PR con la siguiente estructura estandarizada:

```markdown
### 🎯 Contexto & Objetivo
Resuelve [TASK-XXX]. Implementa la funcionalidad descrita en la especificación [RFC-XXX].

### 🛠️ Cambios Realizados
- **[Componente / Módulo A]:** Breve descripción de la implementación.
- **[Componente / Módulo B]:** Breve descripción del refactor / test añadido.

### 🛡️ Invariantes Verificados
- [x] Cero consultas N+1 añadidas.
- [x] Sin variables de entorno hardcodeadas.
- [x] Tests unitarios y de integración agregados.

### 🧪 Evidencia de Ejecución (Test Logs)
\`\`\`text
✓ tests/unit/order-service.test.ts (4 tests passed)
✓ evals/harness.mjs --task task-001 (STATUS: PASSED - 100% assertions green)
\`\`\`

### 📦 Trazabilidad
- Actualizado \`CHANGELOG.md\` bajo \`[Unreleased]\`.
- Actualizado \`HANDOFF.md\` con el estado final.
```
