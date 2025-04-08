import React from 'react';
import { ReactNode } from 'react';

import './globals.css';

const RootLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <html lang="es">
            <body>
                {children} 
            </body>
        </html>
    );
};

export default RootLayout;
