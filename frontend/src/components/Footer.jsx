import { Link } from "react-router-dom";
import logo from "../assets/Black and White Elegant Initials Logo (1).png";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-main">
        <div className="site-footer-brand">
          <div className="site-footer-logo-row">
            <span className="site-footer-logo-wrap">
              <img src={logo} alt="" className="site-footer-logo" />
            </span>
            <span className="site-footer-name">SalishSense</span>
          </div>
          <p className="site-footer-about">
            The Washington water quality hub and AI tool for community improvement. We use open data and AI to help protect local waters.
          </p>
        </div>

        <nav className="site-footer-col site-footer-nav" aria-label="Footer navigation">
          <h4>Navigation</h4>
          <Link to="/">Home</Link>
          <Link to="/inside-the-issue">Inside the Issue</Link>
          <Link to="/our-research">Our Research</Link>
          <Link to="/ai-analysis">AI Analysis</Link>
          <Link to="/sources">Resources</Link>
        </nav>

        <div className="site-footer-col">
          <h4>Related Organizations</h4>
          <a href="https://kingcounty.gov" target="_blank" rel="noreferrer">King County Water Department</a>
          <a href="https://bellevuewa.gov" target="_blank" rel="noreferrer">City of Bellevue</a>
          <a href="https://ecology.wa.gov" target="_blank" rel="noreferrer">Washington Department of Ecology</a>
        </div>
      </div>

      <div className="site-footer-bottom">
        © 2026 SalishSense. This is a student-led project, made purely for educational purposes.
      </div>
    </footer>
  );
}

export default Footer;
