# 🛡️ Invariantes Arquitectónicos y Límites Inviolables

Estos invariantes son **reglas duras no negociables** para cualquier agente de IA o desarrollador humano. Cualquier PR o commit que viole uno de estos invariantes debe ser rechazado automáticamente.

---

## 1. Límites de Capas y Dependencias
- **Aislamiento de Controladores:** Los controladores HTTP / Handlers NUNCA deben interactuar directamente con la capa de persistencia SQL o drivers de base de datos. Toda consulta debe encapsularse en un `Repository` o `DomainService`.
- **Independencia del Dominio:** La capa de entidades y reglas de negocio no debe depender de frameworks externos (Express, Nest, FastAPI, React).
- **Cero Consultas N+1:** Las consultas a colecciones de datos deben utilizar `JOIN`, `DataLoader` o batching explícito.

---

## 2. Seguridad & Secretos
- **Cero Secretos en Código:** Prohibido hardcodear API Keys, tokens JWT, contraseñas o URIs de base de datos. Todo debe cargarse vía variables de entorno validadas con schema.
- **Validación en Fronteras:** Toda entrada externa (query params, body, headers, webhooks) debe validarse estrictamente contra un esquema declarativo (Zod, Pydantic, etc.) antes de ingresar a la lógica de negocio.
- **Principio de Mínimo Privilegio:** Ningún endpoint debe exponer campos de entidades internas sensibles (e.g. `password_hash`, `internal_roles`) en sus DTOs de respuesta.

---

## 3. Integridad de Datos y Transacciones
- **Atomicidad Obligatoria:** Toda operación que modifique dos o más entidades relacionadas debe ejecutarse dentro de un bloque transaccional (`BEGIN ... COMMIT / ROLLBACK`).
- **Idempotencia en Operaciones Críticas:** Los endpoints que procesen pagos, transferencias o generación de órdenes deben exigir y validar cabeceras de idempotencia (`Idempotency-Key`).

---

## 4. Pruebas y Cobertura
- **No Test, No Merge:** Ningún nuevo endpoint, función de negocio o bugfix se considera terminado sin una prueba unitaria o de integración que reproduzca el caso de uso y sus escenarios de error.
- **Prohibido Modificar Tests para "Hacerlos Pasar":** Si un test falla tras un refactor, la implementación debe ajustarse para cumplir el contrato del test, nunca relajar las aserciones a menos que el RFC explícitamente cambie la regla de negocio.

---

## 5. Correlatividad e Inmutabilidad de Identificadores (Anti-Alucinación)
- **Prefijos Estrictos por Categoría:** Todo artefacto debe utilizar su prefijo unívoco inmutable con formato de 3 a 4 dígitos:
  - Requerimientos: `REQ-001`, `REQ-002`...
  - Casos de Uso: `UC-001`, `UC-002`...
  - Tareas Agénticas: `TASK-001`, `TASK-002`...
  - Registros de Arquitectura: `ADR-0001`, `ADR-0002`...
  - Diagramas de Despliegue: `DEP-001`, `DEP-002`...
  - Diagramas de Seguridad y Red: `SEC-001`, `SEC-002`...
  - Matrices de Ambiente: `ENV-001`, `ENV-002`...
  - Modelos FinOps: `FIN-001`, `FIN-002`...
  - Diagramas de Componentes: `CMP-001`, `CMP-002`...
  - Diagramas de Robustez: `ROB-001`, `ROB-002`...
  - Redes de Trazabilidad: `NET-001`, `NET-002`...
- **Prohibición Estricta de Duplicación y Reciclaje de IDs:** Queda estrictamente prohibido que un LLM o desarrollador asigne el mismo ID a dos archivos distintos o invente secuencias no correlativas.
- **Verificación en Pre-Commit:** El guardián determinista `npm run precommit:audit` escanea todo el repositorio y aborta el commit con `exit code 1` si detecta colisiones de IDs intra o inter-categoría.

---

