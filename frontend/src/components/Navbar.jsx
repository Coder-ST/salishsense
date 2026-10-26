import { NavLink } from "react-router-dom";
import logo from "../assets/Black and White Elegant Initials Logo (1).png";

function Navbar() {
  return (
    <nav className="top-bar">
      <div className="top-bar-brand">
        <img src={logo} alt="" className="top-bar-logo" />
        <span className="top-bar-title">
          <span className="top-bar-title-salish">Salish</span>
          <span className="top-bar-title-sense">Sense</span>
        </span>
      </div>
      <div className="top-bar-links">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/inside-the-issue">Inside the Issue</NavLink>
        <NavLink to="/our-research">Our Research</NavLink>
        <NavLink to="/ai-analysis">AI Analysis</NavLink>
        <NavLink to="/sources">Resources</NavLink>
      </div>
    </nav>
  )
}

export default Navbar;