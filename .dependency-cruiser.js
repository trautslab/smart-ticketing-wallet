/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-direct-db-in-adapters',
      severity: 'error',
      comment: 'Los adaptadores externos no pueden importar directamente la base de datos SQL',
      from: { path: '^src/integrations' },
      to: { path: '^src/core/database' }
    },
    {
      name: 'no-cross-integration-imports',
      severity: 'error',
      comment: 'Las integraciones no pueden importarse entre sí (Aislamiento de Plugins)',
      from: { path: '^src/integrations/payments' },
      to: { path: '^src/integrations/shipping' }
    }
  ]
};
