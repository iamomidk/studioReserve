import { useState, useEffect } from 'react';
import { supabase, Booking } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/Card';
import { Calendar, Clock, DollarSign } from 'lucide-react';

export function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          rooms!inner(
            name,
            studios!inner(name)
          )
        `)
        .eq('photographer_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted': return 'تایید شده';
      case 'pending': return 'در انتظار تایید';
      case 'rejected': return 'رد شده';
      case 'completed': return 'تکمیل شده';
      case 'cancelled': return 'لغو شده';
      default: return status;
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">رزروهای من</h1>
        <p className="text-gray-600">مشاهده و مدیریت رزروهای خود</p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">هنوز رزروی ثبت نشده است</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {booking.rooms.studios.name}
                    </h3>
                    <p className="text-gray-600">{booking.rooms.name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.booking_status)}`}>
                    {getStatusLabel(booking.booking_status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar size={18} />
                    <span className="text-sm">
                      {new Date(booking.start_time).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock size={18} />
                    <span className="text-sm">
                      {new Date(booking.start_time).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.end_time).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <DollarSign size={18} />
                    <span className="text-sm font-medium">
                      {booking.total_price.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                </div>

                {booking.equipment_ids.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      تعداد تجهیزات: {booking.equipment_ids.length}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
