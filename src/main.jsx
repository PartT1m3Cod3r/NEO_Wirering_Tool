import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { SystemWiring } from './pages/SystemWiring.jsx'

// Navigation component
const Navigation = () => (
  <nav className="main-nav">
    <div className="nav-brand">Neo Wiring Tool</div>
    <div className="nav-links">
      <Link to="/" className="nav-link">Wiring Lookup</Link>
      <Link to="/system" className="nav-link">System Wiring</Link>
    </div>
  </nav>
)

// Layout component with navigation
const Layout = ({ children }) => (
  <>
    <Navigation />
    {children}
  </>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><App /></Layout>} />
        <Route path="/system" element={<Layout><SystemWiring /></Layout>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
