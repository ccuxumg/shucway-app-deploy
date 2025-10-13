import './Footer.css';
import { FaClock } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="contact-footer footer">
      <div className="footer-content">
        <div className="footer-logo-block">
          <img src="/img/logo.png" alt="Shucway Logo" className="footer-logo" />
          <div className="footer-hours">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <FaClock style={{ color: 'white' }} />
              <span style={{ fontWeight: '600' }}>Horarios de Atención</span>
            </div>
            <div>Miércoles - Sábado: 16:00 - 22:00</div>
            <div style={{ opacity: '0.8', fontSize: '1rem' }}>Cerrado los demás días</div>
          </div>
          <div className="footer-section">
            <h4>Enlaces</h4>
            <ul>
              <li><a href="/">Inicio</a></li>
              <li><a href="/nosotros">Nosotros</a></li>
              <li><a href="/productos">Productos</a></li>
              <li><a href="/contacto">Contacto</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Contacto</h4>
            <p>📧 info@shucway.com</p>
            <p>📱 +1 (555) 123-4567</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Shucway. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;