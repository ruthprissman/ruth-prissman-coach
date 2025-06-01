
import React, { useEffect, useRef } from 'react';
import useSessionDiagnostics from '@/hooks/useSessionDiagnostics';

/**
 * A component that initializes session diagnostics when mounted.
 * This component should be included once in the app, preferably near the root.
 * It doesn't render anything visible in the UI.
 */
export const SessionDiagnosticsComponent: React.FC = () => {
  const { report } = useSessionDiagnostics();
  const loggedRef = useRef(false);

  // You can add additional effects here if needed
  useEffect(() => {
    // Prevent duplicate logging
    if (loggedRef.current) return;
    
    // This effect runs when the diagnostics report changes
    if (report.issues.length > 0) {
      console.log('🔍 Session diagnostics detected issues:', report.issues);
      loggedRef.current = true;
    } else if (report.authEvents.length > 0) {
      console.log('✅ Session diagnostics completed with no issues detected');
      loggedRef.current = true;
    }
  }, [report]);

  // This component doesn't render anything visible
  return null;
};
