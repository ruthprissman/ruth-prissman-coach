import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Scene {
  id: string;
  lines: string[];
  animation: 'fade-together' | 'pop-stagger' | 'slide-blur' | 'fog-clear' | 'scale-highlight';
}

const scenes: Scene[] = [
  {
    id: 'A',
    lines: [
      "מכירה את זה ש…",
      "הרגשות שנלווים לניסיון כבדים יותר מהניסיון עצמו?"
    ],
    animation: 'fade-together'
  },
  {
    id: 'B', 
    lines: [
      "דחייה. אשמה. בגידה. בדידות.",
      "ולפעמים… פשוט אין להן שם…"
    ],
    animation: 'pop-stagger'
  },
  {
    id: 'C',
    lines: [
      "מכירה את זה ש…",
      "נוצר בלגן פנימי, שלא מאפשר לנו לזהות מה אנחנו רוצות באמת?"
    ],
    animation: 'slide-blur'
  },
  {
    id: 'D',
    lines: [
      "מכירה את זה ש…",
      "החרדה מחוויות העבר והפחד מתוצאות העתיד חונקים את ההווה?"
    ],
    animation: 'fog-clear'
  },
  {
    id: 'E',
    lines: [
      "אני מאמינה",
      "שכל אישה יכולה להביא לעצמה גאולה פנימית – משיח פרטי משלה.",
      "שחרור מתלות; חיבור לעצמה, לסביבה ולבורא."
    ],
    animation: 'scale-highlight'
  }
];

export default function ScrollytellingHero() {
  const [currentScene, setCurrentScene] = useState(0);
  const [showCTA, setShowCTA] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (currentScene >= scenes.length) {
      setShowCTA(true);
      return;
    }

    const timer = setTimeout(() => {
      if (currentScene < scenes.length - 1) {
        setCurrentScene(prev => prev + 1);
        setAnimationPhase(0);
      } else {
        setShowCTA(true);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [currentScene]);

  const renderScene = (scene: Scene, index: number) => {
    const isActive = index === currentScene;
    if (!isActive) return null;

    switch (scene.animation) {
      case 'fade-together':
        return (
          <div className="animate-fade-in duration-800">
            {scene.lines.map((line, i) => (
              <p key={i} className="text-3xl md:text-4xl lg:text-5xl font-heebo leading-relaxed mb-4 text-black">
                {line}
              </p>
            ))}
          </div>
        );

      case 'pop-stagger':
        return (
          <div>
            <div className="mb-4">
              {scene.lines[0].split('.').map((word, i) => (
                <span
                  key={i}
                  className="inline-block text-3xl md:text-4xl lg:text-5xl font-heebo mr-2 animate-scale-in text-black"
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  {word}{i < scene.lines[0].split('.').length - 1 ? '.' : ''}
                </span>
              ))}
            </div>
            <p 
              className="text-3xl md:text-4xl lg:text-5xl font-heebo leading-relaxed animate-fade-in text-black"
              style={{ animationDelay: '0.8s' }}
            >
              {scene.lines[1]}
            </p>
          </div>
        );

      case 'slide-blur':
        return (
          <div className="animate-[slide-up-blur_0.8s_ease-out]">
            {scene.lines.map((line, i) => (
              <p key={i} className="text-3xl md:text-4xl lg:text-5xl font-heebo leading-relaxed mb-4 text-black">
                {line}
              </p>
            ))}
          </div>
        );

      case 'fog-clear':
        return (
          <div className="relative">
            <div className="absolute inset-0 bg-white/30 animate-[fog-overlay_2s_ease-in-out]" />
            <div className="relative animate-fade-in">
              {scene.lines.map((line, i) => (
                <p key={i} className="text-3xl md:text-4xl lg:text-5xl font-heebo leading-relaxed mb-4 text-black">
                  {line}
                </p>
              ))}
            </div>
          </div>
        );

      case 'scale-highlight':
        return (
          <div className="animate-[scale-115_0.8s_ease-out] relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg animate-fade-in" style={{ animationDelay: '0.4s' }} />
            <div className="relative p-6">
              {scene.lines.map((line, i) => (
                <p key={i} className="text-3xl md:text-4xl lg:text-5xl font-heebo leading-relaxed mb-4 text-black">
                  {line}
                </p>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div>
            {scene.lines.map((line, i) => (
              <p key={i} className="text-3xl md:text-4xl lg:text-5xl font-heebo leading-relaxed mb-4 text-black">
                {line}
              </p>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
      <div className="min-h-[400px] flex items-center justify-center">
        {currentScene < scenes.length && (
          <div key={currentScene} className="max-w-5xl">
            {renderScene(scenes[currentScene], currentScene)}
          </div>
        )}
        
        {showCTA && (
          <div className="animate-[spring-scale_0.6s_cubic-bezier(0.175,0.885,0.32,1.275)]">
            <Link 
              to="/contact"
              className="inline-block bg-primary hover:bg-primary/90 text-white px-16 py-6 rounded-[40px] text-2xl font-heebo transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl animate-pulse"
            >
              לתיאום פגישה אישית
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}