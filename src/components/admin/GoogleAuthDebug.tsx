
import React from 'react';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';

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
  const showDebugInfo = async () => {
    try {
      // Get Supabase session info for debugging
      const supabase = supabaseClient();
      const { data } = await supabase.auth.getSession();
      
      const debug = {
        session: {
          hasSession: !!data.session,
          hasProviderToken: !!data.session?.provider_token,
          // Remove the 'provider' property access which doesn't exist in Session type
          // Instead check for provider_token presence which is more relevant
          hasProviderAuth: !!data.session?.provider_token,
          user: data.session?.user?.email || 'unknown'
        },
        contextDebug: debugInfo
      };
      
      setStorageDebug(debug);
      setExpanded(true);
    } catch (e) {
      console.error('Error in debug info:', e);
      setStorageDebug({ error: String(e) });
      setExpanded(true);
    }
  };
  
  // Hide debug info
  const hideDebugInfo = () => {
    setExpanded(false);
  };
  
  // Force re-authentication
  const handleReAuthenticate = async () => {
    await signIn();
  };
  
  // Format token expiry time
  const tokenExpiryTime = debugInfo.tokenExpiryTime 
    ? new Date(debugInfo.tokenExpiryTime).toLocaleTimeString()
    : 'לא ידוע';
  
  return (
    <div className="border rounded-md p-3 bg-gray-50 text-xs">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge variant={isAuthenticated ? "secondary" : "destructive"}>
            {isAuthenticated ? 'מחובר' : 'לא מחובר'}
          </Badge>
          <span>מקור: {debugInfo.authSource}</span>
          <span>נבדק: {new Date(debugInfo.lastChecked).toLocaleTimeString()}</span>
          {debugInfo.tokenExpiryTime && (
            <span>פג תוקף: {tokenExpiryTime}</span>
          )}
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
