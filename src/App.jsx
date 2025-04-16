import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Dashboard from './Pages/Dashboard.jsx';
import Scheduling from './Pages/Scheduling.jsx';
import Monitoring from './Pages/Monitoring.jsx';
import Simulation from './Pages/Simulation.jsx';
import Alerts from './Pages/Alerts.jsx';
import MissionPlanner from './Pages/MissionPlanner.jsx';
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
          <Route path="/scheduling" element={<ProtectedRoute><Scheduling /></ProtectedRoute>} />
          <Route path="/monitoring" element={<ProtectedRoute><Monitoring /></ProtectedRoute>} />
          <Route path="/simulation" element={<ProtectedRoute><Simulation /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
          <Route path="/mission-planner" element={<ProtectedRoute><MissionPlanner /></ProtectedRoute>} />
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
