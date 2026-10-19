import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import BrowseItems from './pages/BrowseItems';
import ReportLost from './pages/ReportLost';
import ReportFound from './pages/ReportFound';
import SmartMatching from './pages/SmartMatching';
import MyCases from './pages/MyCases';
import Notifications from './pages/Notifications';
import AdminPanel from './pages/AdminPanel';
import ItemDetail from './pages/ItemDetail';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a2847',
            color: '#fff',
            borderRadius: '0.75rem',
          },
        }}
      />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="browse" element={<BrowseItems />} />
          <Route path="report-lost" element={<ReportLost />} />
          <Route path="report-found" element={<ReportFound />} />
          <Route path="matching" element={<SmartMatching />} />
          <Route path="my-cases" element={<MyCases />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="admin" element={<AdminPanel />} />
          <Route path="item/:itemId" element={<ItemDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}
