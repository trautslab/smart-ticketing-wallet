# Guía de Contribución & Estándares de Ingeniería

## 1. Convención de Ramas
- `feat/nombre-kebab-case`: Nuevas funcionalidades.
- `fix/issue-id-descripcion`: Corrección de errores.
- `refactor/modulo-descripcion`: Reestructuración de código sin cambio funcional.
- `docs/tema-actualizado`: Actualizaciones de documentación y diagramas.

## 2. Conventional Commits & SemVer
Cada commit debe seguir la estructura: `<tipo>(<ámbito opcional>): <descripción imperativa>`

| Tipo | Impacto SemVer | Ejemplo |
| :--- | :--- | :--- |
| `feat` | **MINOR** (v0.X.0) | `feat(auth): implement token refresh strategy` |
| `fix` | **PATCH** (v0.0.X) | `fix(cache): resolve ttl invalidation race condition` |
| `refactor`, `perf` | **PATCH** | `perf(query): index user email lookup` |
| `docs`, `style`, `test`, `chore` | Ninguno | `docs(specs): add sequence diagram for payment flow` |
| `BREAKING CHANGE:` o `!` | **MAJOR** (vX.0.0) | `feat(api)!: upgrade rest endpoints to v2 schema` |

## 3. Quality Gates Locales
Antes de abrir un Pull Request o cerrar una tarea:
1. `npm run lint` — Cero errores o advertencias.
2. `npm run typecheck` — Validación estricta de tipos.
3. `npm test` — Suite de pruebas unitarias y de integración pasando.
4. Actualizar `CHANGELOG.md` en la sección `[Unreleased]`.
5. Actualizar `HANDOFF.md` con el estado final.
