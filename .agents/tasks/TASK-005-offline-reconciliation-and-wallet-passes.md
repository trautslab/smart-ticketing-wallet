# TASK-005: Motor de Conciliación de Lotes Offline y Compatibilidad con Billeteras Nativas (Apple / Google)

**Estado:** COMPLETED  
**Prioridad:** ALTA  
**Componente:** `src/core/reconciliation-service.ts`, `src/core/wallet-pass-adapter.ts`, `wrangler.jsonc`  

---

## 🎯 Objetivo
Implementar el motor de reconciliación por lotes de eventos fuera de línea (`ReconciliationService`) para consolidar admisiones cuando el estadio recupera conectividad a Internet, resolver colisiones concurrentes y generar estructuras de pases dinámicos para Apple Wallet (`PKPass`) y Google Wallet (`GenericPass`), mitigando la fricción de descarga de apps señalada en la investigación.

## 📋 Criterios de Aceptación
1. **Conciliación de Lotes Offline:** Consolidar lotes de escaneos de múltiples puertas con detección de duplicados concurrentes (`ReconciliationConflict`).
2. **Compatibilidad con Apple & Google Wallet:** Generación de estructuras de datos estándar para Apple Wallet (`pass.json`) y Google Wallet Pass.
3. **Despliegue Perenne en Cloudflare:** Proyecto Cloudflare Pages desplegado y accesible públicamente, con configuración de servidor MCP persistente.
4. **Protección Timing Attack:** Verificación de hash con `crypto.timingSafeEqual`.
5. **Tests Automatizados:** 100% de tests unitarios pasando.

---

## 🔗 Trazabilidad AI-SDLC
- **Requisito / Caso de Uso:** `UC-001`, `UC-002`, `UC-003`, `UC-004`
- **Evaluación Automatizada:** `evals/tasks/task-004.json`
