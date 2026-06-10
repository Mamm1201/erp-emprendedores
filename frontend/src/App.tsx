import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { ClientsPage } from '@/pages/ClientsPage';
import { WorkOrdersPage } from '@/pages/WorkOrdersPage';
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

const router = createBrowserRouter([
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
      { path: 'actas', element: <ServiceRecordsPage /> },
      { path: 'planes', element: <MaintenancePlansPage /> },
      { path: 'equipos', element: <EquipmentPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
