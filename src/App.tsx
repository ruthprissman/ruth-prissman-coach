
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NewHome from './pages/NewHome';
import About from './pages/About';
import Contact from './pages/Contact';
import Stories from './pages/Stories';
import Articles from './pages/Articles';
import LargeWords from './pages/LargeWords';
import Poems from './pages/Poems';
import Humor from './pages/Humor';
import Workshops from './pages/Workshops';
import ArticleView from './pages/ArticleView';
import PoemView from './pages/PoemView';
import HumorView from './pages/HumorView';
import Unsubscribe from './pages/Unsubscribe';
import Subscribe from './pages/Subscribe';
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
import StoriesManagement from './pages/admin/StoriesManagement';
import FinancesManagement from './pages/admin/FinancesManagement';
import FinancialAnalytics from './pages/admin/FinancialAnalytics';
import FinancialSettings from './pages/admin/FinancialSettings';
import WorkshopsManagement from './pages/admin/WorkshopsManagement';
import LandingPagesManagement from './pages/admin/LandingPagesManagement';
import LeadsManagement from './pages/admin/LeadsManagement';
import { ThemeProvider } from './components/ui/theme-provider';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { PublicationProvider } from './contexts/PublicationContext';
import { Toaster } from './components/ui/toaster';
import FAQ from './pages/FAQ';
import Terms from './pages/Terms';
import WorkshopLanding from './pages/WorkshopLanding';
import HebrewLandingPage from './components/HebrewLandingPage';
import RuthFrissmanWorkshop from './pages/RuthFrissmanWorkshop';
import { ScrollToTop } from './components/ScrollToTop';
import { runSessionDiagnostics } from './utils/SessionDiagnostics';

import './index.css';

// Initialize session diagnostics to help debug session issues
runSessionDiagnostics();

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function App() {
  console.log('App component rendering');
  
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <AuthProvider>
            <Router>
              <ScrollToTop />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<NewHome />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/stories" element={<Stories />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/large-words" element={<LargeWords />} />
                <Route path="/poems" element={<Poems />} />
                <Route path="/humor" element={<Humor />} />
                <Route path="/workshops" element={<Workshops />} />
                <Route path="/articles/:id" element={<ArticleView />} />
                <Route path="/large-words/:id" element={<ArticleView />} />
                <Route path="/poems/:id" element={<PoemView />} />
                <Route path="/humor/:id" element={<HumorView />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/workshop" element={<WorkshopLanding />} />
                <Route path="/prayer-landing" element={<HebrewLandingPage />} />
                <Route path="/workshops/ruth-frissman" element={<RuthFrissmanWorkshop />} />

                {/* Admin auth routes */}
                <Route path="/admin/login" element={<Login />} />
                <Route path="/admin/reset-password" element={<ResetPassword />} />
                
                {/* Protected admin routes */}
                <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/admin/leads" element={<ProtectedRoute><LeadsManagement /></ProtectedRoute>} />
                <Route path="/admin/patients" element={<ProtectedRoute><PatientsList /></ProtectedRoute>} />
                <Route path="/admin/patients/:id" element={<ProtectedRoute><ClientDetails /></ProtectedRoute>} />
                <Route path="/admin/sessions" element={<ProtectedRoute><AllSessions /></ProtectedRoute>} />
                <Route path="/admin/exercises" element={<ProtectedRoute><ExerciseManagement /></ProtectedRoute>} />
                <Route path="/admin/calendar" element={<ProtectedRoute><CalendarManagement /></ProtectedRoute>} />
                <Route path="/admin/stories" element={<ProtectedRoute><StoriesManagement /></ProtectedRoute>} />
                <Route path="/admin/finances" element={<ProtectedRoute><FinancesManagement /></ProtectedRoute>} />
                <Route path="/admin/financial-analytics" element={<ProtectedRoute><FinancialAnalytics /></ProtectedRoute>} />
                <Route path="/admin/financial-settings" element={<ProtectedRoute><FinancialSettings /></ProtectedRoute>} />
                <Route path="/admin/workshops" element={<ProtectedRoute><WorkshopsManagement /></ProtectedRoute>} />
                <Route path="/admin/landing-pages" element={<ProtectedRoute><LandingPagesManagement /></ProtectedRoute>} />
                
                {/* Article management routes wrapped with PublicationProvider */}
                <Route path="/admin/articles/*" element={
                  <PublicationProvider>
                    <Routes>
                      <Route path="/" element={<ProtectedRoute><ArticlesManagement /></ProtectedRoute>} />
                      <Route path="/new" element={<ProtectedRoute><ArticleEditor /></ProtectedRoute>} />
                      <Route path="/edit/:id" element={<ProtectedRoute><ArticleEditor /></ProtectedRoute>} />
                    </Routes>
                  </PublicationProvider>
                } />

                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </Router>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
