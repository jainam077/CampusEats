'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: '/venues', label: 'Venues', icon: '🏢' },
    { href: '/dishes', label: 'Menu', icon: '🍕' },
    { href: '/recommendations', label: 'For You', icon: '✨' },
  ];

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/98 dark:bg-zinc-900/98 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.05)] border-b border-gray-100 dark:border-zinc-800' 
        : 'bg-white dark:bg-zinc-900'
    }`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <span className="text-2xl transform group-hover:rotate-12 transition-transform duration-300 inline-block">🍽️</span>
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500 bg-clip-text text-transparent">
              Campus Eats
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link 
                key={link.href}
                href={link.href} 
                className={`relative px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  isActive(link.href)
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-500" />
                )}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-2">
            <Link 
              href="/favorites" 
              className={`p-2.5 rounded-xl transition-all duration-200 group ${
                isActive('/favorites')
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
              }`}
              title="Favorites"
            >
              <span className="text-lg group-hover:scale-110 inline-block transition-transform">❤️</span>
            </Link>
            <Link 
              href="/reviews" 
              className={`p-2.5 rounded-xl transition-all duration-200 group ${
                isActive('/reviews')
                  ? 'bg-yellow-50 dark:bg-yellow-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
              }`}
              title="My Reviews"
            >
              <span className="text-lg group-hover:scale-110 inline-block transition-transform">⭐</span>
            </Link>
            
            <div className="w-px h-6 bg-gray-200 dark:bg-zinc-700 mx-1" />
            
            <Link 
              href="/login" 
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-sm hover:shadow-md hover:shadow-orange-500/20 transition-all duration-200 hover:-translate-y-0.5"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${
          isMenuOpen ? 'max-h-96 pb-4' : 'max-h-0'
        }`}>
          <div className="pt-2 space-y-1">
            {navLinks.map(link => (
              <Link 
                key={link.href}
                href={link.href} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-lg">{link.icon}</span>
                {link.label}
              </Link>
            ))}
            
            <div className="h-px bg-gray-100 dark:bg-zinc-800 my-2" />
            
            <Link 
              href="/favorites" 
              className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="text-lg">❤️</span>
              Favorites
            </Link>
            <Link 
              href="/reviews" 
              className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="text-lg">⭐</span>
              Reviews
            </Link>
            
            <Link 
              href="/login" 
              className="block mx-4 mt-3 py-3 text-center rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-sm"
              onClick={() => setIsMenuOpen(false)}
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
