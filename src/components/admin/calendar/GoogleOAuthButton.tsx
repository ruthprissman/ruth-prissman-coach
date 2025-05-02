
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Calendar, RefreshCw } from 'lucide-react';

interface GoogleOAuthButtonProps {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function GoogleOAuthButton({ 
  isAuthenticated, 
  isAuthenticating, 
  onSignIn, 
  onSignOut 
}: GoogleOAuthButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any default behavior
    console.log('[GoogleOAuthButton] Button clicked, auth state:', isAuthenticated);
    
    if (isAuthenticated) {
      console.log('[GoogleOAuthButton] Signing out');
      onSignOut();
    } else {
      console.log('[GoogleOAuthButton] Signing in');
      onSignIn();
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <Button 
        variant={isAuthenticated ? "outline" : "default"}
        className={`flex items-center gap-2 ${!isAuthenticated ? "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100" : ""}`}
        onClick={handleClick}
        disabled={isAuthenticating}
      >
        {isAuthenticated ? (
          <>
            <LogOut className="h-4 w-4" />
            <span>התנתק מיומן Google</span>
          </>
        ) : (
          <>
            <Calendar className="h-4 w-4 text-blue-600" />
            <span>התחבר עם גוגל</span>
            {isAuthenticating && (
              <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
            )}
          </>
        )}
      </Button>
    </div>
  );
}
