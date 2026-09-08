---
name: auto-perf
description: Optimiza de forma autónoma el rendimiento de un módulo o endpoint midiendo latencia p95 en Git Worktree aislado.
---

# ⚡ Skill: Auto-Performance Optimization Loop (`/auto-perf`)

Permite a la IA analizar cuellos de botella de I/O o cómputo, formular hipótesis algorítmicas o de caché, y verificar mejoras objetivas en un entorno reproducible.

---

## 🚀 Invocación por Slash Command
```text
/auto-perf [target_module_or_service] [--threshold 15]
```

## 🛠️ Procedimiento de Ejecución del Agente
1. Lee el código del módulo objetivo en `src/`.
2. Mide la línea base ejecutando:
   ```bash
   node scripts/rsi/auto-perf-loop.mjs --module $TARGET_MODULE
   ```
3. Formula hipótesis de refactorización (ej. índices, LRU cache, pipelines concurrentes).
4. Aplica la mutación en un Git Worktree efímero.
5. Re-ejecuta el benchmark.
6. **Riel Duro:** Si $\Delta p95 \ge 15\%$ y pasan el 100% de los tests unitarios $\rightarrow$ Fast-Forward Merge. Si hay regresión $\rightarrow$ Rollback automático.
