
import { SessionType } from '@/types/sessionTypes';

export const getSessionTypeIcon = (sessionTypeId: number | null | undefined, sessionTypes?: SessionType[]): string | null => {
  if (!sessionTypeId || !sessionTypes) return null;
  
  const sessionType = sessionTypes.find(type => type.id === sessionTypeId);
  if (!sessionType) return null;
  
  // Map session type codes to icons
  switch (sessionType.code) {
    case 'regular':
      return 'ק'; // קוד הנפש
    case 'intake':
      return 'א'; // אינטייק
    case 'seft':
      return 'S'; // SEFT
    default:
      return sessionType.name.charAt(0); // First character of the name as fallback
  }
};

export const getSessionTypeIconColor = (sessionTypeId: number | null | undefined, sessionTypes?: SessionType[]): string => {
  if (!sessionTypeId || !sessionTypes) return 'bg-gray-100 text-gray-600';
  
  const sessionType = sessionTypes.find(type => type.id === sessionTypeId);
  if (!sessionType) return 'bg-gray-100 text-gray-600';
  
  // Different colors for different session types
  switch (sessionType.code) {
    case 'regular':
      return 'bg-purple-100 text-purple-700';
    case 'intake':
      return 'bg-blue-100 text-blue-700';
    case 'seft':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-orange-100 text-orange-700';
  }
};
