"use client";

import { signOut } from "@/auth";
import { LogoutIcon, LogoutIconHandle } from "./ui/logout";
import { useRef } from "react";

const LogoutButton = () => {
    const logoutIconRef = useRef<LogoutIconHandle>(null);

    const handleMouseEnter = () => {
        logoutIconRef.current?.startAnimation();
    };

    const handleMouseLeave = () => {
        logoutIconRef.current?.stopAnimation();
    };

    const handleLogout = async () => {
        await signOut();
    };

    return (
        <button
            onClick={handleLogout}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="w-full flex items-center justify-between"
        >
            <span>Cerrar sesión</span>
            <LogoutIcon ref={logoutIconRef} size={20} />
        </button>
    );
};

export default LogoutButton;
