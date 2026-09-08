# Implementation Plan: Refinamiento UX de la Billetera del Espectador, Geocercas Reales y Aislamiento de Rutas v2.2.0

## Overview
Resolver todas las observaciones del usuario planteadas en el audio:
1. Aislar por completo la vista del espectador eliminando herramientas de organizador (cambio de marca) y accesos de personal (PINs) de `/`.
2. Habilitar la ruta separada `/operator` para el personal sin exponer credenciales en la vista pública.
3. Conectar la geocerca perimetral para que "Simular Fuera" bloquee y desenfoque efectivamente el código QR con mensaje de protección.
4. Detectar el sistema operativo del usuario (`Android` vs `iOS`) para mostrar únicamente el botón de billetera correspondiente (Google Wallet para Android, Apple Wallet para iOS) y eliminar la descarga de archivos JSON crudos.
5. Humanizar el lenguaje del boleto eliminando la jerga técnica ("Seed Criptográfico", etc.).
6. Proveer simulación de múltiples boletos desde el backend.
7. Documentar formalmente el funcionamiento del Respaldo Acústico y Contactless NFC.

## Task List

### Phase 1: Aislamiento y Limpieza de Vista del Espectador
- [ ] Task 1: Eliminar botón de personalización de marca (`🎨`) y modal de la app del espectador.
- [ ] Task 2: Eliminar botón de personal de la barra inferior y cards con PINs de la vista del cliente. Dejar solo `🎫 Mi Entrada` y `🔄 Transferir`.
- [ ] Task 3: Configurar rutas independientes basadas en URL (`/operator`, `/auditor`, `/boardroom`) para que el personal ingrese únicamente por su propia dirección.

### Checkpoint: Vista de Espectador Aislada
- [ ] La app en `/` no contiene ninguna referencia a operadores, torniquetes, PINs ni cambio de marcas.

### Phase 2: Funcionalidad Real de Geocercas y Billeteras Nativas
- [ ] Task 4: Conectar el estado de geocerca perimetral al componente `DynamicQrDisplay`: cuando el estado sea "FUERA DEL PERÍMETRO", desenfocar el QR con filtro esmerilado (`blur(14px)`) y superponer candado de seguridad.
- [ ] Task 5: Implementar detector de sistema operativo (`Android` vs `iOS`): mostrar exclusivamente "Guardar en Google Wallet" en Android y "Agregar a Apple Wallet" en iOS.
- [ ] Task 6: Reemplazar descarga de JSON crudo por modal de pase oficial o enlace nativo.

### Checkpoint: Geocerca y Billeteras
- [ ] "Simular Fuera" bloquea el QR visualmente en tiempo real.
- [ ] En un celular Android (Redmi Note 12S) solo aparece Google Wallet.

### Phase 3: Humanización de Textos y Simulación Multiboleto
- [ ] Task 7: Reemplazar textos técnicos ("Seed Criptográfico Rotativo", "Anti-screenshot") por descripciones amigables para el usuario común.
- [ ] Task 8: Permitir simular y cargar diferentes boletos (`TKT-LIMA-2026-VIP`, `TKT-LIMA-2026-002`, `TKT-LIMA-2026-003`) mediante query param `?ticket=...`.

### Phase 4: Validación y Despliegue
- [ ] Task 9: Ejecutar batería de tests automatizados (`npm test`) y verificar 0 CVEs (`npm audit`).
- [ ] Task 10: Ejecutar pre-commit guard y desplegar versión `v2.2.0` en Cloudflare Pages.
