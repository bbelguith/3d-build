import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function ScrollReveal({ 
    children, 
    direction = "up", 
    delay = 0, 
    duration = 0.6,
    className = "",
    distance = 50 
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    const directions = {
        up: { y: distance, opacity: 0 },
        down: { y: -distance, opacity: 0 },
        left: { x: distance, opacity: 0 },
        right: { x: -distance, opacity: 0 },
        fade: { opacity: 0 }
    };

    const variants = {
        hidden: directions[direction] || directions.up,
        visible: {
            y: 0,
            x: 0,
            opacity: 1,
            transition: {
                duration,
                delay,
                ease: [0.25, 0.46, 0.45, 0.94]
            }
        }
    };

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={variants}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Stagger container for multiple children
export function StaggerContainer({ children, staggerDelay = 0.1, className = "" }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    return (
        <div ref={ref} className={className}>
            {React.Children.map(children, (child, index) => (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{
                        duration: 0.6,
                        delay: index * staggerDelay,
                        ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                >
                    {child}
                </motion.div>
            ))}
        </div>
    );
}

