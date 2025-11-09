import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Spin, Button, Card, Typography } from "antd";
import { useAuth } from "../hooks/useAuth";

const { Title, Text } = Typography;

const InitialRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          gap: "16px",
        }}
      >
        <Spin size="large" />
        <span style={{ color: "#666" }}>Preparando tu experiencia...</span>
      </div>
    );
  }

  // Si no hay usuario, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si hay usuario, mostrar página de bienvenida con opciones
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <Card
        style={{
          maxWidth: 500,
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        <Title level={2} style={{ color: "#1890ff", marginBottom: 8 }}>
          ¡Bienvenido de vuelta!
        </Title>
        <Text style={{ fontSize: "16px", marginBottom: 24, display: "block" }}>
          ¿Qué te gustaría hacer hoy?
        </Text>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Button
            type="primary"
            size="large"
            block
            onClick={() => navigate("/dashboard")}
            style={{ height: "48px", fontSize: "16px" }}
          >
            Ir al Panel de Administración
          </Button>

          <Button
            size="large"
            block
            onClick={() => navigate("/home")}
            style={{
              height: "48px",
              fontSize: "16px",
              border: "2px solid #1890ff",
              color: "#1890ff"
            }}
          >
            Explorar el Sitio Web
          </Button>
        </div>

        <Text style={{ fontSize: "14px", color: "#666", marginTop: 16, display: "block" }}>
          Sesión iniciada como: <strong>{user.email}</strong>
        </Text>
      </Card>
    </div>
  );
};

export default InitialRedirect;
