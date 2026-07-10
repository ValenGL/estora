"use client";

import React, { useEffect, useRef, useState } from "react";
import Button from "../button/button";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  defaultText?: string;
  onSelect?: (value: string) => void;
}

const Select: React.FC<SelectProps> = ({
  options,
  defaultText = "Selecciona una opción",
  onSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(defaultText);
  const selectRef = useRef<HTMLDivElement>(null);

  const toggleSelect = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleOptionClick = (option: SelectOption) => {
    setSelectedLabel(option.label);
    setIsExpanded(false);
    if (onSelect) {
      onSelect(option.value);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  return (
    <div ref={selectRef} className='relative'>
      <Button
        text={selectedLabel}
        select
        isExpanded={isExpanded}
        block
        version='primary'
        onClick={toggleSelect}
      />

      {isExpanded && (
        <div className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto'>
          {options.map((option) => (
            <div
              key={option.value}
              className='px-4 py-2 cursor-pointer u-color-estora-black hover:bg-gray-100 transition-colors duration-200'
              onClick={() => handleOptionClick(option)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Select;
