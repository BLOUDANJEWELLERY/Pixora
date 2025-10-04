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
    <header className="fixed w-full bg-white/80 backdrop-blur-xl border-b border-blue-200/50 shadow-lg z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center p-4 md:p-6">
        {/* Logo */}
        <Link 
          href="/" 
          className="text-2xl md:text-3xl font-extrabold text-blue-900 drop-shadow-lg tracking-wide"
        >
          Pixora
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`font-semibold transition-all duration-300 px-5 py-2.5 rounded-xl backdrop-blur-sm border ${
                pathname === item.path 
                  ? "bg-blue-500/20 text-blue-900 border-blue-300 shadow-inner" 
                  : "bg-white/60 text-blue-800 border-blue-200/60 hover:bg-white/80 hover:shadow-md"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Hamburger Button */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-12 h-12 gap-1.5 focus:outline-none group bg-white/60 backdrop-blur-sm rounded-xl border border-blue-200/50 hover:bg-white/80 transition-all duration-300"
          onClick={() => setIsOpen(true)}
        >
          <span className="block w-6 h-0.5 bg-blue-900 rounded-full transition-all duration-300"></span>
          <span className="block w-6 h-0.5 bg-blue-900 rounded-full transition-all duration-300"></span>
          <span className="block w-6 h-0.5 bg-blue-900 rounded-full transition-all duration-300"></span>
        </button>
      </div>

      {/* Mobile Side Menu - SOLID GLASS EFFECT */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-br from-blue-500/95 via-blue-400/90 to-blue-600/95 backdrop-blur-2xl border-r border-blue-300/60 shadow-2xl p-6 flex flex-col gap-8 transform transition-all duration-300 z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header Section */}
        <div className="flex justify-between items-center border-b border-blue-300/40 pb-6">
          <h2 className="text-2xl font-bold text-white drop-shadow-lg">Menu</h2>
          {/* Close Button */}
          <button
            className="w-10 h-10 relative focus:outline-none group rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-300 flex items-center justify-center"
            onClick={() => setIsOpen(false)}
          >
            <span className="absolute w-5 h-0.5 bg-white rotate-45 rounded-full"></span>
            <span className="absolute w-5 h-0.5 bg-white -rotate-45 rounded-full"></span>
          </button>
        </div>

        {/* Mobile Links */}
        <nav className="flex flex-col gap-3 mt-4">
          {navItems.map((item, index) => (
            <Link
              key={item.path}
              href={item.path}
              className={`font-semibold text-lg py-4 px-6 rounded-xl transition-all duration-300 border-2 ${
                pathname === item.path 
                  ? "bg-white/30 text-white border-white/50 shadow-lg scale-[1.02] shadow-blue-500/30" 
                  : "bg-white/10 text-white/90 border-white/20 hover:bg-white/20 hover:border-white/30 hover:scale-[1.02]"
              }`}
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${pathname === item.path ? "bg-white" : "bg-white/60"}`}></div>
                {item.name}
              </div>
            </Link>
          ))}
        </nav>

        {/* Bottom Decoration */}
        <div className="mt-auto pt-6 border-t border-blue-300/40">
          <div className="text-white/70 text-sm text-center">
            Pixora © {new Date().getFullYear()}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 -right-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 -left-10 w-16 h-16 bg-blue-300/20 rounded-full blur-lg"></div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </header>
  );
};

export default Header;