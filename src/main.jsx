import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { SystemWiring } from './pages/SystemWiring.jsx'
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx'

// Navigation component with theme toggle
const Navigation = () => {
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

// Layout component with navigation
const Layout = ({ children }) => (
  <>
    <Navigation />
    {children}
  </>
)

// App with ThemeProvider
const AppWithTheme = () => (
  <ThemeProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><App /></Layout>} />
        <Route path="/system" element={<Layout><SystemWiring /></Layout>} />
      </Routes>
    </BrowserRouter>
  </ThemeProvider>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWithTheme />
  </StrictMode>,
)
