import Modal from './Modal';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary btn-sm">Cancel</button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className={`${danger ? 'btn-danger' : 'btn-primary'} btn-sm`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
