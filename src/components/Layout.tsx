import { ReactNode, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Home, Building2, Package, Calendar, Bell, User,
  LogOut, Menu, X, Settings, BarChart3, Users, CheckSquare, DoorOpen
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const photographerNav = [
    { name: 'استودیوها', icon: Building2, page: 'studios' },
    { name: 'رزروهای من', icon: Calendar, page: 'my-bookings' },
    { name: 'اعلان‌ها', icon: Bell, page: 'notifications' },
    { name: 'پروفایل', icon: User, page: 'profile' },
  ];

  const studioOwnerNav = [
    { name: 'داشبورد', icon: Home, page: 'dashboard' },
    { name: 'استودیوها', icon: Building2, page: 'studios-management' },
    { name: 'اتاق‌ها', icon: DoorOpen, page: 'rooms' },
    { name: 'تجهیزات', icon: Package, page: 'equipment' },
    { name: 'رزروها', icon: Calendar, page: 'bookings' },
    { name: 'بارکد', icon: CheckSquare, page: 'barcode-scanner' },
    { name: 'مالی', icon: BarChart3, page: 'finance' },
    { name: 'اعلان‌ها', icon: Bell, page: 'notifications' },
    { name: 'پروفایل', icon: User, page: 'profile' },
  ];

  const adminNav = [
    { name: 'داشبورد', icon: Home, page: 'admin-dashboard' },
    { name: 'تایید استودیوها', icon: CheckSquare, page: 'admin-approvals' },
    { name: 'رزروها', icon: Calendar, page: 'admin-bookings' },
    { name: 'گزارشات تجهیزات', icon: Package, page: 'admin-equipment' },
    { name: 'مالی', icon: BarChart3, page: 'admin-finance' },
    { name: 'کاربران', icon: Users, page: 'admin-users' },
  ];

  const getNavItems = () => {
    if (user?.role === 'photographer') return photographerNav;
    if (user?.role === 'studio_owner') return studioOwnerNav;
    if (user?.role === 'admin') return adminNav;
    return [];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <nav className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 className="text-2xl font-bold text-blue-600">استودیو رزرو</h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.name}</span>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut size={18} />
                خروج
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        <aside
          className={`fixed top-16 right-0 bottom-0 w-64 bg-white border-l transform transition-transform duration-200 ease-in-out z-20 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.page}
                  onClick={() => {
                    onNavigate(item.page);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    currentPage === item.page
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 lg:mr-64">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
