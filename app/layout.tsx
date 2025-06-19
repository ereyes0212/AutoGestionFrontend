import localFont from "next/font/local";
import React, { ReactNode } from 'react';
import './globals.css';


const geistSans = localFont({
    src: "./fonts/Poppins-Light.ttf",
    variable: "--font-Poppins-sans",
    weight: "100 900",
});
const geistMono = localFont({
    src: "./fonts/Poppins-Light.ttf",
    variable: "--font-Poppins-mono",
    weight: "100 900",
});

const RootLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <html lang="es">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                {children}
            </body>
        </html>
    );
};

export default RootLayout;
