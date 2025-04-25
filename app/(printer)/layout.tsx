// /app/(public)/layout.tsx
'use client'

import React from "react";

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <main className="relative flex items-center justify-center min-h-screen">
      {/* Marca de agua solo al imprimir */}
      <img
        src="/LogoTiempo.png"
        alt="Marca de agua"
        className="
          hidden 
          print:block 
          absolute inset-0 
          w-full h-full 
          object-contain 
          pointer-events-none
        "
      />
      {children}
    </main>
  );
};

export default PublicLayout;
