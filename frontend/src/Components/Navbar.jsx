import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Clear session tokens
    localStorage.removeItem('idToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('cognitoSub');

    // Redirect to the login page
    navigate('/login');
  };

  const navLinks = [
    { to: "/learn", label: "Learn" },
    { to: "/write", label: "Write" },
    { to: "/profile", label: "Profile" },
  ];

  return (
    <nav className="vertical-navbar">
      <div className="logo-section">
        <h2 className="company-name">LLAI</h2>
      </div>
      {navLinks.map(link => (
        <Link
          key={link.to}
          to={link.to}
          className={location.pathname === link.to ? "active" : ""}
        >
          {link.label}
        </Link>
      ))}
      <br />
      <button onClick={handleLogout}>Logout</button>

    </nav>
  );
};

export default Navbar;
