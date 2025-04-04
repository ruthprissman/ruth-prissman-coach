
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2 } from 'lucide-react';
import { useGoogleOAuth } from '@/hooks/useGoogleOAuth';

export function GoogleLoginButton() {
  const { 
    isAuthenticated, 
    isAuthenticating,
    signIn,
    signOut,
    events,
    isLoadingEvents,
    fetchEvents 
  } = useGoogleOAuth();

  const handleClick = async () => {
    if (isAuthenticated) {
      signOut();
    } else {
      const success = await signIn();
      if (success) {
        await fetchEvents();
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Button 
        className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 mb-2"
        onClick={handleClick}
        disabled={isAuthenticating}
      >
        <Calendar className="h-4 w-4 text-blue-600" />
        <span>{isAuthenticated ? 'התנתק מיומן Google' : 'התחבר עם גוגל'}</span>
        {isAuthenticating && (
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
        )}
      </Button>
      
      {isAuthenticated && (
        <div className="text-sm text-center mt-1 text-green-600">
          {isLoadingEvents ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              טוען אירועים...
            </span>
          ) : (
            <span>{events.length > 0 ? `${events.length} אירועים נטענו מיומן Google` : 'אין אירועים ביומן'}</span>
          )}
        </div>
      )}
    </div>
  );
}
