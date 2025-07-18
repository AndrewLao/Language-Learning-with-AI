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
        <h2 className="company-name">LLAI</h2>
      </div>
      <Link to="/">Dashboard</Link>
      <Link to="/learn">Learn</Link>
      <Link to="/write">Write</Link>
      <Link to="/profile">Profile</Link>
      <br />
      <button onClick={handleLogout}>Logout</button>

    </nav>
  );
};

export default Navbar;
