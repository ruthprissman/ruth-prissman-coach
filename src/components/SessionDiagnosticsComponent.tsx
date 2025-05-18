
import React, { useEffect } from 'react';
import useSessionDiagnostics from '@/hooks/useSessionDiagnostics';

/**
 * A component that initializes session diagnostics when mounted.
 * This component should be included once in the app, preferably near the root.
 * It doesn't render anything visible in the UI.
 */
export const SessionDiagnosticsComponent: React.FC = () => {
  const { report } = useSessionDiagnostics();

  // You can add additional effects here if needed
  useEffect(() => {
    // This effect runs when the diagnostics report changes
    if (report.issues.length > 0) {
      console.log('🔍 Session diagnostics detected issues:', report.issues);
    }
  }, [report]);

  // This component doesn't render anything visible
  return null;
};
