
import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { 
    name: 'דף הבית', 
    path: '/',
    isHome: true,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 10L12 3L21 10V21H14V15H10V21H3V10Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#D4AF37"/>
      </svg>
    )
  },
  { name: 'אודות', path: '/about' },
  { name: 'מאמרים', path: '/articles' },
  { name: 'סיפורים קצרים', path: '/stories' },
  { name: 'שאלות ותשובות', path: '/faq' },
  { name: 'המלצות', path: '/recommendations' },
  { name: 'קביעת פגישה', path: '/appointment' },
  { name: 'צור קשר', path: '/contact' },
];

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

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
        <div className="flex flex-wrap justify-between items-center">
          <div className="md:hidden order-1">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-[#4A235A] p-2 focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          
          <div className="hidden md:flex items-center space-x-6 space-x-reverse order-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                aria-label={item.isHome ? "דף הבית" : undefined}
                className={cn(
                  "golden-nav-item px-3 py-2 text-[#333333] hover:text-gold transition-colors duration-300 flex items-center",
                  location.pathname === item.path && "text-gold after:scale-x-100"
                )}
              >
                {item.icon ? item.icon : item.name}
              </Link>
            ))}
          </div>

          {/* Copyright notice */}
          <div className="text-[#4A235A] text-xs md:text-sm order-3 w-full md:w-auto md:order-3 mt-2 md:mt-0 text-center md:text-left">
            © כל הזכויות שמורות לשמחה אביטן - מפתחת השיטה קוד הנפש
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden absolute top-full right-0 w-full bg-white/80 backdrop-blur-sm shadow-lg">
            <div className="flex flex-col py-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  aria-label={item.isHome ? "דף הבית" : undefined}
                  className={cn(
                    "px-4 py-3 text-[#333333] hover:bg-gray-100 hover:text-gold transition-colors duration-200 text-right flex items-center justify-end",
                    location.pathname === item.path && "text-gold bg-gray-50"
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.isHome ? item.icon : item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
