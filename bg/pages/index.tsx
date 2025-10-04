"use client";
import Header from "../components/Header";
import Link from "next/link";

export default function Home() {
  return (
<>
<Header />
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 flex flex-col items-center p-6">
      
{/* Main Header */}
      <h1 className="text-5xl md:text-6xl font-extrabold text-blue-900 mb-12 text-center drop-shadow-lg tracking-wide animate-fadeIn">
        Welcome to <span className="text-blue-700">Pixora</span>
      </h1>

      <p className="text-center text-blue-900 text-lg md:text-xl max-w-2xl mb-12">
        Your all-in-one image editing platform: remove backgrounds, extend backgrounds seamlessly, and generate Civil ID PDFs instantly.
      </p>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {/* Background Remover */}
        <Link href="/remove-bg" className="transform hover:scale-105 transition-all">
          <div className="bg-white/40 backdrop-blur-md shadow-2xl rounded-3xl p-8 flex flex-col items-center gap-4 border border-blue-200 border-opacity-30 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]">
            <h2 className="text-2xl font-semibold text-blue-900">Background Remover</h2>
            <p className="text-blue-900 text-center text-sm">
              Instantly remove image backgrounds and download them with transparency.
            </p>
          </div>
        </Link>

        {/* Background Extender */}
        <Link href="/back-extend" className="transform hover:scale-105 transition-all">
          <div className="bg-white/40 backdrop-blur-md shadow-2xl rounded-3xl p-8 flex flex-col items-center gap-4 border border-blue-200 border-opacity-30 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]">
            <h2 className="text-2xl font-semibold text-blue-900">Background Extender</h2>
            <p className="text-blue-900 text-center text-sm">
              Extend image edges seamlessly and preview edge strips live.
            </p>
          </div>
        </Link>

        {/* Civil ID PDF Maker */}
        <Link href="/civil-id" className="transform hover:scale-105 transition-all">
          <div className="bg-white/40 backdrop-blur-md shadow-2xl rounded-3xl p-8 flex flex-col items-center gap-4 border border-blue-200 border-opacity-30 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]">
            <h2 className="text-2xl font-semibold text-blue-900">Civil ID PDF Maker</h2>
            <p className="text-blue-900 text-center text-sm">
              Generate Civil ID PDFs from your images quickly and securely.
            </p>
          </div>
        </Link>
      </div>

      {/* Footer / Note */}
      <p className="text-blue-900 text-sm mt-12 max-w-xl text-center">
        Pixora © {new Date().getFullYear()} — All rights reserved.
      </p>

      {/* Fade-in animation */}
      <style jsx>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease forwards;
        }
      `}</style>
    </div>
</>
  );
}