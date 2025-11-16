import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/Card';
import { Building2, Users, Calendar, Package, DollarSign } from 'lucide-react';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudios: 0,
    pendingStudios: 0,
    approvedStudios: 0,
    totalUsers: 0,
    totalBookings: 0,
    totalEquipment: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [
        studiosRes,
        pendingRes,
        approvedRes,
        usersRes,
        bookingsRes,
        equipmentRes,
        revenueRes
      ] = await Promise.all([
        supabase.from('studios').select('id', { count: 'exact' }),
        supabase.from('studios').select('id', { count: 'exact' }).eq('verification_status', 'pending'),
        supabase.from('studios').select('id', { count: 'exact' }).eq('verification_status', 'approved'),
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('bookings').select('id', { count: 'exact' }),
        supabase.from('equipment').select('id', { count: 'exact' }),
        supabase.from('bookings').select('total_price').eq('payment_status', 'paid')
      ]);

      const revenue = revenueRes.data?.reduce((sum, b) => sum + b.total_price, 0) || 0;

      setStats({
        totalStudios: studiosRes.count || 0,
        pendingStudios: pendingRes.count || 0,
        approvedStudios: approvedRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalBookings: bookingsRes.count || 0,
        totalEquipment: equipmentRes.count || 0,
        totalRevenue: revenue,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">پنل مدیریت</h1>
        <p className="text-gray-600">خوش آمدید به پنل مدیریت استودیو رزرو</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="text-blue-600" size={24} />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.totalStudios}</span>
            </div>
            <p className="text-gray-600">کل استودیوها</p>
            <p className="text-sm text-yellow-600 mt-1">
              {stats.pendingStudios} در انتظار تایید
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="text-green-600" size={24} />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.totalUsers}</span>
            </div>
            <p className="text-gray-600">کل کاربران</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="text-purple-600" size={24} />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.totalBookings}</span>
            </div>
            <p className="text-gray-600">کل رزروها</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Package className="text-yellow-600" size={24} />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.totalEquipment}</span>
            </div>
            <p className="text-gray-600">کل تجهیزات</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                درآمد کل پلتفرم
              </h2>
              <p className="text-3xl font-bold text-green-600">
                {stats.totalRevenue.toLocaleString('fa-IR')} تومان
              </p>
            </div>
            <div className="p-4 bg-green-100 rounded-full">
              <DollarSign className="text-green-600" size={32} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              وضعیت استودیوها
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">تایید شده</span>
                <span className="font-semibold text-green-600">
                  {stats.approvedStudios}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">در انتظار تایید</span>
                <span className="font-semibold text-yellow-600">
                  {stats.pendingStudios}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">رد شده</span>
                <span className="font-semibold text-red-600">
                  {stats.totalStudios - stats.approvedStudios - stats.pendingStudios}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              آمار سریع
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">میانگین قیمت رزرو</span>
                <span className="font-semibold text-blue-600">
                  {stats.totalBookings > 0
                    ? (stats.totalRevenue / stats.totalBookings).toLocaleString('fa-IR', { maximumFractionDigits: 0 })
                    : 0} تومان
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">استودیو به ازای کاربر</span>
                <span className="font-semibold text-blue-600">
                  {stats.totalUsers > 0
                    ? (stats.totalStudios / stats.totalUsers).toFixed(2)
                    : 0}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
