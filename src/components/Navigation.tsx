
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
      <img 
        src="https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/public/site_imgs//blwlogo.png" 
        alt="דף הבית" 
        className="h-14 w-auto"
      />
    )
  },
  { name: 'אודות', path: '/about' },
  { name: 'סיפורים קצרים', path: '/stories' },
  { name: 'מילים גדולות', path: '/large-words' },
  { name: 'שירים', path: '/poems' },
  { name: 'לצחוק ברצינות', path: '/humor' },
  { name: 'שאלות ותשובות', path: '/faq' },
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
        <div className="flex justify-between items-center">
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-[#4A235A] p-2 focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          
          <div className="hidden md:flex items-center space-x-6 space-x-reverse">
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
