"use client";

import Image from "next/image";
import Menu from "./../menu/menu";

export default function Header() {
  return (
    <header className='header flex items-center justify-between md:justify-center mb-6'>
      <Image
        src={"/assets/images/brokerage-white.svg"}
        alt='Brokerage logo'
        width={122}
        height={100}
      />
      <Menu />
    </header>
  );
}
