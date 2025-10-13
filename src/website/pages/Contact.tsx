// ...existing code...
import './Contact.css';
import { useEffect } from 'react';

const Contact = () => {
  useEffect(() => {
    const main = document.querySelector('.main-content') as HTMLElement | null;
    if (main) {
      const prev = main.style.flex;
      main.style.flex = '0';
      return () => {
        main.style.flex = prev || '';
      };
    }
    return () => {};
  }, []);
  return (
    <div className="contact-page">
      <div className="contact-main">
        <div className="contact-form-section">
          <h2 className="contact-title">CONTACTANOS</h2>
          <p className="contact-subtitle">Completa la siguiente información, para que podamos atenderte con gusto</p>
          <form className="contact-form-custom">
            <input type="text" placeholder="Nombre Completo *" required />
            <input type="email" placeholder="Correo *" required />
            <input type="text" placeholder="Asunto *" required />
            <button type="submit" className="contact-btn">Deja un mensaje <span>&rarr;</span></button>
          </form>
        </div>
        <div className="contact-info-section">
          <div className="contact-info-block">
            <div>
              <span className="contact-label">Correo Electronico</span>
              <p className="contact-value">shucway@gmail.com</p>
            </div>
            <div>
              <span className="contact-label">Numero</span>
              <p className="contact-value">(+502) 56252922</p>
            </div>
            <div>
              <span className="contact-label">Horario</span>
              <p className="contact-value">Miércoles - Sábado<br/>16:00 - 22:00</p>
            </div>
          </div>
          <div className="contact-map">
            <iframe
              title="Ubicación Shucway"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3876.857964073812!2d-90.51327!3d14.634915!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8589a1e7e7e7e7e7%3A0x123456789abcdef!2sShucway!5e0!3m2!1ses-419!2sgt!4v1690000000000!5m2!1ses-419!2sgt"
              width="100%"
              height="180"
              style={{ border: 0, borderRadius: '12px' }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>

      <div className="contact-whatsapp-section">
        <div className="whatsapp-icon">
          <img src="/image/other/wsp.png" alt="WhatsApp" className="contact-whatsapp-img" />
        </div>
        <span className="whatsapp-text">CONTACTANOS MEDIANTE WHATSAPP</span>
        <a 
          href="https://chat.whatsapp.com/CtumosmGlDO7Rvx1OUB66n?mode=ems_copy_h_c" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <button className="whatsapp-btn">INGRESA AQUÍ</button>
        </a>
      </div>


  {/* Footer moved to global Footer component */}
    </div>
  );
};

export default Contact;
