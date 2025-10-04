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
    <header className="fixed w-full bg-blue-500/20 backdrop-blur-xl border-b border-blue-300/30 shadow-lg z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center p-4 md:p-6">
        {/* Logo */}
        <Link 
          href="/" 
          className="text-2xl md:text-3xl font-extrabold text-white drop-shadow-lg"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
        >
          Pixora
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex gap-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`text-white font-semibold hover:text-blue-100 transition-all duration-300 px-4 py-2 rounded-lg backdrop-blur-sm ${
                pathname === item.path 
                  ? "bg-white/20 shadow-inner border border-white/30" 
                  : "bg-white/10 hover:bg-white/15 border border-white/20"
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
          <span className="block w-8 h-0.5 bg-white rounded-full transition-all duration-300 group-hover:bg-blue-200 group-hover:w-7"></span>
          <span className="block w-8 h-0.5 bg-white rounded-full transition-all duration-300 group-hover:bg-blue-200 group-hover:w-7"></span>
          <span className="block w-8 h-0.5 bg-white rounded-full transition-all duration-300 group-hover:bg-blue-200 group-hover:w-7"></span>
        </button>
      </div>

      {/* Mobile Side Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-br from-blue-600/40 via-blue-500/30 to-purple-500/20 backdrop-blur-2xl border-r border-blue-300/40 shadow-2xl p-6 flex flex-col gap-8 transform transition-all duration-500 z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(96, 165, 250, 0.3) 50%, rgba(139, 92, 246, 0.2) 100%)'
        }}
      >
        {/* Close Button */}
        <button
          className="self-end w-10 h-10 relative focus:outline-none group rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
          onClick={() => setIsOpen(false)}
        >
          <span className="absolute w-6 h-0.5 bg-white rotate-45 rounded-full group-hover:bg-blue-200 transition-colors"></span>
          <span className="absolute w-6 h-0.5 bg-white -rotate-45 rounded-full group-hover:bg-blue-200 transition-colors"></span>
        </button>

        {/* Mobile Links */}
        <nav className="flex flex-col gap-4 mt-8">
          {navItems.map((item, index) => (
            <Link
              key={item.path}
              href={item.path}
              className={`text-white font-semibold text-lg py-4 px-6 rounded-xl transition-all duration-500 backdrop-blur-sm border ${
                pathname === item.path 
                  ? "bg-white/25 border-white/40 shadow-lg scale-105" 
                  : "bg-white/15 border-white/25 hover:bg-white/20 hover:scale-105 hover:shadow-md"
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

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-500/20 to-transparent pointer-events-none"></div>
        <div className="absolute top-1/4 -right-8 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-1/3 -left-8 w-12 h-12 bg-purple-400/20 rounded-full blur-lg"></div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-blue-900/40 backdrop-blur-sm z-40 transition-all duration-500"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </header>
  );
};

export default Header;