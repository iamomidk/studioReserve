import { useState, useEffect } from 'react';
import { supabase, Room, Equipment } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ArrowRight, Calendar, Clock } from 'lucide-react';

interface BookingFlowProps {
  roomId: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function BookingFlow({ roomId, onBack, onSuccess }: BookingFlowProps) {
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [roomId]);

  const fetchData = async () => {
    try {
      const roomRes = await supabase
        .from('rooms')
        .select('*, studios!inner(*)')
        .eq('id', roomId)
        .single();

      if (roomRes.error) throw roomRes.error;

      const equipmentRes = await supabase
        .from('equipment')
        .select('*')
        .eq('studio_id', roomRes.data.studios.id)
        .eq('status', 'available');

      setRoom(roomRes.data);
      setEquipment(equipmentRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('خطا در بارگذاری اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!room || !startTime || !endTime) return 0;

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    let roomPrice = hours * room.hourly_price;
    if (hours >= 8) {
      roomPrice = room.daily_price;
    }

    const equipmentPrice = selectedEquipment.reduce((sum, eqId) => {
      const eq = equipment.find(e => e.id === eqId);
      return sum + (eq?.rental_price || 0);
    }, 0);

    return roomPrice + equipmentPrice;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSubmitting(true);

    try {
      const startDateTime = new Date(`${startDate}T${startTime}:00+03:30`);
      const endDateTime = new Date(`${startDate}T${endTime}:00+03:30`);

      if (startDateTime >= endDateTime) {
        throw new Error('زمان پایان باید بعد از زمان شروع باشد');
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          room_id: roomId,
          photographer_id: user.id,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          equipment_ids: selectedEquipment,
          total_price: calculateTotalPrice(),
          payment_status: 'pending',
          booking_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'رزرو جدید ثبت شد',
        message: `رزرو شما با موفقیت ثبت شد و در انتظار تایید است`,
        type: 'booking',
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت رزرو');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">اتاق یافت نشد</p>
        <Button onClick={onBack} className="mt-4">بازگشت</Button>
      </div>
    );
  }

  const totalPrice = calculateTotalPrice();

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ArrowRight size={20} />
        بازگشت
      </button>

      <h1 className="text-3xl font-bold text-gray-900">رزرو {room.name}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">زمان رزرو</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="تاریخ"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              <Input
                label="ساعت شروع"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
              <Input
                label="ساعت پایان"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>
        </Card>

        {equipment.length > 0 && (
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                تجهیزات (اختیاری)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {equipment.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEquipment.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEquipment([...selectedEquipment, item.id]);
                        } else {
                          setSelectedEquipment(selectedEquipment.filter(id => id !== item.id));
                        }
                      }}
                      className="w-5 h-5 text-blue-600"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.brand}</p>
                      <p className="text-sm text-blue-600 font-medium mt-1">
                        {item.rental_price.toLocaleString('fa-IR')} تومان
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </Card>
        )}

        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">خلاصه رزرو</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">اتاق:</span>
                <span className="font-medium">{room.name}</span>
              </div>
              {startTime && endTime && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">مدت زمان:</span>
                    <span className="font-medium">
                      {((new Date(`2000-01-01T${endTime}`) - new Date(`2000-01-01T${startTime}`)) / (1000 * 60 * 60)).toFixed(1)} ساعت
                    </span>
                  </div>
                  {selectedEquipment.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">تعداد تجهیزات:</span>
                      <span className="font-medium">{selectedEquipment.length}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>مجموع:</span>
                      <span className="text-blue-600">
                        {totalPrice.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          disabled={submitting || !startDate || !startTime || !endTime}
        >
          {submitting ? 'در حال ثبت...' : 'ثبت رزرو'}
        </Button>
      </form>
    </div>
  );
}
