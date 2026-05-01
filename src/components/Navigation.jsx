import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.jsx';

export const Navigation = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="main-nav">
      <div className="nav-brand">Neo Wiring Tool</div>
      <div className="nav-links">
        <Link to="/" className="nav-link">Wiring Lookup</Link>
        <Link to="/system" className="nav-link">System Wiring</Link>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
};
