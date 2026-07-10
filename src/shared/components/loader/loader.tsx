"use client";

interface LoaderProps {
  block?: boolean;
}

import "./loader.scss";

function Loader({ block = false }: LoaderProps) {
  return (
    <div className={`loader-wrapper p-4 ${block ? "w-full h-full" : ""}`}>
      <div className='loader'></div>
    </div>
  );
}

export default Loader;
