type ModalProps = {
  titleId: string;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
};

function Modal({ titleId, title, children, onClose }: ModalProps) {
  return (
    <div className="modal-backdrop">
      <div
        className="modal-card reusable-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className="modal-close-button"
            aria-label="Close modal"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
