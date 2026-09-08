# 🌳 Flujo de Trabajo: Paralelización de Subagentes con Git Worktrees

Este protocolo describe cómo orquestar múltiples agentes de IA trabajando concurrentemente sin colisiones ni conflictos de fusión (*merge conflicts*).

---

## 1. Principios de Aislamiento
1. **Vertical Slices:** Cada subagente tiene permiso de escritura exclusivo en su carpeta (`src/modules/<feature>/`).
2. **Git Worktree:** Cada subagente opera en un directorio físico separado en el disco (`.worktrees/task-XXX`).
3. **Eval Harness Autónomo:** Cada subagente corre su prueba local antes de solicitar el merge.

---

## 2. Comandos de Orquestación

```bash
# 1. Crear un worktree para un subagente
git worktree add -b feat/task-001-catalog .worktrees/task-001 main

# 2. Despachar al subagente en ese directorio
cd .worktrees/task-001 && node evals/harness.mjs --task task-001

# 3. Fusionar y limpiar el worktree al finalizar
git worktree remove --force .worktrees/task-001
git worktree prune
```
