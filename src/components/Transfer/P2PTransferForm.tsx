import React, { useState } from 'react';
import { Ticket } from '../../types';

interface P2PTransferFormProps {
  ticket: Ticket;
  onTransferComplete: (recipientName: string, recipientEmail: string, price: number) => void;
  onShowToast: (msg: string) => void;
}

export const P2PTransferForm: React.FC<P2PTransferFormProps> = ({
  ticket,
  onTransferComplete,
  onShowToast
}) => {
  const [recipientName, setRecipientName] = useState<string>('Camila Soto');
  const [recipientEmail, setRecipientEmail] = useState<string>('camila.soto@email.com');
  const [recipientDni, setRecipientDni] = useState<string>('72910482');
  const [transferPrice, setTransferPrice] = useState<number>(ticket.faceValue);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const maxPrice = ticket.faceValue;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Anti-scalping rule
    if (transferPrice > maxPrice) {
      setErrorMsg(`Violación de Política Anti-Reventa: El precio no puede exceder el valor nominal (${ticket.currency} $${maxPrice}).`);
      return;
    }

    if (!recipientEmail.includes('@') || recipientName.trim().length < 3) {
      setErrorMsg('Por favor completa todos los datos nominativos válidos del destinatario.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onTransferComplete(recipientName, recipientEmail, transferPrice);
      onShowToast(`🎉 Boleto transferido exitosamente a ${recipientName}. El seed criptográfico ha sido re-rotado.`);
    }, 600);
  };

  return (
    <div className="transfer-container">
      <div className="transfer-header">
        <h2 className="transfer-title">🔄 Transferencia P2P Nominativa y Segura</h2>
        <p className="transfer-sub">
          Transfiere tu entrada con garantía antifraude. Se genera una nueva semilla criptográfica de 256 bits,
          invalidando automáticamente cualquier código QR previo.
        </p>
      </div>

      <div className="anti-scalping-warning-box">
        <div className="warning-icon">🛡️</div>
        <div>
          <div className="warning-title">POLÍTICA ANTI-ESPECULACIÓN ACTIVA</div>
          <div className="warning-text">
            Por disposición del organizador, el precio máximo de transferencia es igual al valor nominal:
            <strong> {ticket.currency} ${ticket.faceValue.toFixed(2)}</strong>. Se prohíbe el sobreprecio.
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="transfer-form">
        <div className="form-group">
          <label htmlFor="recipient-name">Nombre y Apellidos del Destinatario (Nominativo):</label>
          <input
            id="recipient-name"
            type="text"
            className="form-input"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="recipient-email">Correo Electrónico del Destinatario:</label>
          <input
            id="recipient-email"
            type="email"
            className="form-input"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="recipient-dni">DNI / Documento de Identidad:</label>
            <input
              id="recipient-dni"
              type="text"
              className="form-input"
              value={recipientDni}
              onChange={(e) => setRecipientDni(e.target.value)}
              required
            />
          </div>

          <div className="form-group half">
            <label htmlFor="transfer-price">Precio de Cesión ({ticket.currency}):</label>
            <input
              id="transfer-price"
              type="number"
              className={`form-input ${transferPrice > maxPrice ? 'input-error' : ''}`}
              value={transferPrice}
              onChange={(e) => setTransferPrice(Number(e.target.value))}
              max={maxPrice}
              min={0}
              step={1}
              required
            />
            <span className="input-hint">Máximo permitido: ${maxPrice}</span>
          </div>
        </div>

        {errorMsg && <div className="form-error-banner">{errorMsg}</div>}

        <div className="transfer-summary-box">
          <div className="summary-row">
            <span>Boleto a transferir:</span>
            <strong>{ticket.id} ({ticket.eventName})</strong>
          </div>
          <div className="summary-row">
            <span>Ubicación:</span>
            <span>{ticket.section} • Asiento {ticket.seat}</span>
          </div>
          <div className="summary-row">
            <span>Re-Keying Criptográfico:</span>
            <span className="color-cyan">AUTOMÁTICO E INSTANTÁNEO</span>
          </div>
        </div>

        <button
          type="submit"
          className="btn-submit-transfer"
          disabled={isSubmitting || transferPrice > maxPrice}
        >
          <span>{isSubmitting ? 'Generando Nueva Semilla...' : '🔐 Confirmar Transferencia y Re-Clavear'}</span>
        </button>
      </form>
    </div>
  );
};
