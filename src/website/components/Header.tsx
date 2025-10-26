import { NavLink } from 'react-router-dom';
import { FaHome, FaUsers, FaBoxOpen, FaEnvelope, FaSignInAlt } from 'react-icons/fa';
import { useEffect, useState, useRef } from 'react';
import './Header.css';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [hoveredDropdown, setHoveredDropdown] = useState<string | null>(null);
  const dropdownTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleMouseEnter = (dropdownName: string) => {
    // Limpiar cualquier timeout pendiente para este dropdown
    if (dropdownTimeouts.current[dropdownName]) {
      clearTimeout(dropdownTimeouts.current[dropdownName]);
    }
    setHoveredDropdown(dropdownName);
  };

  const handleMouseLeave = (dropdownName: string) => {
    // Agregar un pequeño delay antes de cerrar el dropdown
    dropdownTimeouts.current[dropdownName] = setTimeout(() => {
      setHoveredDropdown(null);
    }, 150); // 150ms delay
  };

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        <div className="logo">
          <NavLink to="/" className="logo-link">
            <img src="/img/logo.png" alt="Shucway" className="header-logo logo-hover" />
          </NavLink>
        </div>
        <nav className="nav">
          <ul className="nav-list">
            <li className="nav-module">
              <FaHome className="nav-icon" />
              <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Inicio</NavLink>
            </li>
            <li
              className="nav-module nav-dropdown"
              onMouseEnter={() => handleMouseEnter('nosotros')}
              onMouseLeave={() => handleMouseLeave('nosotros')}
            >
              <FaUsers className="nav-icon" />
              <NavLink to="/nosotros" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Nosotros</NavLink>
              <ul
                className={`dropdown-menu ${hoveredDropdown === 'nosotros' ? 'show' : ''}`}
                onMouseEnter={() => handleMouseEnter('nosotros')}
                onMouseLeave={() => handleMouseLeave('nosotros')}
              >
                <li><NavLink to="/nosotros" className="dropdown-link">Sobre Nosotros</NavLink></li>
                <li><a href="#equipo" className="dropdown-link">Equipo</a></li>
              </ul>
            </li>
            <li
              className="nav-module nav-dropdown"
              onMouseEnter={() => handleMouseEnter('productos')}
              onMouseLeave={() => handleMouseLeave('productos')}
            >
              <FaBoxOpen className="nav-icon" />
              <NavLink to="/productos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Productos</NavLink>
              <ul
                className={`dropdown-menu ${hoveredDropdown === 'productos' ? 'show' : ''}`}
                onMouseEnter={() => handleMouseEnter('productos')}
                onMouseLeave={() => handleMouseLeave('productos')}
              >
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