import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './pages/Auth';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { StudioList } from './pages/photographer/StudioList';
import { StudioDetail } from './pages/photographer/StudioDetail';
import { BookingFlow } from './pages/photographer/BookingFlow';
import { MyBookings } from './pages/photographer/MyBookings';

import { StudioDashboard } from './pages/studio/Dashboard';
import { StudioManagement } from './pages/studio/StudioManagement';
import { RoomManagement } from './pages/studio/RoomManagement';
import { EquipmentManagement } from './pages/studio/EquipmentManagement';
import { BarcodeScanner } from './pages/studio/BarcodeScanner';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StudioApprovals } from './pages/admin/StudioApprovals';

import { Profile } from './pages/shared/Profile';
import { Notifications } from './pages/shared/Notifications';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('');
  const [selectedStudioId, setSelectedStudioId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const getDefaultPage = () => {
    if (user.role === 'photographer') return 'studios';
    if (user.role === 'studio_owner') return 'dashboard';
    if (user.role === 'admin') return 'admin-dashboard';
    return 'studios';
  };

  const activePage = currentPage || getDefaultPage();

  const renderPage = () => {
    switch (activePage) {
      case 'studios':
        return (
          <ProtectedRoute allowedRoles={['photographer', 'studio_owner']}>
            <StudioList onSelectStudio={(id) => {
              setSelectedStudioId(id);
              setCurrentPage('studio-detail');
            }} />
          </ProtectedRoute>
        );

      case 'studio-detail':
        return selectedStudioId ? (
          <ProtectedRoute allowedRoles={['photographer', 'studio_owner']}>
            <StudioDetail
              studioId={selectedStudioId}
              onBack={() => {
                setSelectedStudioId(null);
                setCurrentPage('studios');
              }}
              onBookRoom={(roomId) => {
                setSelectedRoomId(roomId);
                setCurrentPage('booking');
              }}
            />
          </ProtectedRoute>
        ) : null;

      case 'booking':
        return selectedRoomId ? (
          <ProtectedRoute allowedRoles={['photographer', 'studio_owner']}>
            <BookingFlow
              roomId={selectedRoomId}
              onBack={() => {
                setSelectedRoomId(null);
                setCurrentPage('studio-detail');
              }}
              onSuccess={() => {
                setSelectedRoomId(null);
                setSelectedStudioId(null);
                setCurrentPage('my-bookings');
              }}
            />
          </ProtectedRoute>
        ) : null;

      case 'my-bookings':
        return (
          <ProtectedRoute allowedRoles={['photographer', 'studio_owner']}>
            <MyBookings />
          </ProtectedRoute>
        );

      case 'dashboard':
        return (
          <ProtectedRoute allowedRoles={['studio_owner']}>
            <StudioDashboard />
          </ProtectedRoute>
        );

      case 'studios-management':
        return (
          <ProtectedRoute allowedRoles={['studio_owner']}>
            <StudioManagement />
          </ProtectedRoute>
        );

      case 'rooms':
        return (
          <ProtectedRoute allowedRoles={['studio_owner']}>
            <RoomManagement />
          </ProtectedRoute>
        );

      case 'equipment':
        return (
          <ProtectedRoute allowedRoles={['studio_owner']}>
            <EquipmentManagement />
          </ProtectedRoute>
        );

      case 'bookings':
        return (
          <ProtectedRoute allowedRoles={['studio_owner']}>
            <MyBookings />
          </ProtectedRoute>
        );

      case 'barcode-scanner':
        return (
          <ProtectedRoute allowedRoles={['studio_owner']}>
            <BarcodeScanner />
          </ProtectedRoute>
        );

      case 'finance':
        return (
          <ProtectedRoute allowedRoles={['studio_owner']}>
            <div className="text-center py-12">
              <p className="text-gray-600">صفحه مالی در حال توسعه است</p>
            </div>
          </ProtectedRoute>
        );

      case 'admin-dashboard':
        return (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        );

      case 'admin-approvals':
        return (
          <ProtectedRoute allowedRoles={['admin']}>
            <StudioApprovals />
          </ProtectedRoute>
        );

      case 'admin-bookings':
      case 'admin-equipment':
      case 'admin-finance':
      case 'admin-users':
        return (
          <ProtectedRoute allowedRoles={['admin']}>
            <div className="text-center py-12">
              <p className="text-gray-600">این صفحه در حال توسعه است</p>
            </div>
          </ProtectedRoute>
        );

      case 'notifications':
        return <Notifications />;

      case 'profile':
        return <Profile />;

      default:
        return <div>صفحه یافت نشد</div>;
    }
  };

  return (
    <Layout currentPage={activePage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
