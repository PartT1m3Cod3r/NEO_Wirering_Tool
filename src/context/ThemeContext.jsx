import { useState, useEffect } from 'react';
import { ThemeContext } from './ThemeContextValue.jsx';

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage or default to dark
    const saved = localStorage.getItem('neo-wiring-theme');
    return saved || 'dark';
  });

  useEffect(() => {
    // Apply theme class to body
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('neo-wiring-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
