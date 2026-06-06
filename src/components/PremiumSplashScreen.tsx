'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const PremiumSplashScreen = ({ onComplete }: { onComplete?: () => void }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [stage, setStage] = useState(0);
    const [lightsActive, setLightsActive] = useState<number[]>([]);

    useEffect(() => {


        // Stage 0: Boot sequence (0-0.8s)
        const timer1 = setTimeout(() => setStage(1), 900);

        // Stage 1: Lights sequence (0.8s-1.8s)
        const lightTimers = [
            setTimeout(() => setLightsActive([0]), 1100),
            setTimeout(() => setLightsActive([0, 1]), 1300),
            setTimeout(() => setLightsActive([0, 1, 2]), 1500),
            setTimeout(() => setLightsActive([0, 1, 2, 3]), 1700),
            setTimeout(() => setLightsActive([0, 1, 2, 3, 4]), 1900),
            setTimeout(() => setStage(2), 2100),
        ];

        // Stage 2: All lights (1.8s-2.8s)
        const timer3 = setTimeout(() => setStage(3), 3300);

        // Stage 3: GO! (2.8s-3.5s)
        const timer4 = setTimeout(() => setStage(4), 4500);

        // Stage 4: Final reveal (3.5s-4.5s)
        const timer5 = setTimeout(() => {
            setIsVisible(false);
            sessionStorage.setItem('splashShown', 'true');
            onComplete?.();
        }, 8000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer3);
            clearTimeout(timer4);
            clearTimeout(timer5);
            lightTimers.forEach(clearTimeout);
        };
    }, [onComplete]);

    const handleSkip = () => {
        setIsVisible(false);
        sessionStorage.setItem('splashShown', 'true');
        onComplete?.();
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="splash"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                className="fixed inset-0 z-[9999] overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black"
            >
                {/* Animated Grid Background */}
                <motion.div
                    initial={{ opacity: 0, scale: 1.2 }}
                    animate={{ opacity: stage >= 0 ? 0.15 : 0, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
              linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* Radial Glow */}
                <div className="absolute inset-0 bg-gradient-radial from-blue-900/20 via-transparent to-transparent" />

                {/* Speed Lines */}
                <AnimatePresence>
                    {stage >= 2 && (
                        <>
                            {[...Array(15)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ x: '-100%', opacity: 0 }}
                                    animate={{ x: '200%', opacity: [0, 1, 0] }}
                                    transition={{
                                        duration: 0.8,
                                        delay: i * 0.05,
                                        ease: 'easeInOut',
                                    }}
                                    className="absolute h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                                    style={{
                                        top: `${20 + i * 5}%`,
                                        width: '100%',
                                        filter: 'blur(1px)',
                                    }}
                                />
                            ))}
                        </>
                    )}
                </AnimatePresence>

                {/* Particles */}
                <AnimatePresence>
                    {stage >= 3 && (
                        <>
                            {[...Array(30)].map((_, i) => (
                                <motion.div
                                    key={`particle-${i}`}
                                    initial={{ scale: 0, x: '50%', y: '50%' }}
                                    animate={{
                                        scale: [0, 1, 0],
                                        x: `${50 + (Math.random() - 0.5) * 100}%`,
                                        y: `${50 + (Math.random() - 0.5) * 100}%`,
                                        opacity: [0, 1, 0],
                                    }}
                                    transition={{
                                        duration: 1,
                                        delay: i * 0.02,
                                        ease: 'easeOut',
                                    }}
                                    className="absolute w-1 h-1 bg-cyan-400 rounded-full"
                                    style={{
                                        left: '50%',
                                        top: '50%',
                                        boxShadow: '0 0 10px rgba(34, 211, 238, 0.8)',
                                    }}
                                />
                            ))}
                        </>
                    )}
                </AnimatePresence>

                {/* Main Content Container */}
                <div className="relative h-full flex items-center justify-center">
                    {/* Stage 0: Boot Sequence */}
                    <AnimatePresence>
                        {stage === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="text-center"
                            >
                                <motion.p
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="text-cyan-400 text-sm tracking-[0.3em] uppercase font-mono"
                                >
                                    System Booting...
                                </motion.p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Stage 1-2: Race Lights */}
                    <AnimatePresence>
                        {stage >= 1 && stage <= 2 && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 1.2, opacity: 0 }}
                                className="text-center"
                            >
                                {/* Lights Container */}
                                <motion.div
                                    animate={stage === 2 ? { scale: [1, 1.05, 1] } : {}}
                                    transition={{ duration: 0.3, repeat: 3 }}
                                    className="flex gap-4 md:gap-6 justify-center mb-8 md:mb-12"
                                >
                                    {[0, 1, 2, 3, 4].map((index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ scale: 0 }}
                                            animate={{
                                                scale: lightsActive.includes(index) ? 1 : 0.8,
                                                opacity: lightsActive.includes(index) ? 1 : 0.3,
                                            }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                            className="relative"
                                        >
                                            <div
                                                className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-2 transition-all duration-300 ${lightsActive.includes(index)
                                                    ? 'border-red-500 bg-red-500'
                                                    : 'border-gray-700 bg-gray-800'
                                                    }`}
                                                style={{
                                                    boxShadow: lightsActive.includes(index)
                                                        ? '0 0 30px rgba(239, 68, 68, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.5)'
                                                        : 'none',
                                                }}
                                            />
                                            {lightsActive.includes(index) && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: [1, 1.5, 1] }}
                                                    transition={{ duration: 0.5, repeat: Infinity }}
                                                    className="absolute inset-0 rounded-full bg-red-500 opacity-30 blur-xl"
                                                />
                                            )}
                                        </motion.div>
                                    ))}
                                </motion.div>

                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-gray-400 text-xs md:text-sm tracking-[0.3em] uppercase"
                                >
                                    Get Ready to Build
                                </motion.p>

                                {stage === 2 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
                                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                        className="mt-8 md:mt-12"
                                    >
                                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                                            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                                                DNYANOTHON 2026
                                            </span>
                                        </h1>
                                        <p className="text-gray-400 text-sm md:text-base mt-3 tracking-wider">
                                            Code. Create. Compete.
                                        </p>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Stage 3: GO! */}
                    <AnimatePresence>
                        {stage === 3 && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 1.5, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                className="text-center"
                            >
                                {/* Green Lights */}
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 0.3, repeat: 2 }}
                                    className="flex gap-4 md:gap-6 justify-center mb-8"
                                >
                                    {[0, 1, 2, 3, 4].map((index) => (
                                        <div
                                            key={index}
                                            className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-green-400 bg-green-400"
                                            style={{
                                                boxShadow:
                                                    '0 0 40px rgba(74, 222, 128, 0.9), inset 0 0 20px rgba(255, 255, 255, 0.7)',
                                            }}
                                        />
                                    ))}
                                </motion.div>

                                <motion.h2
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="text-6xl md:text-8xl font-black tracking-wider"
                                    style={{
                                        textShadow: '0 0 40px rgba(74, 222, 128, 0.8)',
                                    }}
                                >
                                    <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                                        GO!
                                    </span>
                                </motion.h2>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-gray-400 text-xs md:text-sm tracking-[0.3em] uppercase mt-4"
                                >
                                    Lights Out
                                </motion.p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Stage 4: Final Reveal */}
                    <AnimatePresence>
                        {stage === 4 && (
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                                className="text-center px-6"
                            >
                                {/* Glassmorphism Container */}
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="relative p-8 md:p-12 rounded-3xl backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
                                    style={{
                                        boxShadow:
                                            '0 0 60px rgba(59, 130, 246, 0.3), inset 0 0 60px rgba(59, 130, 246, 0.05)',
                                    }}
                                >
                                    {/* Gradient Border Glow */}
                                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 opacity-20 blur-2xl -z-10" />

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-4">
                                            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 bg-clip-text text-transparent">
                                                DNYANOTHON
                                            </span>
                                        </h1>
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                            className="text-2xl md:text-3xl font-bold text-white mb-6"
                                        >
                                            2026
                                        </motion.p>
                                    </motion.div>

                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                        className="text-gray-300 text-base md:text-lg tracking-wide mb-8 italic"
                                    >
                                        Where Ideas Race Into Innovation
                                    </motion.p>

                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.8 }}
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30"
                                    >
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                            className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full"
                                        />
                                        <span className="text-cyan-400 text-sm tracking-wider uppercase">
                                            Loading Hackathon Arena
                                        </span>
                                    </motion.div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Skip Button */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    whileHover={{ opacity: 1, scale: 1.05 }}
                    onClick={handleSkip}
                    className="fixed bottom-8 right-8 px-4 py-2 text-xs tracking-wider uppercase text-gray-400 border border-gray-700 rounded-full hover:border-cyan-500 hover:text-cyan-400 transition-all duration-300 backdrop-blur-sm bg-black/30"
                >
                    Skip
                </motion.button>

                {/* Noise Texture Overlay */}
                <div
                    className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }}
                />

                {/* Vignette */}
                <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black opacity-60 pointer-events-none" />
            </motion.div>
        </AnimatePresence>
    );
};

export default PremiumSplashScreen;