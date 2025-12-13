import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function CustomCursor() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    useEffect(() => {
        // Detect if device is touch-enabled (mobile/tablet)
        const checkTouchDevice = () => {
            return (
                'ontouchstart' in window ||
                navigator.maxTouchPoints > 0 ||
                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            );
        };

        const touchDevice = checkTouchDevice();
        setIsTouchDevice(touchDevice);

        // Don't initialize cursor on touch devices
        if (touchDevice) return;

        const moveMouse = (e) => setMousePosition({ x: e.clientX, y: e.clientY });

        // Detect hover on buttons/links
        const handleMouseOver = (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button')) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener("mousemove", moveMouse);
        window.addEventListener("mouseover", handleMouseOver);

        return () => {
            window.removeEventListener("mousemove", moveMouse);
            window.removeEventListener("mouseover", handleMouseOver);
        };
    }, []);

    // Don't render cursor on touch devices
    if (isTouchDevice) return null;

    return (
        <>
            {/* Main Dot */}
            <motion.div
                className="fixed top-0 left-0 w-2 h-2 bg-emerald-500 rounded-full pointer-events-none z-[9999]"
                animate={{ x: mousePosition.x - 4, y: mousePosition.y - 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
            />
            {/* Trailing Ring */}
            <motion.div
                className="fixed top-0 left-0 w-8 h-8 border border-emerald-500/50 rounded-full pointer-events-none z-[9998]"
                animate={{
                    x: mousePosition.x - 16,
                    y: mousePosition.y - 16,
                    scale: isHovering ? 2 : 1,
                    borderColor: isHovering ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.5)",
                    backgroundColor: isHovering ? "rgba(16, 185, 129, 0.1)" : "transparent"
                }}
                transition={{ type: "spring", stiffness: 250, damping: 20 }}
            />
        </>
    );
}