## 6. Cobertura Exhaustiva de Alcance y Anti-Sesgo de Anexos (`INV-SCOPE-001`)
- **Prohibición del Sesgo de Anexos/Ejemplos (The Appendix Trap):** Queda estrictamente PROHIBIDO que un agente de IA asuma que una sección de "Ejemplos", "Historias de Usuario de Muestra" o "Anexos" al final de un documento de especificación técnica o PDF representa el alcance total del proyecto. Dichas secciones son ilustraciones pedagógicas no exhaustivas.
- **Mapeo Obligatorio Sección-a-Caso de Uso:** El agente DEBE auditar la sección central de **Alcance Funcional** módulo por módulo (§ 3.1, § 3.2, etc.) y sintetizar como mínimo un Caso de Uso formal (`UC-XXX`) por cada módulo funcional identificado.
- **Prohibición Estricta de Tareas y Código Huérfano (Anti-Orphan Rule):**
  - Toda tarea agéntica (`TASK-XXX`) en `.agents/tasks/` DEBE declarar explícitamente en sus metadatos el caso de uso del cual emana (`Caso de Uso: UC-XXX`).
  - Ningún módulo de código o test en `src/` puede crearse sin un Caso de Uso formal que lo justifique.
  - El guardián determinista `pre-commit-guard.mjs` verifica que ningún `TASK-XXX` quede huérfano de `UC-XXX`. Si falta el caso de uso en `docs/use-cases/`, el commit es rechazado automáticamente.
- **Protocolo de Ingestión en 3 Pasos:**
  1. *Inventario Exhaustivo de Secciones:* Extraer todos los títulos y módulos de la especificación funcional.
  2. *Matriz de Paridad Funcional:* Generar la tabla de cobertura en `docs/INDEX.md` (Módulo PDF $\rightarrow$ `UC-XXX` $\rightarrow$ `TASK-XXX`).
  3. *Grafo de Red Completo:* Reflejar todos los casos de uso en el diagrama [`NET-TEMPLATE`](../diagrams/use-case-network/NET-TEMPLATE.md) antes de escribir código.

---

## 7. Neutralidad de Plantillas y Prevención de Colisiones (`INV-TEMPLATE-001`)
- **Prohibición de Correlativos Numéricos en Plantillas:** Las plantillas reutilizables ubicadas en `docs/` o subdirectorios de arquitectura DEBEN nombrarse estrictamente con el sufijo `-TEMPLATE.md` (por ejemplo: `UC-TEMPLATE.md`, `SEQ-TEMPLATE.md`, `ADR-TEMPLATE.md`, `ENV-MATRIX-TEMPLATE.md`). Queda TERMINANTEMENTE PROHIBIDO nombrarlas con dígitos o correlativos ficticios (e.g. `UC-001-template.md`, `ADR-0001-template.md`), ya que esto induce a los LLMs a alucinar duplicaciones numéricas (`UC-001` plantilla vs `UC-001` real), omitir el inicio de la secuencia correlativa, o duplicar IDs en cascada dejando huérfanos los análisis previos.
- **Uso Obligatorio de Placeholders Neutros (`XXXX`):** Dentro del contenido de cualquier plantilla, los identificadores deben declararse como `[PREFIX-XXXX]` o `PREFIX-XXXX` (e.g. `UC-XXXX`, `ADR-XXXX`, `SEQ-XXXX`).
- **Protocolo de Instanciación de Nuevos Documentos:**
  1. Al crear un nuevo documento a partir de una plantilla, el agente/desarrollador debe clonar la plantilla hacia un nuevo archivo con el correlativo secuencial siguiente (e.g., el primer caso de uso se guardará en `docs/use-cases/UC-001-nombre-del-caso.md`).
  2. La plantilla original `*-TEMPLATE.md` DEBE preservarse intacta como molde reusable sin ser sobreescrita ni eliminada.
  3. En el archivo nuevo instanciado, reemplazar todos los `XXXX` por el número asignado (`001`).
  4. Ningún archivo con correlativo real puede contener `XXXX`.
- **Validación Determinista en Pre-Commit:**
  - El script determinista `pre-commit-guard.mjs` (Gate 1) audita que los archivos que contengan `TEMPLATE` en su nombre no posean números correlativos asignados, y los excluye del conteo de colisiones de IDs reales.
  - Al mismo tiempo, valida que ningún archivo de producción/especificación real use placeholders `XXXX`.

