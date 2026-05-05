import { Link } from 'react-router-dom';
import './LandingPage.css';

export const LandingPage = () => {
  return (
    <div className="landing-page">
      <div className="lp-grid" />
      <div className="lp-scan-line" />

      <div className="landing-hero">
        <div className="lp-status">
          <span className="lp-status-dot" />
          <span>SYSTEM ONLINE</span>
        </div>

        <h1 className="landing-title">
          <span className="lp-title-neo">NEO</span>
          <span className="lp-title-suite">TOOL SUITE</span>
        </h1>

        <p className="landing-subtitle">
          Wiring &amp; Network Design Tools for Neo IoT Devices
        </p>
      </div>

      <div className="landing-cards">
        <Link to="/wiring" className="landing-card">
          <span className="lp-corner lp-tl" /><span className="lp-corner lp-tr" />
          <span className="lp-corner lp-bl" /><span className="lp-corner lp-br" />
          <div className="lp-card-num">01</div>
          <div className="lp-card-sweep" />
          <div className="lp-card-badge">🔌</div>
          <h2 className="landing-card-title">Wiring Lookup</h2>
          <p className="landing-card-text">
            Interactive pin reference and single-device wiring diagrams
          </p>
          <div className="lp-card-cta">ENTER →</div>
        </Link>

        <Link to="/system" className="landing-card lp-card-primary">
          <span className="lp-corner lp-tl" /><span className="lp-corner lp-tr" />
          <span className="lp-corner lp-bl" /><span className="lp-corner lp-br" />
          <div className="lp-card-num">02</div>
          <div className="lp-card-sweep" />
          <div className="lp-card-badge">⚡</div>
          <h2 className="landing-card-title">System Wiring</h2>
          <p className="landing-card-text">
            Design complete system layouts with multiple devices, BOMs, and exports
          </p>
          <div className="lp-card-cta">ENTER →</div>
        </Link>

        <Link to="/network" className="landing-card">
          <span className="lp-corner lp-tl" /><span className="lp-corner lp-tr" />
          <span className="lp-corner lp-bl" /><span className="lp-corner lp-br" />
          <div className="lp-card-num">03</div>
          <div className="lp-card-sweep" />
          <div className="lp-card-badge">📡</div>
          <h2 className="landing-card-title">Network Designer</h2>
          <p className="landing-card-text">
            Plan CoreLink networks with distance, line-of-sight, and RSSI analysis
          </p>
          <div className="lp-card-cta">ENTER →</div>
        </Link>
      </div>

      <footer className="landing-footer">
        <span>NEO TOOL SUITE v1.3.0</span>
      </footer>
    </div>
  );
};
