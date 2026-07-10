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
            className={`link ${pathname === "/inicio" ? "active" : ""}`}
            href='/inicio'
            onClick={() => setIsOpen(false)}
          >
            Inicio
          </Link>
        </li>
        {isLoggedIn && (
          <>
            <li>
              <Link
                className={`link ${pathname === "/garpo" ? "active" : ""}`}
                href='/garpo'
                onClick={() => setIsOpen(false)}
              >
                Soy cliente
                <span className='flex caveat'>Quiero encontrar productos</span>
              </Link>
            </li>
            <li>
              <Link
                className={`link ${pathname === "/garper" ? "active" : ""}`}
                href='/garper'
                onClick={() => setIsOpen(false)}
              >
                Soy proveedor
                <span className='flex caveat'>Quiero ofrecer mis productos</span>
              </Link>
            </li>
          </>
        )}
        <li>
          <Link
            className={`link ${pathname === "/estora" ? "active" : ""}`}
            href='/estora'
            onClick={() => setIsOpen(false)}
          >
            Quienes somos
            <span className='flex caveat'>¿qué es estora?</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
