"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

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
      <nav className="hidden md:flex gap-8">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`text-blue-900 font-semibold hover:text-blue-700 transition-colors ${
              pathname === item.path
                ? "underline decoration-2 underline-offset-4"
                : ""
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Hamburger Button */}
      <button
        className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5"
        onClick={() => setIsOpen(true)}
      >
        <span className="block w-8 h-0.5 bg-blue-900 rounded"></span>
        <span className="block w-8 h-0.5 bg-blue-900 rounded"></span>
        <span className="block w-8 h-0.5 bg-blue-900 rounded"></span>
      </button>

      {/* Mobile Slide-out Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white/90 backdrop-blur-xl shadow-2xl p-6 flex flex-col gap-6 transform transition-transform duration-300 z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close Button */}
        <button
          className="self-end w-8 h-8 relative focus:outline-none"
          onClick={() => setIsOpen(false)}
        >
          <span className="absolute w-8 h-0.5 bg-blue-900 rotate-45 top-1/2 left-0 -translate-y-1/2"></span>
          <span className="absolute w-8 h-0.5 bg-blue-900 -rotate-45 top-1/2 left-0 -translate-y-1/2"></span>
        </button>

        {/* Mobile Links */}
        <nav className="flex flex-col gap-4 mt-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`text-blue-900 font-semibold text-lg hover:text-blue-700 transition-colors ${
                pathname === item.path
                  ? "underline decoration-2 underline-offset-4"
                  : ""
              }`}
              onClick={() => setIsOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Overlay */}
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