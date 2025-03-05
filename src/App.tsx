
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Stories from "./pages/Stories";
import NotFound from "./pages/NotFound";
import Login from "./pages/admin/Login";
import ResetPassword from "./pages/admin/ResetPassword";
import Dashboard from "./pages/admin/Dashboard";
import PatientsList from "./pages/admin/PatientsList";
import PatientProfile from "./pages/admin/PatientProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/articles" element={<Index />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/faq" element={<Index />} />
            <Route path="/appointment" element={<Index />} />
            <Route path="/recommendations" element={<Index />} />
            <Route path="/privacy" element={<Index />} />
            <Route path="/terms" element={<Index />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin-login" element={<Login />} /> {/* Added new route for double-click access */}
            <Route path="/admin/reset-password" element={<ResetPassword />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/patients" 
              element={
                <ProtectedRoute>
                  <PatientsList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/patients/:id" 
              element={
                <ProtectedRoute>
                  <PatientProfile />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
