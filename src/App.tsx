
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import About from './pages/About';
import Contact from './pages/Contact';
import Stories from './pages/Stories';
import Unsubscribe from './pages/Unsubscribe';
import NotFound from './pages/NotFound';
import Login from './pages/admin/Login';
import ResetPassword from './pages/admin/ResetPassword';
import Dashboard from './pages/admin/Dashboard';
import PatientsList from './pages/admin/PatientsList';
import PatientProfile from './pages/admin/PatientProfile';
import AllSessions from './pages/admin/AllSessions';
import ExerciseManagement from './pages/admin/ExerciseManagement';
import ArticlesManagement from './pages/admin/ArticlesManagement';
import ArticleEditor from './pages/admin/ArticleEditor';
import { ThemeProvider } from './components/ui/theme-provider';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { PublicationProvider } from './contexts/PublicationContext';
import { Toaster } from './components/ui/toaster';

function App() {
  console.log('App component rendering');
  
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AuthProvider>
        <PublicationProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/stories" element={<Stories />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />

              {/* Admin auth routes - Make sure these are outside ProtectedRoute */}
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin/reset-password" element={<ResetPassword />} />
              
              {/* Protected admin routes */}
              <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/admin/patients" element={<ProtectedRoute><PatientsList /></ProtectedRoute>} />
              <Route path="/admin/patients/:id" element={<ProtectedRoute><PatientProfile /></ProtectedRoute>} />
              <Route path="/admin/sessions" element={<ProtectedRoute><AllSessions /></ProtectedRoute>} />
              <Route path="/admin/exercises" element={<ProtectedRoute><ExerciseManagement /></ProtectedRoute>} />
              <Route path="/admin/articles" element={<ProtectedRoute><ArticlesManagement /></ProtectedRoute>} />
              <Route path="/admin/articles/new" element={<ProtectedRoute><ArticleEditor /></ProtectedRoute>} />
              <Route path="/admin/articles/edit/:id" element={<ProtectedRoute><ArticleEditor /></ProtectedRoute>} />

              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </PublicationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
