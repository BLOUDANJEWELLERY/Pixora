// components/SidebarHeader.jsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SidebarHeader() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Close sidebar when route changes
  useEffect(() => {
    closeSidebar();
  }, [pathname]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  const menuItems = [
    { href: "/", label: "Home", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { href: "/remove-bg", label: "Background Remover", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )},
    { href: "/back-extend", label: "Background Extender", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
      </svg>
    )},
    { href: "/civil-id", label: "Civil ID PDF Maker", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )},
  ];

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Header Bar */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-200/50 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-2xl font-bold text-blue-900 group-hover:text-blue-700 transition-colors">
              Pixora
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-blue-900 hover:bg-blue-100/80 hover:text-blue-700'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleSidebar}
            className="md:hidden p-3 rounded-xl bg-white/50 backdrop-blur-sm text-blue-900 hover:bg-blue-100/80 transition-all duration-200 shadow-lg hover:shadow-xl border border-blue-200/30"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isSidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`
        fixed top-0 left-0 h-screen w-80 bg-white/10 backdrop-blur-2xl border-r border-blue-200/30
        shadow-2xl transform transition-transform duration-300 ease-in-out z-50 md:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header with Gradient */}
        <div className="p-6 border-b border-blue-200/30 bg-gradient-to-r from-blue-600/10 to-blue-800/10 backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group" onClick={closeSidebar}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-blue-900 group-hover:text-blue-700 transition-colors">
                  Pixora
                </span>
                <p className="text-blue-700/80 text-sm font-medium">Image Editing Suite</p>
              </div>
            </Link>
            <button
              onClick={closeSidebar}
              className="p-2 rounded-lg text-blue-900 hover:bg-white/20 transition-all duration-200"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="p-6 space-y-3 h-[calc(100vh-200px)] overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-4 p-4 rounded-2xl transition-all duration-200 group ${
                isActive(item.href)
                  ? 'bg-white/30 backdrop-blur-lg shadow-lg shadow-blue-500/20 border border-white/20'
                  : 'bg-white/10 backdrop-blur-lg hover:bg-white/20 hover:shadow-lg border border-transparent hover:border-white/10'
              }`}
              onClick={closeSidebar}
            >
              <div className={`p-2 rounded-lg transition-all duration-200 ${
                isActive(item.href)
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white/50 text-blue-900 group-hover:bg-blue-100/80 group-hover:shadow-md'
              }`}>
                {item.icon}
              </div>
              <span className={`font-semibold transition-all duration-200 ${
                isActive(item.href)
                  ? 'text-blue-900'
                  : 'text-blue-900/90 group-hover:text-blue-800'
              }`}>
                {item.label}
              </span>
              {isActive(item.href) && (
                <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              )}
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer with Enhanced Design */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-blue-200/30 bg-gradient-to-r from-blue-600/5 to-blue-800/5 backdrop-blur-lg">
          <div className="text-center">
            <p className="text-blue-900/80 text-sm font-medium mb-2">
              Powered by AI Magic
            </p>
            <p className="text-blue-900/60 text-xs">
              Pixora © {new Date().getFullYear()}
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 -left-4 w-8 h-8 bg-blue-400/20 rounded-full blur-lg animate-pulse" />
        <div className="absolute bottom-1/3 -left-2 w-6 h-6 bg-blue-600/20 rounded-full blur-md animate-pulse delay-1000" />
      </div>
    </>
  );
}