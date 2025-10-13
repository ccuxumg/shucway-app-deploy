import { NavLink } from 'react-router-dom';
import { FaHome, FaUsers, FaBoxOpen, FaEnvelope, FaSignInAlt } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import './Header.css';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        <div className="logo">
          <NavLink to="/" className="logo-link">
            <img src="/img/logo.png" alt="Shucway" className="header-logo" />
          </NavLink>
        </div>
        <nav className="nav">
          <ul className="nav-list">
            <li className="nav-module">
              <FaHome className="nav-icon" />
              <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Inicio</NavLink>
            </li>
            <li className="nav-module nav-dropdown">
              <FaUsers className="nav-icon" />
              <NavLink to="/nosotros" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Nosotros</NavLink>
              <ul className="dropdown-menu">
                <li><NavLink to="/nosotros" className="dropdown-link">Sobre Nosotros</NavLink></li>
                <li><a href="#equipo" className="dropdown-link">Equipo</a></li>
              </ul>
            </li>
            <li className="nav-module nav-dropdown">
              <FaBoxOpen className="nav-icon" />
              <NavLink to="/productos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Productos</NavLink>
              <ul className="dropdown-menu">
                <li><NavLink to="/productos" className="dropdown-link">Todos los Productos</NavLink></li>
                <li><a href="#destacados" className="dropdown-link">Destacados</a></li>
              </ul>
            </li>
            <li className="nav-module">
              <FaEnvelope className="nav-icon" />
              <NavLink to="/contacto" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Contacto</NavLink>
            </li>
          </ul>
        </nav>
        <NavLink to="/login" className="header-login-btn">
          <FaSignInAlt style={{ marginRight: 8 }} /> Iniciar Sesión
        </NavLink>
        <div className="hamburger">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </header>
  );
};

export default Header;