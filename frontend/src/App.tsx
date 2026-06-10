import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'clientes', element: <PlaceholderPage title="Clientes" /> },
      { path: 'ordenes', element: <PlaceholderPage title="Órdenes de trabajo" /> },
      { path: 'planes', element: <PlaceholderPage title="Planes de mantenimiento" /> },
      { path: 'equipos', element: <PlaceholderPage title="Equipos" /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
