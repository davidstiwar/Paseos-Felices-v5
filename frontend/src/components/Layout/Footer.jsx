import React from 'react';
import '../../estilos/Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="footer-content">
      <div>© {new Date().getFullYear()} Paseos Felices. Cuidamos con el corazón.</div>
      <div className="footer-links">
        <button type="button" className="footer-link-btn">Privacidad</button>
        <button type="button" className="footer-link-btn">Términos</button>
        <button type="button" className="footer-link-btn">Contacto</button>
      </div>
    </div>
  </footer>
);

export default Footer;
