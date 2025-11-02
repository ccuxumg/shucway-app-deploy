import { useEffect, useState } from 'react';
import { FaClock, FaTruck, FaCreditCard, FaUserFriends, FaMapMarkerAlt } from 'react-icons/fa';
import './Home.css';

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "BIENVENIDOS A SHUCWAY",
      subtitle: "Los mejores shucos y hamburguesas de Guatemala",
      image: "/image/fotos-local/local.jpg",
      colors: {
        background: '#346C60',
        primary: '#FFD40D',
        secondary: '#0AA06E'
      }
    },
    {
      title: "SABOR AUTÉNTICO",
      subtitle: "Tradición y calidad en cada bocado",
      image: "/image/fotos-local/shucos.png",
      colors: {
        background: '#0AA06E',
        primary: '#FFD40D',
        secondary: '#346C60'
      }
    },
    {
      title: "EXPERIENCIA ÚNICA",
      subtitle: "Un ambiente acogedor para toda la familia",
      image: "/image/fotos-local/menu.jpg",
      colors: {
        background: '#00A149',
        primary: '#346C60',
        secondary: '#FFD40D'
      }
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const features = [
    {
      icon: <FaClock />,
      title: "Alta Apertura",
      description: "Desde 2020"
    },
    {
      icon: <FaTruck />,
      title: "Despacho Rápido",
      description: "Entrega en el menor tiempo posible"
    },
    {
      icon: <FaCreditCard />,
      title: "Pago Seguro",
      description: "Aceptamos todas las tarjetas y pagos digitales"
    },
    {
      icon: <FaUserFriends />,
      title: "Atención Personalizada",
      description: "Siempre cercanos a nuestros clientes"
    }
  ];

  const foodImages = [
    "/image/shucos/mixto.jpeg",
    "/image/hamburguesas/bacon.jpg",
    "/image/shucos/chorizo.jpg",
    "/image/hamburguesas/double_cheese.webp",
    "/image/shucos/salchicha.jpg",
    "/image/papas/salchipapas.jpg"
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-carousel">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
              style={{
                backgroundImage: `url(${slide.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: slide.colors.background,
                backgroundBlendMode: 'soft-light'
              }}
            >
              <div className="hero-content">
                <h1 className="hero-title">{slide.title}</h1>
                <p className="hero-subtitle">{slide.subtitle}</p>
                <div className="hero-buttons">
                  <a
                    href="/productos"
                    className="btn btn-primary"
                    style={{
                      backgroundColor: slide.colors.primary,
                      color: index === 1 ? '#346C60' : 'white'
                    }}
                  >
                    Ver Menú
                  </a>
                  <a
                    href="/contacto"
                    className="btn btn-secondary"
                    style={{
                      backgroundColor: slide.colors.secondary,
                      color: 'white'
                    }}
                  >
                    Contáctanos
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Vision Section */}
      <section className="mission-vision">
        <div className="mission">
          <div className="container">
            <h2>CONOCENOS</h2>
          </div>
        </div>
        <div className="vision">
          <div className="container">
            <h2>MEJOR</h2>
          </div>
        </div>
        <a href="/nosotros" className="mission-vision-button">Mira nuestra historia</a>
      </section>

      {/* Featured Food Section */}
      <section className="featured-food">
        <div className="food-carousel">
          {[...foodImages, ...foodImages].map((image, index) => (
            <div key={index} className="food-item">
              <img src={image} alt="Platillo destacado" />
            </div>
          ))}
        </div>
      </section>

      {/* Visit Section */}
      
      <section className="visit-section" style={{ lineHeight: 0, fontSize: 0 }}>
        <a
          href="https://maps.app.goo.gl/s5bHJLDKRp4qvboB6"
          target="_blank"
          rel="noopener noreferrer"
          className="visit-map-link"
        >
          <img
            src="/image/other/location-static-map.png"
            alt="Ubicación Shucway"
            className="visit-map-img"
          />
          <div className="map-overlay"></div>
          <div className="visit-content">
            <FaMapMarkerAlt className="location-icon" />
            <h2 style={{ fontSize: '24px', margin: '0 0 10px' }}>Encuéntranos Aquí</h2>
            <p style={{ fontSize: '16px', margin: 0 }}>
              Local 8, CC Naciones Unidas 2, Villa Nueva
            </p>
            <p style={{ fontSize: '12px', margin: 0 }}>
              Clic para ver en el mapa
            </p>
          </div>
        </a>
      </section>

    </div>
  );
};

export default Home;
