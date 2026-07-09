import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EquipmentPage } from './pages/EquipmentPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/e/:qrCode" element={<EquipmentPage />} />
        <Route path="/" element={<Navigate to="/e/invalid" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
