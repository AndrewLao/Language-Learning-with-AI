// Put other imports here like libraries and whatnot
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Components
import Navbar from './Components/Navbar.jsx';
import Banner from './Components/Banner.jsx';

// Pages
import Dashboard from './Pages/Dashboard.jsx';
import Learn from './Pages/Learn.jsx';
import Profile from './Pages/Profile.jsx';

// Document Editor
import Write from './DocumentEditor/Write.jsx';

// Authentication pages and logic
import Login from './Auth/Login.jsx';
import Register from './Auth/Register.jsx';
import ProtectedRoute from './Auth/ProtectedRoute.jsx';

function AppWrapper() {
  const { pathname } = useLocation();

  const showNavbar = !['', '/login', '/register'].includes(pathname);
  const showBanner = ![''].includes(pathname);

  return (
    <>
      <>
        {showNavbar && <Navbar />}
        {showBanner && <Banner />}
        {/* Auth logic currently ignored since cognito is turned off right now. Add after app finished.*/}
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/learn" element={<ProtectedRoute><Learn /></ProtectedRoute>} />
          <Route path="/write" element={<ProtectedRoute><Write /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /> */}
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
