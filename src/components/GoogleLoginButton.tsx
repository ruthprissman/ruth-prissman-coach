
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2 } from 'lucide-react';
import { useGoogleOAuth } from '@/hooks/useGoogleOAuth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function GoogleLoginButton() {
  const { 
    isAuthenticated, 
    isLoading,
    signInWithGoogle,
    signOut,
    error 
  } = useGoogleOAuth();

  const handleClick = async () => {
    if (isAuthenticated) {
      await signOut();
    } else {
      console.log('[auth] Initiating Google sign-in from GoogleLoginButton');
      await signInWithGoogle();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="!h-7 !min-h-[28px] !max-h-[28px] !w-32 px-2 text-xs gap-1 bg-white text-gray-700 border-gray-300 hover:bg-gray-50 flex-shrink-0"
              onClick={handleClick}
              disabled={isLoading}
            >
              <Calendar className="h-3 w-3 text-blue-600 flex-shrink-0" />
              <span className="truncate">{isAuthenticated ? 'התנתק מיומן Google' : 'התחבר עם גוגל'}</span>
              {isLoading && (
                <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isAuthenticated ? 'התנתק מיומן Google Calendar' : 'התחבר ליומן Google Calendar כדי לסנכרן אירועים'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {!isAuthenticated && error && (
        <Alert variant="destructive" className="mt-1 p-1.5">
          <AlertCircle className="h-3 w-3" />
          <AlertTitle className="text-xs">שגיאה בהתחברות</AlertTitle>
          <AlertDescription className="text-xs">
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {isAuthenticated && (
        <div className="text-xs text-center mt-0.5 text-green-600">
          <span>מחובר ליומן Google</span>
        </div>
      )}
    </div>
  );
}
