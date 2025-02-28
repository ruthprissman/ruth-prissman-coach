
import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const navItems = [
  { name: 'אודות', path: '/about' },
  { name: 'מאמרים ותרגילים', path: '/articles' },
  { name: 'סיפורים טיפוליים', path: '/stories' },
  { name: 'שאלות ותשובות', path: '/faq' },
  { name: 'צור קשר', path: '/contact' },
  { name: 'קביעת פגישה', path: '/appointment' },
  { name: 'המלצות', path: '/recommendations' },
];

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  return (
    <nav className={cn(
      "fixed top-0 w-full z-50 transition-colors duration-300",
      scrolled ? "bg-white/90 backdrop-blur-sm shadow-md" : "bg-transparent"
    )}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-[#4A235A] p-2 focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex space-x-6 space-x-reverse">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="golden-nav-item px-3 py-2 text-[#333333] hover:text-gold transition-colors duration-300"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-[#4A235A] hover:opacity-90 transition-opacity">
              <span className={cn("transition-all duration-300", scrolled ? "text-2xl" : "text-3xl")}>
                רות פריסמן
              </span>
            </Link>
          </div>
        </div>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full right-0 w-full bg-white/95 backdrop-blur-sm shadow-lg">
            <div className="flex flex-col py-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="px-4 py-3 text-[#333333] hover:bg-gray-100 hover:text-gold transition-colors duration-200 text-right"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
