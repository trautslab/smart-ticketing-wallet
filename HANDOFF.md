# Project State & Handoff

**Última Actualización:** YYYY-MM-DD HH:MM (Zona Horaria)  
**Versión Actual:** `v0.1.0` (Trabajando hacia `v0.2.0`)  
**Rama Activa:** `feature/nombre-de-la-tarea`  

---

## 📍 1. Estado de la Sesión (Dónde quedamos)
- [x] Especificación técnica redactada en [`docs/specs/RFC-001-feature.md`](docs/specs/RFC-001-feature.md).
- [x] Migración / Modelos de datos creados.
- [ ] **En Curso:** Implementación del servicio de negocio en `src/services/example.ts`.
- [ ] **Pendiente:** Tests de integración y validación E2E.

---

## ⚠️ 2. Gotchas, Trampas & Bloqueadores
- *Ejemplo:* La API de terceros requiere la variable de entorno `MOCK_API_KEY=test_123` en desarrollo local.
- *Ejemplo:* El linter arroja advertencia en importaciones circulares en el módulo de auth.

---

## 🧪 3. Comandos Rápidos de Verificación
```bash
# 1. Instalar y compilar
npm install && npm run build

# 2. Correr tests del módulo activo
npm test -- src/services/example.test.ts

# 3. Validar tipos y linter
npm run typecheck && npm run lint
```

---

## 🎯 4. Próximos 3 Pasos Inmediatos
1. Finalizar lógica de reintento en `src/services/example.ts`.
2. Completar cobertura de tests unitarios en `tests/unit/example.test.ts`.
3. Registrar cambios en `CHANGELOG.md` y preparar commit `feat(core): add example service`.
