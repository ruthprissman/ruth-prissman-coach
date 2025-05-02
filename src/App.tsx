import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import PatientList from './components/admin/patients/PatientList';
import PatientDetails from './components/admin/patients/PatientDetails';
import AddPatientForm from './components/admin/patients/AddPatientForm';
import EditPatientForm from './components/admin/patients/EditPatientForm';
import SessionList from './components/admin/sessions/SessionList';
import AddSessionForm from './components/admin/sessions/AddSessionForm';
import EditSessionForm from './components/admin/sessions/EditSessionForm';
import LoginForm from './components/auth/LoginForm';
import { supabaseClient } from './lib/supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import CalendarPage from './pages/CalendarPage';
import { Toaster } from '@/components/ui/toaster';

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
    <>
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
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/admin" element={<AdminDashboard />} />
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
          </Routes>
        </div>
      </Router>
      <Toaster />
    </>
  );
}

export default App;
