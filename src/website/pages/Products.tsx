import { useState, useEffect } from 'react';
import './Products.css';
import { FaClock } from 'react-icons/fa';

const heroSlides = [
  {
    title: "PRUEBA NUESTRA",
    subtitle: "DELICIOSA COMIDA",
    desc: "Escoge entre la variedad de los platillos y haz tu selección YA MISMO",
    image: "/image/comida-png/shuco.png"
  },
  {
    title: "SIENTE EL",
    subtitle: "SABOR ÚNICO",
    desc: "Los mejores ingredientes para la mejor experiencia",
    image: "/image/comida-png/hamburger.png"
  },
  {
    title: "DISFRUTA",
    subtitle: "CADA MOMENTO",
    desc: "Un acompañamiento perfecto para cada ocasión",
    image: "/image/comida-png/papas.png"
  }
];

const menuItems = [
  { name: 'Shucos', img: '/image/shucos/salami.jpeg', desc: 'Variedad de clásicos' },
  { name: 'Hamburger', img: '/image/hamburguesas/bacon.jpg', desc: 'Muchos tipos' },
  { name: 'Gringa', img: '/image/gringa/adobada.jpeg', desc: 'Delicias estilo gringa' },
  { name: 'Salchipapas', img: '/image/papas/salchipapas.jpg', desc: 'Sabor único' },
  { name: 'Papas Fritas', img: '/image/papas/french_fries.jpg', desc: 'Acompañamiento dorado, hecho en el local' },
];

const destacados = [
  { name: 'Shuco de Salchicha', img: '/image/shucos/salchicha.jpg', price: 'Q12.00' },
  { name: 'Torito', img: '/image/hamburguesas/torito.jpeg', price: 'Q21.00' },
  { name: 'French Fries', img: '/image/papas/french_fries.jpg', price: 'Q9.00' },
  { name: 'Shuco de Longaniza', img: '/image/shucos/longaniza.jpeg', price: 'Q13.00' },
];

const ingredientes = [
  { name: 'Salchicha', img: '/image/ingredientes/salchicha.png' },
  { name: 'Chorizo', img: '/image/ingredientes/chorizo.png' },
  { name: 'Pollo', img: '/image/ingredientes/pollo.png' },
  { name: 'Ketchup', img: '/image/acompañante/salsa-de-tomate.png' },
  { name: 'Repollo', img: '/image/ingredientes/repollo.png' },
  { name: 'Mostaza', img: '/image/acompañante/mostaza.png' },
];

const galeria = [
  '/image/fotos-local/local.jpg',
  '/image/fotos-local/menu.jpg',
  '/image/fotos-local/dani-2.jpg',
  '/image/fotos-local/dani-3.jpg',
];

const Products = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState(604800); // 7 días en segundos

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 604800));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <div className="products">
      {/* Hero Section */}
      <section className="products-intro">
        <div className="product-hero" data-slide={currentSlide}>
          <div className="product-content">
            <h1>
              {heroSlides[currentSlide].title} <br />
              <span>{heroSlides[currentSlide].subtitle}</span>
            </h1>
            <p>{heroSlides[currentSlide].desc}</p>
          </div>
          <div className="product-image">
            <img src={heroSlides[currentSlide].image} alt="Producto destacado" />
          </div>
        </div>
      </section>

      {/* Menú visual */}
      <section className="products-menu-section animate-fade-in-delay">
        <div className="products-menu-bg"></div>
        <div className="products-menu-list">
          <div className="products-menu-title">Nuestro Menú</div>
          <div className="products-menu-items">
            {menuItems.map((item) => (
              <div className="products-menu-item animate-slide-up" key={item.name}>
                <img src={item.img} alt={item.name} />
                <div className="products-menu-item-title">{item.name}</div>
                <div className="products-menu-item-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mensaje del Chef */}
      <section className="products-chef-section animate-fade-in">
        <div className="products-chef-img animate-slide-left">
          <img src="/image/other/chef.webp" alt="Chef" />
        </div>
        <div className="products-chef-msg animate-slide-right">
          <div className="products-chef-title">Mensaje del Chef</div>
          <blockquote>"La comida no es solo alimentación, es una experiencia que conecta personas y crea momentos inolvidables."</blockquote>
        </div>
      </section>

      {/* Productos más vendidos */}
      <section className="products-destacados-section animate-fade-in-delay">
        <h2>Productos más Vendidos</h2>
        <div className="products-counter">
          <FaClock /> Tiempo restante: {formatTime(timeLeft)}
        </div>
        <div className="products-destacados-grid">
          {destacados.map((prod) => (
            <div className="products-destacado-card animate-zoom-in" key={prod.name}>
              <img src={prod.img} alt={prod.name} />
              <div className="products-destacado-info">
                <div className="products-destacado-title">{prod.name}</div>
                <div className="products-destacado-price">{prod.price}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ingredientes frecuentes */}
      <section className="products-ingredientes-section animate-fade-in">
        <h2>Ingredientes Frecuentes</h2>
        <div className="products-ingredientes-grid">
          {ingredientes.map((ing) => (
            <div className="products-ingrediente-card animate-slide-up" key={ing.name}>
              <img src={ing.img} alt={ing.name} />
              <div className="products-ingrediente-title">{ing.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Galería */}
      <section className="products-galeria-section animate-fade-in-delay">
        <div className="products-galeria-grid">
          {galeria.map((img, i) => (
            <img 
              src={img} 
              alt={`Galería ${i+1}`} 
              className="products-galeria-img animate-zoom-in" 
              key={img} 
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Products;
