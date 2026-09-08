# Task List: Refinamiento UX de la Billetera del Espectador y Geocercas v2.2.0

## Phase 1: Aislamiento y Limpieza de Vista del Espectador
- [x] **Task 1: Eliminar personalización de marca (`🎨`) en vista del cliente**
  - Quitar botón de paleta de colores del header en modo espectador.
  - Quitar el modal `BrandingModal` de la experiencia del asistente.
  - Mantener marca oficial del evento fija y consistente.
- [x] **Task 2: Eliminar accesos de personal y PINs de la vista del cliente**
  - Quitar botón `Staff 🔒` de la barra inferior de navegación del cliente.
  - Mantener únicamente `🎫 Mi Entrada` y `🔄 Transferir` en la barra inferior para el asistente.
  - Quitar cualquier card de PIN visible en la pantalla principal.
- [x] **Task 3: Enrutamiento dedicado e independiente para el personal (`/operator`, `/auditor`, `/boardroom`)**
  - Permitir acceso al operador únicamente mediante la URL `/operator` o `?role=operator`.
  - Aislar totalmente las credenciales y las herramientas de torniquete del cliente común.

## Checkpoint 1
- [x] `https://smart-ticketing-wallet.pages.dev/` muestra una experiencia 100% limpia para el espectador sin ninguna herramienta de personal ni cambio de marcas.

## Phase 2: Funcionalidad Real de Geocercas y Billeteras
- [x] **Task 4: Conectar Geocerca Perimetral al Renderizado del QR**
  - Conectar el estado `isInsidePerimeter` de `GeofenceControlBar` con `TicketCard` y `DynamicQrDisplay`.
  - Al pulsar "Simular Fuera": aplicar `filter: blur(14px)` al QR, ocultar el código de barras y desplegar overlay: *"🔒 QR BLOQUEADO HASTA LLEGAR AL ESTADIO (Perímetro 500m)"*.
  - Al pulsar "Simular Dentro": reactivar el QR fluido y el segundero de 15s.
- [x] **Task 5: Detección de Sistema Operativo para Apple Wallet / Google Wallet**
  - Analizar `navigator.userAgent`:
    - En Android (Redmi Note 12S): mostrar únicamente *"Guardar en Google Wallet"*.
    - En iOS / Safari / Mac: mostrar únicamente *"Agregar a Apple Wallet"*.
  - Eliminar la descarga de archivos `.json` crudos en el navegador móvil.
  - Desplegar modal nativo explicativo de pase oficial firmado.

## Phase 3: Humanización de Textos y Simulación Multiboleto
- [x] **Task 6: Humanización de Textos y Vocabulario Amigable**
  - Cambiar "SEED CRIPTOGRÁFICO ROTATIVO" por *"Entrada Digital Segura 🛡️ (Protección Anti-Clonación Activa)"*.
  - Cambiar "ANTI-SCREENSHOT ACTIVO" por *"Código Dinámico 15s (Capturas estáticas invalidadas)"*.
  - Agregar tooltip explicativo amigable al botón de Respaldo Acústico.
- [x] **Task 7: Simulación de Múltiples Boletos (`?ticket=...`)**
  - Soportar parámetro `?ticket=TKT-LIMA-2026-002` o `?ticket=TKT-LIMA-2026-003` para ver diferentes boletos, zonas (VIP, Campo A, Tribuna) y titulares.

## Phase 4: Pruebas y Despliegue
- [x] **Task 8: Batería de Pruebas y Quality Gates**
  - Ejecutar `npm test` y `npm run precommit:audit`.
  - Validar 0 CVEs en `npm audit`.
- [x] **Task 9: Despliegue en Producción**
  - Desplegar versión `v2.2.0` en Cloudflare Pages.
  - Verificar visualmente en navegador headless con resolución de Redmi Note 12S.
