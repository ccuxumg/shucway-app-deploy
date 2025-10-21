import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dayjs from "dayjs";
import "dayjs/locale/es";
import updateLocale from "dayjs/plugin/updateLocale";

// Configurar dayjs para Antd
dayjs.extend(updateLocale);
dayjs.updateLocale("es", {
  weekStart: 1,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos - los datos se consideran frescos por 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos - mantener en cache por 10 minutos
      refetchOnWindowFocus: false, // Deshabilitar refetch automático al cambiar de ventana
      refetchOnReconnect: true, // Solo refetch al reconectar
      retry: 1, // Reintentar solo una vez en caso de error
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
