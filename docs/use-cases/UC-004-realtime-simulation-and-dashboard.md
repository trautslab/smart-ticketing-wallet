# UC-004: Observabilidad en Tiempo Real y Consola de Simulación

- **ID:** `UC-004`
- **Dominio:** Observabilidad Perimetral / Telemetría de Eventos
- **Actores:** Operador de Estadio, Auditor de Seguridad, Desarrollador/Agente IA
- **Precondición:** El servidor de observabilidad o CLI de simulación está inicializado.

---

## 1. Flujo Principal (Happy Path)

1. El Operador o Auditor inicia la consola de simulación interactiva con `npm run demo:live` o el dashboard web con `npm run dashboard`.
2. La consola renderiza la billetera móvil del asistente, visualizando la rotación del código QR cada 15 segundos con cuenta regresiva.
3. Se ejecuta la validación en tiempo real en los molinetes perimetrales, reportando la latencia en milisegundos (<80ms).
4. El sistema simula ataques de repetición (Replay Attack) para verificar que las compuertas se mantengan cerradas ante capturas compartidas.
5. Se visualiza la transferencia P2P y la sincronización por malla local (Mesh LAN) entre molinetes.
