"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./../../../app/utils/isAuth";
import "./menu.scss";

export default function Menu() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className='menu-wrapper select-none'>
      <button className='hamburger' onClick={toggleMenu}>
        ☰
      </button>
      <div
        className={`overlay ${isOpen ? "active" : ""}`}
        onClick={toggleMenu}
      ></div>
      <ul className={isOpen ? "mobile-open" : ""}>
        <button className='close-btn' onClick={toggleMenu}>
          ✕
        </button>
        <li>
          <Link
            className={`link ${pathname === "/" || pathname === "/inicio" ? "active" : ""}`}
            href={isLoggedIn ? "/inicio" : "/"}
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
        </li>
            <li>
              <Link
                className={`link ${pathname === "/buyer" ? "active" : ""}`}
                href='/buyer'
                onClick={() => setIsOpen(false)}
              >
                Buy
              </Link>
            </li>
            <li>
              <Link
                className={`link ${pathname === "/seller" ? "active" : ""}`}
                href='/seller'
                onClick={() => setIsOpen(false)}
              >
                Sell
              </Link>
            </li>

        <li>
          <Link
            className={`link ${pathname === "/brokerage" ? "active" : ""}`}
            href='/brokerage'
            onClick={() => setIsOpen(false)}
          >
            About Us
          </Link>
        </li>
      </ul>
    </nav>
  );
}
