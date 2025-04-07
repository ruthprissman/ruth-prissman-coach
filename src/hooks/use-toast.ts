
// Import from the UI component
import { toast as sonnerToast } from "sonner";
import { useToast as useHookToast } from "@/components/ui/use-toast";

// Re-export the original hook
export const useToast = useHookToast;

// Create an enhanced toast function for immediate use without hooks
export const toast = {
  ...sonnerToast,
  // Helper methods that match our toast API
  error: (message: string) => {
    sonnerToast.error(message);
    console.error(`Toast error: ${message}`);
  },
  success: (message: string) => {
    sonnerToast.success(message);
    console.log(`Toast success: ${message}`);
  },
  info: (message: string) => {
    sonnerToast(message);
    console.log(`Toast info: ${message}`);
  },
  warning: (message: string) => {
    sonnerToast(message, { 
      style: { backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeeba' }
    });
    console.warn(`Toast warning: ${message}`);
  }
};
