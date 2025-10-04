"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { HiMenu, HiX } from "react-icons/hi";

const Header: React.FC = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Civil ID", path: "/civil-id" },
    { name: "Back Extend", path: "/back-extend" },
    { name: "Background Remover", path: "/background-remover" },
  ];

  return (
    <header className="w-full bg-white/40 backdrop-blur-md shadow-2xl rounded-b-3xl p-4 flex justify-between items-center relative z-50">
      {/* Logo */}
      <h1 className="text-2xl md:text-3xl font-extrabold text-blue-900 drop-shadow-md">
        <Link href="/">Pixora</Link>
      </h1>

      {/* Desktop Menu */}
      <nav className="hidden md:flex gap-6">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`
              text-blue-900 font-semibold hover:text-blue-700 transition-colors
              ${pathname === item.path ? "underline decoration-2 underline-offset-4" : ""}
            `}
          >
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Hamburger Button */}
      <button
        className="md:hidden text-blue-900 text-3xl focus:outline-none"
        onClick={() => setIsOpen(true)}
      >
        <HiMenu />
      </button>

      {/* Mobile Slide-out Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white/90 backdrop-blur-xl shadow-2xl p-6 flex flex-col gap-6 transform transition-transform duration-300 z-50
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <button
          className="self-end text-3xl text-blue-900 focus:outline-none"
          onClick={() => setIsOpen(false)}
        >
          <HiX />
        </button>

        <nav className="flex flex-col gap-4 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`
                text-blue-900 font-semibold text-lg hover:text-blue-700 transition-colors
                ${pathname === item.path ? "underline decoration-2 underline-offset-4" : ""}
              `}
              onClick={() => setIsOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Overlay when menu is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </header>
  );
};

export default Header;