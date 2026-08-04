import React from "react";
import "./alert.scss";

interface AlertProps {
  type: string;
  closable?: boolean;
  onClose?: () => void;
  animate?: string;
  classNames?: string;
  children?: React.ReactNode;
}

const Alert: React.FC<AlertProps> = ({
  onClose,
  closable = false,
  animate = "fadeInUp",
  children,
  type = "danger",
  classNames,
}) => {
  return (
    <div
      className={`alert animate-${animate} u-bgcolor-neutral-${type} ${classNames} flex px-4`}
    >
      {closable && (
        <button className='close-btn-modal' onClick={onClose}>
          &times;
        </button>
      )}
      <div className='alert-content'>{children}</div>
    </div>
  );
};

export default Alert;
