import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Building2, Calendar, Package, DollarSign } from 'lucide-react';

interface DashboardStats {
  studios: number;
  rooms: number;
  equipment: number;
  bookings: number;
  revenue: number;
}

export function StudioDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    studios: 0,
    rooms: 0,
    equipment: 0,
    bookings: 0,
    revenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [studiosRes, roomsRes, equipmentRes, bookingsRes] = await Promise.all([
        supabase.from('studios').select('id', { count: 'exact' }).eq('owner_id', user!.id),
        supabase.from('rooms').select('id', { count: 'exact' }).eq('studio_id', (await supabase.from('studios').select('id').eq('owner_id', user!.id)).data?.map(s => s.id) || []),
        supabase.from('equipment').select('id', { count: 'exact' }).eq('studio_id', (await supabase.from('studios').select('id').eq('owner_id', user!.id)).data?.map(s => s.id) || []),
        supabase
          .from('bookings')
          .select(`*, rooms!inner(*, studios!inner(*))`)
          .eq('rooms.studios.owner_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const studios = await supabase.from('studios').select('id').eq('owner_id', user!.id);
      const studioIds = studios.data?.map(s => s.id) || [];

      let totalRooms = 0;
      let totalEquipment = 0;
      for (const studioId of studioIds) {
        const rooms = await supabase.from('rooms').select('id', { count: 'exact' }).eq('studio_id', studioId);
        const equipment = await supabase.from('equipment').select('id', { count: 'exact' }).eq('studio_id', studioId);
        totalRooms += rooms.count || 0;
        totalEquipment += equipment.count || 0;
      }

      const revenue = bookingsRes.data?.reduce((sum, b) => sum + (b.payment_status === 'paid' ? b.total_price : 0), 0) || 0;

      setStats({
        studios: studiosRes.count || 0,
        rooms: totalRooms,
        equipment: totalEquipment,
        bookings: bookingsRes.count || 0,
        revenue,
      });

      setRecentBookings(bookingsRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">داشبورد مدیریت</h1>
        <p className="text-gray-600">خوش آمدید، {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="text-blue-600" size={24} />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.studios}</span>
            </div>
            <p className="text-gray-600">استودیوها</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Building2 className="text-green-600" size={24} />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.rooms}</span>
            </div>
            <p className="text-gray-600">اتاق‌ها</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="text-purple-600" size={24} />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.equipment}</span>
            </div>
            <p className="text-gray-600">تجهیزات</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Calendar className="text-yellow-600" size={24} />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.bookings}</span>
            </div>
            <p className="text-gray-600">رزروها</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">درآمد کل</h2>
            <DollarSign className="text-green-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-green-600">
            {stats.revenue.toLocaleString('fa-IR')} تومان
          </p>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">آخرین رزروها</h2>
          {recentBookings.length === 0 ? (
            <p className="text-gray-600 text-center py-8">رزروی موجود نیست</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{booking.rooms.name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.start_time).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    booking.booking_status === 'accepted' ? 'bg-green-100 text-green-800' :
                    booking.booking_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.booking_status === 'accepted' ? 'تایید شده' :
                     booking.booking_status === 'pending' ? 'در انتظار' :
                     booking.booking_status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
