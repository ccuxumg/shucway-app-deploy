import React, { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
const Dashboard = React.lazy(() => import("../views/Dashboard"));
const Login = React.lazy(() => import("../views/Login"));
const Usuarios = React.lazy(() => import("../features/Dashboard/Administracion"));
const Configuracion = React.lazy(() => import("../features/Dashboard/Configuracion/Configuracion"));
const Mantenimiento = React.lazy(() => import("../features/Dashboard/Configuracion/Mantenimiento"));
const ConsultasSQL = React.lazy(() => import("../features/Dashboard/Configuracion/ConsultasSQL"));
const Backup = React.lazy(() => import("../features/Dashboard/Configuracion/Backup"));
const Ventas = React.lazy(() => import("../features/Dashboard/Ventas"));
const Inventario = React.lazy(() => import("../features/Dashboard/Inventario"));
const Reportes = React.lazy(() => import("../features/Dashboard/Reportes"));
const Perfil = React.lazy(() => import("../features/Dashboard/Perfil"));
import AuthGuard from "../guards/AuthGuard";
import GuestGuard from "../guards/GuestGuard";
import DashboardLayout from "../layouts/DashboardLayout";
const Website = React.lazy(() => import("../website/Website"));
import { IRoute } from "../types";

// Rutas del dashboard administrativo
const protectedRoutes: IRoute[] = [
  {
    path: "/dashboard",
    element: Dashboard,
    guard: AuthGuard,
    layout: DashboardLayout,
  },
  {
    path: "/configuracion",
    element: Configuracion,
    guard: AuthGuard,
    layout: DashboardLayout,
  },
  {
    path: "/configuracion/mantenimiento",
    element: Mantenimiento,
    guard: AuthGuard,
    layout: DashboardLayout,
  },
  {
    path: "/configuracion/consultas-sql",
    element: ConsultasSQL,
    guard: AuthGuard,
    layout: DashboardLayout,
  },
  {
    path: "/configuracion/backup",
    element: Backup,
    guard: AuthGuard,
    layout: DashboardLayout,
  },
  {
    path: "/administracion",
    element: Usuarios,
    guard: AuthGuard,
    layout: DashboardLayout,
  },
  {
    path: "/ventas",
    element: Ventas,
    guard: AuthGuard,
    layout: DashboardLayout,
  },
  {
    path: "/inventario",
    element: Inventario,
    guard: AuthGuard,
    layout: DashboardLayout,
  },
  {
    path: "/reportes",
    element: Reportes,
    guard: AuthGuard,
    layout: DashboardLayout,
  },
  {
    path: "/perfil",
    element: Perfil,
    guard: AuthGuard,
    layout: DashboardLayout,
  },
];

// Rutas públicas
const publicRoutes: IRoute[] = [
  {
    path: "/login",
    element: Login,
    guard: GuestGuard,
  },
  {
    path: "/*",
    element: Website,
  },
];

export const routes: IRoute[] = [
  ...protectedRoutes,
  ...publicRoutes,
];

export const renderRoutes = (routes: IRoute[]) => {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
      <Routes>
        {routes?.map((route: IRoute, index: number) => {
          const Component = route.element as React.ComponentType<unknown>;
          const Guard = route.guard || React.Fragment;
          const Layout = route.layout || React.Fragment;

          return (
            <Route
              key={index}
              path={route.path}
              element={
                <Guard>
                  <Layout>
                    <Component />
                  </Layout>
                </Guard>
              }
            />
          );
        })}
      </Routes>
    </Suspense>
  );
};