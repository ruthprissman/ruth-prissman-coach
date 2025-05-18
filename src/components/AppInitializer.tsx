
import React, { useEffect } from 'react';
import { SessionDiagnosticsComponent } from './SessionDiagnosticsComponent';
import { runSessionDiagnostics } from '@/utils/SessionDiagnostics';

/**
 * Component responsible for initializing app-wide services and utilities
 * This is intended to be included near the root of the application
 */
export const AppInitializer: React.FC = () => {
  useEffect(() => {
    // Run the static diagnostics utility on mount
    runSessionDiagnostics();
    
    // Add any other app initialization logic here
  }, []);

  // Include the React hook-based diagnostics component as well
  return (
    <SessionDiagnosticsComponent />
  );
};
