# 🔄 [ACT-XXXX] Diagrama de Actividad: Flujo Lógico y Bifurcaciones

**Identificador:** `ACT-XXXX`  
**Caso de Uso Asociado:** [`UC-XXXX`](../../use-cases/UC-TEMPLATE.md)  
**Propósito:** Modelar el flujo de trabajo de negocio, puntos de decisión y ejecuciones paralelas.

---

## 1. Diagrama de Actividad / Flujo de Decisión

```mermaid
flowchart TD
    Start([Inicio del Proceso]) --> Input[Recibir Solicitud del Cliente]
    Input --> Validate{¿Payload y Esquema Válidos?}

    Validate -- No --> ErrValidation[Generar Error 422 Unprocessable]
    ErrValidation --> EndError([Fin con Error])

    Validate -- Sí --> CheckStock{¿Inventario Disponible?}
    
    CheckStock -- No --> ErrStock[Generar Error 409 Out of Stock]
    ErrStock --> EndError

    CheckStock -- Sí --> Reserve[Reservar Stock Temporalmente]
    Reserve --> ParallelExec[/Ejecutar en Paralelo/]

    ParallelExec --> ChargePayment[Procesar Cargo en Pasarela]
    ParallelExec --> SendTelemetry[Emitir Métricas a OpenTelemetry]

    ChargePayment --> CheckPayment{¿Cobro Exitoso?}

    CheckPayment -- No --> RollbackStock[Liberar Reserva de Stock]
    RollbackStock --> ErrPayment[Generar Error 402 Payment Required]
    ErrPayment --> EndError

    CheckPayment -- Sí --> FinalizeOrder[Confirmar Orden en DB]
    SendTelemetry --> JoinSync[\Sincronizar Tareas\]
    FinalizeOrder --> JoinSync

    JoinSync --> NotifyUser[Emitir Evento order.confirmed]
    NotifyUser --> EndSuccess([Fin Exitoso 201 Created])
```

## 2. Puntos Críticos de Decisión
1. **Validación de Schema:** Se detiene inmediatamente antes de cualquier llamada a base de datos.
2. **Reserva de Stock + Rollback:** Si el cobro falla, la reserva temporal se cancela atómicamente.
3. **Paralelismo Seguro:** La telemetría no bloquea la confirmación del pago.
