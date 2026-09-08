---
name: deploy-pipeline
description: Orquesta y valida el despliegue multi-cloud agnóstico (AWS, GCP, Azure, OCI, Cloudflare, Supabase, Vercel) a través de los 4 ambientes (DEV, QA, UAT, PROD).
---

# 🚀 Skill: Pipeline de Despliegue Multi-Ambiente (`/deploy`)

Permite a los agentes IA y a los desarrolladores orquestar, validar y ejecutar el aprovisionamiento y despliegue continuo de la aplicación respetando las matrices de infraestructura y secretos.

---

## 📋 Invocación por Slash Command
```text
/deploy [ambiente: dev | qa | uat | prod] [--provider aws | gcp | azure | oci | cloudflare | supabase]
```

---

## 🛠️ Procedimiento de Ejecución del Agente

### 1. Ingestión de Topología y Secretos
- Lee la topología de despliegue en `docs/diagrams/deployment/DEP-001-template.md`.
- Consulta la matriz de ambientes en `docs/environments/ENV-MATRIX-template.md`.
- Extrae las credenciales y secretos requeridos desde el Vault / Secrets Manager o MCP correspondiente al ambiente objetivo.

### 2. Verificación de Quality Gates Previos
- **Si el destino es `QA`:** Valida que `npm run precommit:audit` esté 100% verde.
- **Si el destino es `UAT`:** Valida que `npm run rsi:adversarial` y `npm run rsi:perf` no tengan regresiones.
- **Si el destino es `PROD`:** Valida que `npm run rsi:swebench` y la firma de negocio (Sign-Off) estén completas.

### 3. Ejecución del Despliegue con Herramientas de Infraestructura
- Ejecuta los comandos correspondientes según el proveedor:
  - **Docker / Compose (Local/DEV):** `docker compose -f docker-compose.dev.yml up -d --build`
  - **Terraform / OpenTofu (Cloud):** `terraform apply -var-file=env/$AMBIENTE.tfvars -auto-approve`
  - **Serverless / Container CLI (Cloudflare / Vercel / Cloud Run):** `npx wrangler deploy --env $AMBIENTE` o `gcloud run deploy`

### 4. Verificación de Health Checks Deterministas Post-Despliegue
- Realiza sondeo HTTP con reintentos exponenciales hacia el endpoint `/health` y `/ready`:
  ```bash
  curl -f -s https://$HOST/health || exit 1
  ```
- Emite evento de telemetría de despliegue (`DEPLOY_COMPLETED`).
