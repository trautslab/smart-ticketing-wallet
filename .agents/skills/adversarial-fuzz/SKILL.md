---
name: adversarial-fuzz
description: Ejecuta auditorías de seguridad, pruebas de inyección y fuzzing semántico contra endpoints y servicios.
---

# 🛡️ Skill: Adversarial Hardening & Red-Teaming (`/adversarial`)

Permite a la IA actuar como un evaluador de seguridad (*Red Team*), generando vectores de ataque semánticos, payloads maliciosos y condiciones de carrera concurrentes para validar que los esquemas defensivos de la aplicación responden con `HTTP 400/409` estructurados en lugar de excepciones `HTTP 500`.

---

## 🚀 Invocación por Slash Command
```text
/adversarial [target_endpoint_or_service]
```

## 🛠️ Procedimiento de Ejecución del Agente
1. Examina los esquemas de entrada y contratos de API (`openapi.yaml` / Zod Schemas).
2. Genera vectores de ataque sintéticos (enteros negativos, payloads masivos, SQL/NoSQL injections, race conditions concurrentes).
3. Ejecuta el fuzzer determinista:
   ```bash
   node scripts/rsi/adversarial-fuzzer.mjs
   ```
4. **Riel Duro:** Si el servicio arroja cualquier `HTTP 500 Unhandled Exception`, el agente desarrollador debe implementar validaciones defensivas estrictas hasta obtener 0 excepciones.
