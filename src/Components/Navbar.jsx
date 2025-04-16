import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear session tokens
    localStorage.removeItem('idToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Redirect to the login page
    navigate('/login');
  };

  return (
    <nav className="vertical-navbar">
      <div className="logo-section">
        <img src="/logo.png" alt="Company Logo" className="logo" />
        <h2 className="company-name">Autonomous Shipping</h2>
      </div>

      <Link to="/">Dashboard</Link>
      <Link to="/scheduling">Scheduling</Link>
      <Link to="/monitoring">Monitoring</Link>
      <Link to="/simulation">Simulation</Link>
      <Link to="/alerts">Alerts</Link>
      <Link to="/mission-planner">Mission Planner</Link>

      <button onClick={handleLogout}>Logout</button>

    </nav>
  );
};

export default Navbar;
