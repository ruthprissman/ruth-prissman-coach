
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Calendar } from 'lucide-react';

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
  return (
    <div className="flex items-center justify-center gap-2 h-full">
      {isAuthenticated ? (
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={onSignOut}
          disabled={isAuthenticating}
        >
          <LogOut className="h-4 w-4" />
          <span>התנתק מיומן Google</span>
        </Button>
      ) : (
        <Button 
          className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
          onClick={onSignIn}
          disabled={isAuthenticating}
        >
          <Calendar className="h-4 w-4 text-blue-600" />
          <span>התחבר עם גוגל</span>
          {isAuthenticating && (
            <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
          )}
        </Button>
      )}
    </div>
  );
}
