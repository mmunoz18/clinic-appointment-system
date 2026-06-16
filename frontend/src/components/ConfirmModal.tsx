type ConfirmModalProps = {
  title: string;
  message: React.ReactNode;
  warning?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmModal({
  title,
  message,
  warning,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2>{title}</h2>

        <p>{message}</p>

        {warning && <p className="modal-warning">{warning}</p>}

        <p className="modal-danger-text">
          This action cannot be undone.
        </p>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            {cancelText}
          </button>

          <button type="button" className="danger-button" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;