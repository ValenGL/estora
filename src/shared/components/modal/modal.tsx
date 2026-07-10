import React from "react";
import "./modal.scss";

interface ModalProps {
  onClose: () => void;
  children?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ onClose, children }) => {
  return (
    <div className='modal-overlay'>
      <div className='modal'>
        <button className='close-btn-modal' onClick={onClose}>
          &times;
        </button>
        <div className='modal-content'>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
