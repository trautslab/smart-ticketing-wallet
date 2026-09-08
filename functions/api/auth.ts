// Staff Authentication & Role-Based Access Control (RBAC/ABAC)

export interface StaffUser {
  id: string;
  name: string;
  role: 'operator' | 'auditor' | 'boardroom';
  title: string;
  badgeId: string;
  permissions: string[];
  assignedGate?: string;
  token: string;
}

const STAFF_DATABASE: Record<string, Omit<StaffUser, 'token'>> = {
  'OP-2026': {
    id: 'staff-op-01',
    name: 'Juan Pérez (Torniquete)',
    role: 'operator',
    title: 'Operador de Control de Accesos',
    badgeId: 'BADGE-OP-741',
    permissions: ['scan_qr', 'scan_nfc', 'switch_gate', 'view_station_stats'],
    assignedGate: 'GATE-A'
  },
  'AUD-2026': {
    id: 'staff-aud-01',
    name: 'Elena Rostova (CISO)',
    role: 'auditor',
    title: 'Auditora de Seguridad Criptográfica',
    badgeId: 'BADGE-SEC-009',
    permissions: ['view_audit_ledger', 'reconcile_mesh', 'export_ledger', 'view_security_alerts']
  },
  'DIR-2026': {
    id: 'staff-dir-01',
    name: 'Comité Ejecutivo / Directorio',
    role: 'boardroom',
    title: 'Directorio Ejecutivo & Promotor',
    badgeId: 'BADGE-DIR-001',
    permissions: ['view_boardroom_roi', 'view_fraud_metrics', 'view_financials']
  }
};

export async function onRequestPost(context: { request: Request }): Promise<Response> {
  try {
    const body = await context.request.json() as { pin?: string; role?: string };
    const pin = (body.pin ?? '').trim().toUpperCase();

    // Check by pin code
    let staffData = STAFF_DATABASE[pin];

    // If matching by role shorthand
    if (!staffData && body.role) {
      const matchEntry = Object.values(STAFF_DATABASE).find(s => s.role === body.role);
      if (matchEntry) {
        staffData = matchEntry;
      }
    }

    if (!staffData) {
      return new Response(
        JSON.stringify({
          authenticated: false,
          error: 'Credencial o PIN de personal inválido. Use OP-2026, AUD-2026 o DIR-2026.'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sessionToken = `STAFF_JWT_${staffData.role}_${Date.now()}`;
    const user: StaffUser = {
      ...staffData,
      token: sessionToken
    };

    return new Response(
      JSON.stringify({
        authenticated: true,
        user
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ authenticated: false, error: err.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
