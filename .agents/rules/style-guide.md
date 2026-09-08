# 🎨 Guía de Estilo & Buenas Prácticas de Código

## 1. Convenciones de Tipado
- Utilizar **TypeScript Estricto** / Tipado Estático fuerte.
- Evitar `any`. Si el tipo es verdaderamente desconocido, utilizar `unknown` y aplicar Type Guards o esquemas de validación.
- Exportar interfaces y tipos desde archivos dedicados `types.ts` o indexados por módulo.

## 2. Manejo de Errores y Excepciones
- Crear clases de error de dominio derivadas de una clase base común (e.g. `DomainError`, `NotFoundError`, `UnauthorizedError`, `ConflictError`).
- Las funciones asíncronas no deben dejar promesas sin capturar (`unhandledRejections`).
- Los bloques `try/catch` deben capturar errores específicos y enriquecer el contexto con mensajes descriptivos.

## 3. Nombrado y Modularidad
- **Archivos:** `kebab-case.ts` (e.g. `order-processor.ts`, `auth-middleware.test.ts`).
- **Clases y Tipos:** `PascalCase` (e.g. `OrderRepository`, `AuthPayload`).
- **Funciones y Variables:** `camelCase` (e.g. `calculateTotalAmount`, `userSession`).
- **Constantes Globales / Enums:** `UPPER_SNAKE_CASE` (e.g. `MAX_RETRY_ATTEMPTS`).
- **Funciones Pequeñas y de Propósito Único:** Máximo 30-40 líneas por función siempre que sea posible.
