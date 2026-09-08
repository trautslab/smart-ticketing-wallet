import React, { useState } from 'react';
import { OrganizerBrand } from '../../types';

interface BrandingModalProps {
  isOpen: boolean;
  currentBrand: OrganizerBrand;
  currentCustomName: string;
  onSaveBrand: (brand: OrganizerBrand, customName: string) => void;
  onClose: () => void;
}

export const BrandingModal: React.FC<BrandingModalProps> = ({
  isOpen,
  currentBrand,
  currentCustomName,
  onSaveBrand,
  onClose
}) => {
  const [selectedBrand, setSelectedBrand] = useState<OrganizerBrand>(currentBrand);
  const [customName, setCustomName] = useState<string>(currentCustomName);

  if (!isOpen) return null;

  const handleApply = () => {
    onSaveBrand(selectedBrand, customName);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">🎨 Personalización de Marca / Organizador</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <p className="modal-desc">
            Adapta la identidad visual de la aplicación al promotor o evento deseado:
          </p>

          <div className="brand-options-list">
            <label className={`brand-option-item ${selectedBrand === 'tiketya' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="brand-choice"
                checked={selectedBrand === 'tiketya'}
                onChange={() => setSelectedBrand('tiketya')}
              />
              <div className="option-info">
                <span className="option-title">TiketYA! Smart Ticket (Predeterminado)</span>
                <span className="option-desc">Identidad oficial TiketYA con estética TikTok (Cyan / Crimson).</span>
              </div>
            </label>

            <label className={`brand-option-item ${selectedBrand === 'rock' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="brand-choice"
                checked={selectedBrand === 'rock'}
                onChange={() => setSelectedBrand('rock')}
              />
              <div className="option-info">
                <span className="option-title">Rock Festival Live 2026</span>
                <span className="option-desc">Promotora de conciertos masivos y estadios.</span>
              </div>
            </label>

            <label className={`brand-option-item ${selectedBrand === 'custom' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="brand-choice"
                checked={selectedBrand === 'custom'}
                onChange={() => setSelectedBrand('custom')}
              />
              <div className="option-info">
                <span className="option-title">Marca Personalizada del Organizador</span>
                <span className="option-desc">Escribe el nombre de tu empresa, festival o boletera.</span>
              </div>
            </label>
          </div>

          {selectedBrand === 'custom' && (
            <div className="custom-brand-input-group">
              <label htmlFor="custom-brand-name">Nombre de tu Marca:</label>
              <input
                id="custom-brand-name"
                type="text"
                className="form-input"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ej: Teleticket, LiveNation, TuBoleto"
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-modal-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-modal-save" onClick={handleApply}>Guardar y Aplicar</button>
        </div>
      </div>
    </div>
  );
};
