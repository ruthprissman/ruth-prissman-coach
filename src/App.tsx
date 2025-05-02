
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import Dashboard from './pages/admin/Dashboard';
import { supabaseClient } from './lib/supabaseClient';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabaseClient().auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabaseClient().auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  return (
    <AuthProvider>
      <Router>
        <div className="container mx-auto px-4">
          <nav className="bg-white py-4">
            <ul className="flex space-x-4 space-x-reverse">
              <li>
                <Link to="/admin" className="hover:text-gray-500">דף הבית</Link>
              </li>
              <li>
                <Link to="/admin/patients" className="hover:text-gray-500">מטופלים</Link>
              </li>
              <li>
                <Link to="/admin/sessions" className="hover:text-gray-500">פגישות</Link>
              </li>
              <li>
                <Link to="/admin/calendar" className="hover:text-gray-500">לוח שנה</Link>
              </li>
            </ul>
          </nav>

          <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" />} />
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            {/* 
              We're temporarily commenting out routes that reference missing components.
              These will need to be added later or updated with proper components.
            */}
            {/*
            <Route path="/login" element={<LoginForm />} />
            <Route path="/admin/patients" element={<PatientList />} />
            <Route path="/admin/patients/:id" element={<PatientDetails />} />
            <Route path="/admin/patients/add" element={<AddPatientForm />} />
            <Route path="/admin/patients/edit/:id" element={<EditPatientForm />} />
            <Route path="/admin/sessions" element={<SessionList />} />
            <Route path="/admin/sessions/add" element={<AddSessionForm />} />
            <Route path="/admin/sessions/edit/:id" element={<EditSessionForm />} />
            <Route path="/admin/calendar" element={<CalendarPage />} />
            <Route
              path="/account"
              element={
                !session ? (
                  <Navigate to="/login" />
                ) : (
                  <div className="container" style={{ padding: '50px 0 100px 0' }}>
                    <Auth
                      supabaseClient={supabaseClient()}
                      appearance={{ theme: ThemeSupa }}
                      session={session}
                      providers={['google', 'github']}
                      redirectTo="http://localhost:3000/admin"
                    />
                  </div>
                )
              }
            />
            */}
          </Routes>
        </div>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
