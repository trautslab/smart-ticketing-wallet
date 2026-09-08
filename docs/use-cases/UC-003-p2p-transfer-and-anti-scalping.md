# UC-003: Transferencia P2P Segura y Gobernanza Anti-Revendedores

- **ID:** `UC-003`
- **Dominio:** Transferencia de Activos Digitales / Anti-Scalping
- **Actores:** Titular Original (Emisor), Nuevo Titular (Receptor), Bóveda de Tickets, Motor de Reglas Anti-Reventa
- **Precondición:** El emisor posee un boleto en estado `ACTIVE`.

---

## 1. Flujo Principal (Happy Path)

1. El Emisor selecciona un boleto en su billetera y pulsa "Transferir a Amigo".
2. Ingresa el nombre y correo del Receptor, junto con el valor acordado (menor o igual al valor facial).
3. El servicio `TransferService` verifica:
   - Que el emisor sea el titular legítimo actual.
   - Que el boleto esté en estado `ACTIVE`.
   - Que el número de traspasos previos no supere el límite permitido (`maxTransfers = 2`).
   - Que el precio no exceda el valor facial oficial (`faceValue`).
   - Que el momento de la transferencia no se encuentre dentro de la ventana de bloqueo previo al evento (`lockWindowSecondsBeforeGates = 7200s`).
4. Se ejecuta el **re-claveado criptográfico atómico**:
   - La semilla `seedHex` del emisor queda revocada y destruida en el acto.
   - Se genera una nueva semilla criptográfica de 256 bits para el receptor.
   - Se actualizan los datos de titularidad en la bóveda.
5. Se emite un registro inmutable en el libro contable de auditoría (`TransferRecord`) con las huellas digitales SHA-256 de la semilla previa y la nueva semilla.
6. El receptor visualiza de inmediato el boleto activo en su billetera móvil. Cualquier captura de pantalla o código previo en posesión del emisor queda completamente invalidado.

---

## 2. Flujos Excepcionales

### 2.1 Intento de Reventa con Sobreprecio
- **Condición:** El emisor intenta vender el boleto por un monto superior al valor facial oficial.
- **Acción:** El sistema rechaza la operación inmediatamente con error de violación de política anti-reventa.

### 2.2 Límite de Transferencias Superado
- **Condición:** El boleto ya ha sido transferido el número máximo de veces configurado por la producción.
- **Acción:** El sistema bloquea nuevos traspasos para evitar la especulación secundaria.
