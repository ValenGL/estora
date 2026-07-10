"use client";

import "./button.scss";
interface ButtonProps {
  text?: string;
  version: string;
  type?: "submit" | "reset" | "button";
  block?: boolean;
  dropdown?: boolean;
  select?: boolean;
  color?: string;
  isExpanded?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  // button text
  text = undefined,
  // primary, secondary, outlined, danger, disabled
  version = "primary",
  // button action, undefined = submit
  type = undefined,
  // block = 100% width
  block = false,
  color = undefined,
  dropdown = false,
  select = false,
  isExpanded,
  onClick = undefined,
  children = undefined,
}) => {
  const btnClass = block ? "btn btn-block" : "btn";

  if (dropdown) {
    return (
      <div className='btn-wrapper'>
        <button
          className={`${btnClass} btn-${version} ${
            dropdown && "dropdown text-nowrap"
          } ${color ? `u-color-estora-${color}` : ""} ${
            isExpanded ? "active" : ""
          }`}
          type={type}
          onClick={onClick}
        >
          {text}
          <span>^</span>
        </button>
      </div>
    );
  } else if (select) {
    return (
      <div className='btn-wrapper'>
        <button
          className={`${btnClass} btn-${version} ${
            select && "select text-nowrap"
          } ${color ? `u-color-estora-${color}` : ""} ${
            isExpanded ? "active" : ""
          }`}
          type={type}
          onClick={onClick}
        >
          {text}
          <span>^</span>
        </button>
      </div>
    );
  } else {
    return (
      <div className='btn-wrapper'>
        <button
          className={`${btnClass} btn-${version} u-color-estora-${color}`}
          type={type}
          onClick={onClick}
        >
          {text}
          {children}
        </button>
      </div>
    );
  }
};

export default Button;
