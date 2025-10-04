"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const Header: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Civil ID", path: "/civil-id" },
    { name: "Back Extend", path: "/back-extend" },
    { name: "Background Remover", path: "/background-remover" },
  ];

  return (
    <header className="w-full bg-white/40 backdrop-blur-md shadow-2xl rounded-b-3xl p-6 mb-12 flex justify-between items-center">
      <h1 className="text-2xl md:text-3xl font-extrabold text-blue-900 drop-shadow-md">
        <Link href="/">Pixora</Link>
      </h1>

      <nav>
        <ul className="flex gap-6">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`
                  text-blue-900 font-semibold hover:text-blue-700 transition-colors
                  ${pathname === item.path ? "underline decoration-2 underline-offset-4" : ""}
                `}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Header;