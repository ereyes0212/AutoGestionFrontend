// /app/(public)/layout.tsx
'use client'

import Image from "next/image";
import React from "react";

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <main className="relative flex items-center justify-center min-h-screen">
      <Image
        src="/logoTiempo.png"
        alt="Marca de agua"
        layout="fill"
        objectFit="contain"
        className="
          hidden 
          print:block 
          pointer-events-none
        "
      />
      {children}
    </main>
  );
};

export default PublicLayout;
