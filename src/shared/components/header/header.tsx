"use client";

import Image from "next/image";
import Menu from "./../menu/menu";

export default function Header() {
  return (
    <header className='header flex items-center justify-between md:justify-center mb-6'>
      <Image
        src={"/assets/images/ESTORA-white.svg"}
        alt='Estora logo'
        width={190}
        height={70}
        className='p-6 w-48'
      />
      <Menu />
    </header>
  );
}
