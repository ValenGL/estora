"use client";
import Link from "next/link";
import "./ecosystem.scss";

export default function Ecosystem() {
  return (
    <>
      <h3 className='text-5xl caveat text-center mb-6'>
        A universe of possibilities.
      </h3>
      <section className='grid sm:grid-cols-2 u-color-estora-white eco-top mx-4 sm:mx-6'>
        <article className='p-4 flex flex-col gap-y-6 text-center w-full'>
          <span className='text-2xl'>Find investors for your established project.</span>
          <div className='mx-auto'>
            <svg
              width='42'
              height='40'
              viewBox='0 0 42 65'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M21 0C21.6188 0 22.2122 0.244563 22.6497 0.679887C23.0872 1.11521 23.333 1.70564 23.333 2.32128V57.071L38.0123 42.4609C38.4504 42.025 39.0445 41.7801 39.664 41.7801C40.2836 41.7801 40.8777 42.025 41.3158 42.4609C41.7539 42.8967 42 43.4879 42 44.1043C42 44.7207 41.7539 45.3119 41.3158 45.7478L22.6518 64.318C22.4351 64.5342 22.1776 64.7057 21.8942 64.8227C21.6107 64.9398 21.3069 65 21 65C20.6931 65 20.3893 64.9398 20.1058 64.8227C19.8224 64.7057 19.5649 64.5342 19.3482 64.318L0.684184 45.7478C0.246108 45.3119 -1.45967e-08 44.7207 0 44.1043C1.45967e-08 43.4879 0.246108 42.8967 0.684184 42.4609C1.12226 42.025 1.71642 41.7801 2.33595 41.7801C2.95549 41.7801 3.54965 42.025 3.98772 42.4609L18.667 57.071V2.32128C18.667 1.70564 18.9128 1.11521 19.3503 0.679887C19.7878 0.244563 20.3812 0 21 0Z'
                fill='white'
              />
            </svg>
          </div>
          <span className='text-2xl sm:text-4xl caveat-brush'>Seller</span>
        </article>
        <article className='p-4 flex flex-col gap-y-6 text-center w-full'>
          <span className='text-2xl'>Find profitable business opportunities.</span>
          <div className='mx-auto'>
            <svg
              width='42'
              height='40'
              viewBox='0 0 42 65'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M21 0C21.6188 0 22.2122 0.244563 22.6497 0.679887C23.0872 1.11521 23.333 1.70564 23.333 2.32128V57.071L38.0123 42.4609C38.4504 42.025 39.0445 41.7801 39.664 41.7801C40.2836 41.7801 40.8777 42.025 41.3158 42.4609C41.7539 42.8967 42 43.4879 42 44.1043C42 44.7207 41.7539 45.3119 41.3158 45.7478L22.6518 64.318C22.4351 64.5342 22.1776 64.7057 21.8942 64.8227C21.6107 64.9398 21.3069 65 21 65C20.6931 65 20.3893 64.9398 20.1058 64.8227C19.8224 64.7057 19.5649 64.5342 19.3482 64.318L0.684184 45.7478C0.246108 45.3119 -1.45967e-08 44.7207 0 44.1043C1.45967e-08 43.4879 0.246108 42.8967 0.684184 42.4609C1.12226 42.025 1.71642 41.7801 2.33595 41.7801C2.95549 41.7801 3.54965 42.025 3.98772 42.4609L18.667 57.071V2.32128C18.667 1.70564 18.9128 1.11521 19.3503 0.679887C19.7878 0.244563 20.3812 0 21 0Z'
                fill='white'
              />
            </svg>
          </div>
          <span className='text-2xl sm:text-4xl caveat-brush'>Buyer</span>
        </article>
      </section>
      <section className='p-2 flex flex-col text-center u-bgcolor-estora-dark rounded-b-2xl mx-4 mb-4 sm:mx-6 sm:mb-6'>
        <div className='flex justify-center items-center'>
          <span className='text-2xl sm:text-4xl caveat-brush w-48'>Seller</span>
          <div className='flex flex-col mb-6'>
            <span className='handshake-emoji'>🤝</span>
            <span className='shadow-[inset_0_3px_3px_0_rgba(0,0,0,0.15)] u-bgcolor-estora-black p-2 rounded-2xl m-4 sm:m-6 select-none'>
              <span className='text-xl sm:text-2xl'>DASHBOARD</span>
            </span>
          </div>
          <span className='text-2xl sm:text-4xl caveat-brush w-48'>Buyer</span>
        </div>
        <h4 className='text-lg text-center u-color-estora-white underline mb-2'>
          <Link href='/estora'>Learn more</Link>
        </h4>
      </section>
    </>
  );
}
