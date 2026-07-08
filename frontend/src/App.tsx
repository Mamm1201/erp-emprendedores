import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';
import ForbiddenPage from '@/pages/ForbiddenPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ClientsPage } from '@/pages/ClientsPage';
import { WorkOrdersPage } from '@/pages/WorkOrdersPage';
import { WorkOrderDetailPage } from '@/pages/WorkOrderDetailPage';
import { MaintenancePlansPage } from '@/pages/MaintenancePlansPage';
import { EquipmentPage } from '@/pages/EquipmentPage';
import { ServiceRecordsPage } from '@/pages/ServiceRecordsPage';
import { QuotationsPage } from '@/pages/QuotationsPage';
import { QuotationFormPage } from '@/pages/QuotationFormPage';
import { InvoicesPage } from '@/pages/InvoicesPage';
import { InvoiceCreatePage } from '@/pages/InvoiceCreatePage';
import { InvoiceDetailPage } from '@/pages/InvoiceDetailPage';
import { PaymentsPage } from '@/pages/PaymentsPage';
import { EstadoCuentasPage } from '@/pages/EstadoCuentasPage';
import UsersPage from '@/pages/UsersPage';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'clientes', element: <ClientsPage /> },
          { path: 'cotizaciones', element: <QuotationsPage /> },
          { path: 'cotizaciones/nueva', element: <QuotationFormPage /> },
          { path: 'cotizaciones/:id', element: <QuotationFormPage /> },
          { path: 'estado-cuentas', element: <EstadoCuentasPage /> },
          { path: 'cuentas-cobro', element: <InvoicesPage /> },
          { path: 'cuentas-cobro/nueva', element: <InvoiceCreatePage /> },
          { path: 'cuentas-cobro/:id', element: <InvoiceDetailPage /> },
          { path: 'pagos', element: <PaymentsPage /> },
          { path: 'ordenes', element: <WorkOrdersPage /> },
          { path: 'ordenes/:id', element: <WorkOrderDetailPage /> },
          { path: 'actas', element: <ServiceRecordsPage /> },
          { path: 'planes', element: <MaintenancePlansPage /> },
          { path: 'equipos', element: <EquipmentPage /> },
          { path: '403', element: <ForbiddenPage /> },
          {
            element: <RoleProtectedRoute allowedRoles={['ADMIN']} />,
            children: [
              { path: 'usuarios', element: <UsersPage /> },
            ],
          },
        ],
      },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
