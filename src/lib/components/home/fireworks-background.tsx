"use client";
import React, { useEffect, useRef } from "react";
import { cn } from "@/src/lib/utils";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    color: string;
    decay: number;
}

interface Firework {
    x: number;
    y: number;
    targetY: number;
    color: string;
    particles: Particle[];
    exploded: boolean;
    vy: number;
}

export const FireworksBackground = ({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let fireworks: Firework[] = [];
        const colors = ["#ff0040", "#ff00ff", "#00ffff", "#ffff00", "#00ff00", "#ff8800"];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const createFirework = () => {
            const x = Math.random() * canvas.width;
            // Start outside bottom
            const y = canvas.height;
            const targetY = canvas.height * 0.2 + Math.random() * (canvas.height * 0.5);
            const color = colors[Math.floor(Math.random() * colors.length)];

            fireworks.push({
                x,
                y,
                targetY,
                color,
                particles: [],
                exploded: false,
                vy: -Math.random() * 3 - 4 // Launch velocity
            });
        };

        const createParticles = (x: number, y: number, color: string) => {
            const particleCount = 50 + Math.random() * 50;
            const particles: Particle[] = [];
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 4 + 1;
                particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    alpha: 1,
                    color,
                    decay: Math.random() * 0.015 + 0.005
                });
            }
            return particles;
        };

        const animate = () => {
            // Trail effect
            ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Random launch
            if (Math.random() < 0.03) {
                createFirework();
            }

            fireworks.forEach((fw, index) => {
                if (!fw.exploded) {
                    fw.y += fw.vy;
                    // fw.vy += 0.05; // Gravity acting on rocket? Usually they accel or constant.

                    // Draw rocket
                    ctx.beginPath();
                    ctx.arc(fw.x, fw.y, 2, 0, Math.PI * 2);
                    ctx.fillStyle = fw.color;
                    ctx.fill();

                    if (fw.y <= fw.targetY || fw.vy >= 0) {
                        fw.exploded = true;
                        fw.particles = createParticles(fw.x, fw.y, fw.color);
                    }
                } else {
                    // Update particles
                    for (let i = fw.particles.length - 1; i >= 0; i--) {
                        const p = fw.particles[i];
                        p.x += p.vx;
                        p.y += p.vy;
                        p.vy += 0.05; // Gravity
                        p.alpha -= p.decay;

                        if (p.alpha <= 0) {
                            fw.particles.splice(i, 1);
                        } else {
                            ctx.beginPath();
                            ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
                            ctx.fillStyle = p.color;
                            ctx.globalAlpha = p.alpha;
                            ctx.fill();
                            ctx.globalAlpha = 1;
                        }
                    }

                    if (fw.particles.length === 0) {
                        fireworks.splice(index, 1);
                    }
                }
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        resize();
        window.addEventListener("resize", resize);
        animate();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className={cn("relative w-full h-full bg-black overflow-hidden", className)}>
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none z-0"
            />
            <div className="relative z-10 w-full h-full">{children}</div>
        </div>
    );
};
