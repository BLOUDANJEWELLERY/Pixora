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
    <header className="fixed w-full bg-gradient-to-r from-blue-600/95 to-blue-700/95 backdrop-blur-2xl border-b border-blue-400/30 shadow-2xl z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center p-4 md:p-6">
        {/* Logo */}
        <Link 
          href="/" 
          className="text-2xl md:text-3xl font-extrabold text-white drop-shadow-2xl tracking-wide hover:scale-105 transition-transform duration-300"
        >
          Pixora
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex gap-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`font-semibold transition-all duration-300 px-6 py-3 rounded-xl border ${
                pathname === item.path 
                  ? "bg-white/20 text-white border-white/40 shadow-lg scale-105" 
                  : "bg-white/10 text-white/90 border-white/20 hover:bg-white/20 hover:scale-105 hover:shadow-lg"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Hamburger Button */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-12 h-12 gap-1.5 focus:outline-none group"
          onClick={() => setIsOpen(true)}
        >
          <span className="block w-8 h-0.5 bg-white rounded-full transition-all duration-300 group-hover:bg-blue-200"></span>
          <span className="block w-8 h-0.5 bg-white rounded-full transition-all duration-300 group-hover:bg-blue-200"></span>
          <span className="block w-8 h-0.5 bg-white rounded-full transition-all duration-300 group-hover:bg-blue-200"></span>
        </button>
      </div>

      {/* Mobile Side Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-blue-700 to-blue-600 backdrop-blur-2xl border-r border-blue-400/30 shadow-2xl p-6 flex flex-col gap-8 transform transition-all duration-500 z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <Link 
            href="/" 
            className="text-2xl font-extrabold text-white drop-shadow-2xl tracking-wide"
            onClick={() => setIsOpen(false)}
          >
            Pixora
          </Link>
          
          {/* Close Button */}
          <button
            className="w-10 h-10 relative focus:outline-none group rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
            onClick={() => setIsOpen(false)}
          >
            <span className="absolute w-6 h-0.5 bg-white rotate-45 rounded-full group-hover:bg-blue-200 transition-colors"></span>
            <span className="absolute w-6 h-0.5 bg-white -rotate-45 rounded-full group-hover:bg-blue-200 transition-colors"></span>
          </button>
        </div>

        {/* Mobile Links */}
        <nav className="flex flex-col gap-3 mt-8">
          {navItems.map((item, index) => (
            <Link
              key={item.path}
              href={item.path}
              className={`font-semibold text-lg py-4 px-6 rounded-xl transition-all duration-300 border ${
                pathname === item.path 
                  ? "bg-white/20 text-white border-white/40 shadow-lg" 
                  : "bg-white/10 text-white/90 border-white/20 hover:bg-white/20 hover:shadow-lg"
              }`}
              onClick={() => setIsOpen(false)}
              style={{ 
                transitionDelay: `${index * 0.1}s`,
                transform: isOpen ? 'translateX(0)' : 'translateX(-20px)',
                opacity: isOpen ? 1 : 0
              }}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Bottom Decoration */}
        <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-blue-800/50 to-transparent pointer-events-none"></div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-500"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </header>
  );
};

export default Header;