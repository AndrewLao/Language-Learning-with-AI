// Put other imports here like libraries and whatnot
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Components
import Navbar from './Components/Navbar.jsx';
import Banner from './Components/Banner.jsx';

// Pages
import Dashboard from './Pages/Dashboard.jsx';
import Learn from './Pages/Learn.jsx';
import Profile from './Pages/Profile.jsx';
import Quiz from './Pages/Quiz.jsx';
import Write from './Pages/Write.jsx';

// Authentication pages and logic
import Login from './Auth/Login.jsx';
import Register from './Auth/Register.jsx';
import ProtectedRoute from './Auth/ProtectedRoute.jsx';

function AppWrapper() {
  const { pathname } = useLocation();

  const showNavbar = !['', '/', '/login', '/register'].includes(pathname);
  const showBanner = ![''].includes(pathname);

  return (
    <>
      <>
        {showNavbar && <Navbar />}
        {showBanner && <Banner />}
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/learn" element={<ProtectedRoute><Learn /></ProtectedRoute>} />
          <Route path="/write" element={<ProtectedRoute><Write /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/quizzes" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
