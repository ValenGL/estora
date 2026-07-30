"use client";

import Image from "next/image";
import "./hero.scss";

export default function Hero() {
  return (
    <section className='hero shadow-[inset_0_3px_3px_0_rgba(0,0,0,0.15)] flex flex-col u-bgcolor-estora-white rounded-2xl m-4 sm:m-6'>
      <article className='flex justify-center items-center u-color-estora-black'>
        <div className='p-4 lg:mx-6'>
          <h1 className='clipped'>Brokerage</h1>
          <h2 className='u-color-estora-primary text-3xl lg:text-6xl pb-2'>
            Business transactions made simple
          </h2>
          <h3 className='u-color-estora-primary text-2xl lg:text-3xl caveat-brush'>
            AI enhanced buy and sell
          </h3>
        </div>
      </article>
      <article className='flex h-full justify-end items-end rounded-2xl'>
        <div className='flex w-full justify-end'>
          <Image
            src={"/assets/images/brokerage-robot.png"}
            alt='Brokerage robot'
            width={1464}
            height={150}
          />
        </div>
      </article>
    </section>
  );
}
