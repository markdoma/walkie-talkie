import React from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-text-main mb-4">{title}</h2>
        <p className="text-text-secondary mb-8">{message}</p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-gray-200 text-text-secondary font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            No
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-2.5 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
