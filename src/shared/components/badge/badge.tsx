"use client";

import "./badge.scss";
interface BadgeProps {
  text?: string;
  block?: boolean;
  color?: string;
  bgColor?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({
  // block = 100% width
  block = false,
  color = "white",
  bgColor = "light",
  onClick = undefined,
  children = undefined,
}) => {
  const badgeClass = block ? "badge badge-block" : "badge";

  return (
    <div
      className={`${badgeClass} u-color-estora-${color} u-bgcolor-estora-${bgColor}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Badge;
