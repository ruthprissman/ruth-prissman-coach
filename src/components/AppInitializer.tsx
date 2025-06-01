
import React, { useEffect, useRef } from 'react';
import { SessionDiagnosticsComponent } from './SessionDiagnosticsComponent';
import { runSessionDiagnostics } from '@/utils/SessionDiagnostics';

/**
 * Component responsible for initializing app-wide services and utilities
 * This is intended to be included near the root of the application
 */
export const AppInitializer: React.FC = () => {
  const initializationRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (initializationRef.current) {
      console.log('[AppInitializer] Already initialized, skipping');
      return;
    }
    
    initializationRef.current = true;
    
    // Run the static diagnostics utility on mount
    runSessionDiagnostics();
    
    console.log('[AppInitializer] App initialization completed');
  }, []);

  // Include the React hook-based diagnostics component as well
  return (
    <SessionDiagnosticsComponent />
  );
};
