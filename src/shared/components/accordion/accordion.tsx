"use client";

import React, { useState } from "react";
import Button from "../button/button";

interface AccordionProps {
  title: string;
  content: React.ReactNode;
}

const Accordion: React.FC<AccordionProps> = ({ title, content }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleAccordion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div>
      <Button
        text={title}
        dropdown
        isExpanded={isExpanded}
        block
        version='text'
        onClick={toggleAccordion}
      />
      {isExpanded && <div>{content}</div>}
    </div>
  );
};

export default Accordion;
