import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { SystemWiring } from './pages/SystemWiring.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { Layout } from './components/Layout.jsx'

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

export default AppWithTheme;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWithTheme />
  </StrictMode>,
)
