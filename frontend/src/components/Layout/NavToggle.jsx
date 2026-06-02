import React from 'react';
import '../../estilos/components/NavToggle.css';

class NavToggle extends React.Component {
  render() {
    const { isOpen, onToggle, className = '' } = this.props;

    return (
      <button
        type="button"
        className={`nav-toggle ${className} ${isOpen ? 'open' : ''}`.trim()}
        onClick={onToggle}
        aria-label={isOpen ? 'Cerrar navegación' : 'Abrir navegación'}
      >
        {isOpen ? '✕' : '☰'}
      </button>
    );
  }
}

export default NavToggle;
