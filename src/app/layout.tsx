// app/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { Inter } from 'next/font/google';
import PremiumSplashScreen from '@/components/PremiumSplashScreen';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem('splashShown')) {
      setShowSplash(false);
    }
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        {showSplash && (
          <PremiumSplashScreen onComplete={() => setShowSplash(false)} />
        )}
        {children}
      </body>
    </html>
  );
}