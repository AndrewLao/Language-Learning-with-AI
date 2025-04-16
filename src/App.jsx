import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Dashboard from './Pages/Dashboard.jsx';
import Login from './Auth/Login.jsx';
import Register from './Auth/Register.jsx';
import ProtectedRoute from './Auth/ProtectedRoute.jsx';

function AppWrapper() {
  const { pathname } = useLocation();

  const showNavbar = !['/', '/login', '/register'].includes(pathname);


  return (
    <>
      <>
        {showNavbar && <Navbar />}
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        </Routes>
      </>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  )
}
