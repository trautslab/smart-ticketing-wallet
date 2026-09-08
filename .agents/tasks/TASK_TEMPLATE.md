# [TASK-001] Título Descriptivo de la Tarea

**ID:** `TASK-001`  
**Prioridad:** [CRITICAL | HIGH | MEDIUM | LOW]  
**Caso de Uso / RFC Asociado:** [`docs/specs/RFC-001-template.md`](../../docs/specs/RFC-001-template.md)  
**Asignado a:** Agente IA / Ingeniero  
**Branch:** `feat/task-001-descripcion`  

---

## 🎯 1. Objetivo & Contexto
[Explicación clara y sin ambigüedad del resultado exacto esperado al completar esta tarea.]

## 🚫 2. Fuera de Alcance (Non-Goals)
- No modificar el esquema de base de datos de usuarios.
- No incluir integración con UI frontend en este ticket.

## 🛡️ 3. Invariantes Específicos de la Tarea
- Debe respetar [`invariants.md`](../rules/invariants.md).
- La latencia añadida en el endpoint debe ser inferior a 10ms.
- Mantener retrocompatibilidad total con la API v1.

## ✅ 4. Criterios de Aceptación (Definición de Terminado)
- [ ] Implementar la función `X` en `src/services/X.ts`.
- [ ] Agregar tests unitarios con cobertura > 90% para los nuevos métodos.
- [ ] Ejecutar el comando de evaluación y obtener 100% de aserciones exitosas.
- [ ] Actualizar `CHANGELOG.md` en la sección `[Unreleased]`.

## 🧪 5. Comando de Evaluación (Eval Harness)
```bash
# Comando exacto que el agente debe ejecutar para validar la tarea
node evals/harness.mjs --task task-001
```
