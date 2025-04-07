
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Index from './pages/Index';
import About from './pages/About';
import Contact from './pages/Contact';
import Stories from './pages/Stories';
import Articles from './pages/Articles';
import Poems from './pages/Poems';
import ArticleView from './pages/ArticleView';
import PoemView from './pages/PoemView';
import Unsubscribe from './pages/Unsubscribe';
import PrivacyPolicy from './pages/PrivacyPolicy';
import NotFound from './pages/NotFound';
import Login from './pages/admin/Login';
import ResetPassword from './pages/admin/ResetPassword';
import Dashboard from './pages/admin/Dashboard';
import PatientsList from './pages/admin/PatientsList';
import ClientDetails from './pages/admin/ClientDetails';
import AllSessions from './pages/admin/AllSessions';
import ExerciseManagement from './pages/admin/ExerciseManagement';
import ArticlesManagement from './pages/admin/ArticlesManagement';
import ArticleEditor from './pages/admin/ArticleEditor';
import CalendarManagement from './pages/admin/CalendarManagement';
import { ThemeProvider } from './components/ui/theme-provider';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { PublicationProvider } from './contexts/PublicationContext';
import { Toaster } from './components/ui/toaster';
import FAQ from './pages/FAQ';
import Terms from './pages/Terms';
import { ScrollToTop } from './components/ScrollToTop';

import './index.css';

function App() {
  console.log('App component rendering');
  
  return (
    <HelmetProvider>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <AuthProvider>
          <PublicationProvider>
            <Router>
              <ScrollToTop />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/stories" element={<Stories />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/poems" element={<Poems />} />
                <Route path="/articles/:id" element={<ArticleView />} />
                <Route path="/poems/:id" element={<PoemView />} />
                <Route path="/unsubscribe" element={<Unsubscribe />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/faq" element={<FAQ />} />

                {/* Admin auth routes */}
                <Route path="/admin/login" element={<Login />} />
                <Route path="/admin/reset-password" element={<ResetPassword />} />
                
                {/* Protected admin routes */}
                <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/admin/patients" element={<ProtectedRoute><PatientsList /></ProtectedRoute>} />
                <Route path="/admin/patients/:id" element={<ProtectedRoute><ClientDetails /></ProtectedRoute>} />
                <Route path="/admin/sessions" element={<ProtectedRoute><AllSessions /></ProtectedRoute>} />
                <Route path="/admin/exercises" element={<ProtectedRoute><ExerciseManagement /></ProtectedRoute>} />
                <Route path="/admin/articles" element={<ProtectedRoute><ArticlesManagement /></ProtectedRoute>} />
                <Route path="/admin/articles/new" element={<ProtectedRoute><ArticleEditor /></ProtectedRoute>} />
                <Route path="/admin/articles/edit/:id" element={<ProtectedRoute><ArticleEditor /></ProtectedRoute>} />
                <Route path="/admin/calendar" element={<ProtectedRoute><CalendarManagement /></ProtectedRoute>} />

                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </Router>
          </PublicationProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
