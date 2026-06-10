import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { ClientsPage } from '@/pages/ClientsPage';
import { WorkOrdersPage } from '@/pages/WorkOrdersPage';
import { MaintenancePlansPage } from '@/pages/MaintenancePlansPage';
import { EquipmentPage } from '@/pages/EquipmentPage';
import { ServiceRecordsPage } from '@/pages/ServiceRecordsPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'clientes', element: <ClientsPage /> },
      { path: 'ordenes', element: <WorkOrdersPage /> },
      { path: 'actas', element: <ServiceRecordsPage /> },
      { path: 'planes', element: <MaintenancePlansPage /> },
      { path: 'equipos', element: <EquipmentPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
