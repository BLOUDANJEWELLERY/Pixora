// components/SidebarHeader.jsx
"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function SidebarHeader() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* Header Bar */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-900">Pixora</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/remove-bg" 
              className="text-blue-900 hover:text-blue-700 font-medium transition-colors"
            >
              Background Remover
            </Link>
            <Link 
              href="/back-extend" 
              className="text-blue-900 hover:text-blue-700 font-medium transition-colors"
            >
              Background Extender
            </Link>
            <Link 
              href="/civil-id" 
              className="text-blue-900 hover:text-blue-700 font-medium transition-colors"
            >
              Civil ID PDF Maker
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg text-blue-900 hover:bg-blue-100 transition-colors"
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
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white/95 backdrop-blur-md shadow-2xl 
        transform transition-transform duration-300 ease-in-out z-50 md:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-blue-900">Pixora</span>
            <button
              onClick={closeSidebar}
              className="p-1 rounded-lg text-blue-900 hover:bg-blue-100 transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="p-6 space-y-6">
          <Link 
            href="/remove-bg" 
            className="block text-blue-900 hover:text-blue-700 font-medium text-lg transition-colors"
            onClick={closeSidebar}
          >
            Background Remover
          </Link>
          <Link 
            href="/back-extend" 
            className="block text-blue-900 hover:text-blue-700 font-medium text-lg transition-colors"
            onClick={closeSidebar}
          >
            Background Extender
          </Link>
          <Link 
            href="/civil-id" 
            className="block text-blue-900 hover:text-blue-700 font-medium text-lg transition-colors"
            onClick={closeSidebar}
          >
            Civil ID PDF Maker
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-blue-200">
          <p className="text-blue-900 text-sm text-center">
            Pixora © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </>
  );
}