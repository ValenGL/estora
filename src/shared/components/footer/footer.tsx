"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./footer.scss";

import { useAuth } from "./../../../app/utils/isAuth"; // Adjust path

const Footer = () => {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();

  return (
    <footer className='mx-4 select-none'>
      <div className='footer shadow-[inset_0_3px_3px_0_rgba(0,0,0,0.15)] container flex justify-between mx-auto rounded-t-2xl u-bgcolor-estora-white p-4 flex-col md:flex-row'>
        <div className='flex align-center justify-center md:justify-start h-full pb-2 md:pb-0'>
          <ul className='flex'>
            <li className='p-2'>
              <a
                href='https://www.facebook.com/estora'
                target='_blank'
                rel='noopener noreferrer'
                className='social-icon-wrapper'
              >
                <Image
                  src={"/assets/images/facebook.svg"}
                  loading='lazy'
                  height={30}
                  width={30}
                  alt='Facebook logo'
                />
              </a>
            </li>
            <li className='p-2'>
              <a
                href='https://twitter.com/estora'
                target='_blank'
                rel='noopener noreferrer'
                className='social-icon-wrapper'
              >
                <span className='u-color-estora-white'>
                  <Image
                    src={"/assets/images/twitter.svg"}
                    loading='lazy'
                    height={24}
                    width={24}
                    alt='Twitter logo'
                  />
                </span>
              </a>
            </li>
            <li className='p-2'>
              <a
                href='https://www.instagram.com/estora/'
                target='_blank'
                rel='noopener noreferrer'
                className='social-icon-wrapper'
              >
                <span className='u-color-estora-white'>
                  <Image
                    src={"/assets/images/instagram.svg"}
                    loading='lazy'
                    height={30}
                    width={30}
                    alt='Instagram logo'
                  />
                </span>
              </a>
            </li>
            <li className='p-2'>
              <a
                href='https://www.linkedin.com/company/estora'
                target='_blank'
                rel='noopener noreferrer'
                className='social-icon-wrapper'
              >
                <span className='u-color-estora-white'>
                  <Image
                    src={"/assets/images/linkedin.svg"}
                    loading='lazy'
                    height={30}
                    width={30}
                    alt='LinkedIn logo'
                  />
                </span>
              </a>
            </li>
          </ul>
        </div>
        <div className='flex flex-col u-color-estora-black'>
          <ul className='grid grid-cols-2'>
            <li className='p-2'>
              <Link
                className={`link ${pathname === "/" ? "active" : ""}`}
                href='/'
              >
                Home
              </Link>
            </li>
            {isLoggedIn && (
              <>
                <li className='p-2'>
                  <Link
                    className={`link ${pathname === "/buyer" ? "active" : ""}`}
                    href='/buyer'
                  >
                    I want to buy
                  </Link>
                </li>
                <li className='p-2'>
                  <Link
                    className={`link ${pathname === "/seller" ? "active" : ""}`}
                    href='/seller'
                  >
                    I want to sell
                  </Link>
                </li>
              </>
            )}
            <li className='p-2'>
              <Link
                className={`link ${pathname === "/brokerage" ? "active" : ""}`}
                href='/brokerage'
              >
                About Us
              </Link>
            </li>
            <li className='p-2'>
              <Link
                className={`link ${pathname === "/terms-and-conditions" ? "active" : ""}`}
                href='/terms-and-conditions'
              >
                Terms and Conditions
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className='container mx-auto flex justify-center text-sm u-bgcolor-estora-white'>
        <span className='u-color-estora-black py-2 text-center'>
          © 2026, The Roofing Biz Broker
        </span>
      </div>
    </footer>
  );
};

export default Footer;
