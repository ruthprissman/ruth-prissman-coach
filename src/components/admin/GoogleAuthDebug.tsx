
import React from 'react';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { debugAuthState } from '@/utils/cookieUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function GoogleAuthDebug() {
  const { 
    isAuthenticated, 
    isAuthenticating,
    debugInfo,
    signIn,
    error
  } = useGoogleAuth();
  
  const [expanded, setExpanded] = React.useState(false);
  const [storageDebug, setStorageDebug] = React.useState<any>(null);
  
  // Show detailed debug info
  const showDebugInfo = () => {
    const debug = debugAuthState();
    setStorageDebug(debug);
    setExpanded(true);
  };
  
  // Hide debug info
  const hideDebugInfo = () => {
    setExpanded(false);
  };
  
  // Force re-authentication
  const handleReAuthenticate = async () => {
    await signIn();
  };
  
  return (
    <div className="border rounded-md p-3 bg-gray-50 text-xs">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge variant={isAuthenticated ? "secondary" : "destructive"}>
            {isAuthenticated ? 'מחובר' : 'לא מחובר'}
          </Badge>
          <span>מקור: {debugInfo.authSource}</span>
          <span>נבדק: {new Date(debugInfo.lastChecked).toLocaleTimeString()}</span>
        </div>
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-6 w-6"
            onClick={expanded ? hideDebugInfo : showDebugInfo}
          >
            <span className="sr-only">Debug info</span>
            {expanded ? '−' : '+'}
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-6 w-6"
            onClick={handleReAuthenticate}
            disabled={isAuthenticating}
          >
            <RefreshCw className={`h-3 w-3 ${isAuthenticating ? 'animate-spin' : ''}`} />
            <span className="sr-only">Re-authenticate</span>
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
      
      {expanded && storageDebug && (
        <pre className="mt-2 bg-gray-100 p-2 rounded text-[10px] overflow-auto max-h-40 text-left">
          {JSON.stringify(storageDebug, null, 2)}
        </pre>
      )}
    </div>
  );
}
