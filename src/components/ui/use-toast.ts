
// Re-export toast components from Radix
import * as React from "react"
import { useToast as useToastOriginal } from "@/components/ui/toast"
import { toast as sonnerToast } from "sonner"
import type { ExternalToast } from "sonner"

export interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  action?: React.ReactNode
}

export const useToast = () => {
  return useToastOriginal()
}

// Create an enhanced toast function for immediate use without hooks
export const toast = {
  // Original toast function for UI toast
  ...useToastOriginal(),
  
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
