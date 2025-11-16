import { useState, useEffect } from 'react';
import { supabase, Studio, Room, Equipment } from '../../lib/supabase';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { MapPin, ArrowRight, Clock, DollarSign } from 'lucide-react';

interface StudioDetailProps {
  studioId: string;
  onBack: () => void;
  onBookRoom: (roomId: string) => void;
}

export function StudioDetail({ studioId, onBack, onBookRoom }: StudioDetailProps) {
  const [studio, setStudio] = useState<Studio | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudioDetails();
  }, [studioId]);

  const fetchStudioDetails = async () => {
    try {
      const [studioRes, roomsRes, equipmentRes] = await Promise.all([
        supabase.from('studios').select('*').eq('id', studioId).single(),
        supabase.from('rooms').select('*').eq('studio_id', studioId),
        supabase.from('equipment').select('*').eq('studio_id', studioId).eq('status', 'available')
      ]);

      if (studioRes.error) throw studioRes.error;
      if (roomsRes.error) throw roomsRes.error;

      setStudio(studioRes.data);
      setRooms(roomsRes.data || []);
      setEquipment(equipmentRes.data || []);
    } catch (error) {
      console.error('Error fetching studio details:', error);
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

  if (!studio) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">استودیو یافت نشد</p>
        <Button onClick={onBack} className="mt-4">بازگشت</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ArrowRight size={20} />
        بازگشت به لیست
      </button>

      <Card>
        <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
          {studio.photos[0] ? (
            <img
              src={studio.photos[0]}
              alt={studio.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              بدون تصویر
            </div>
          )}
        </div>
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{studio.name}</h1>
          <div className="flex items-center text-gray-600 mb-4">
            <MapPin size={20} className="ml-2" />
            <span>{studio.address}، {studio.city}، {studio.province}</span>
          </div>
          <p className="text-gray-700 leading-relaxed">{studio.description}</p>
        </div>
      </Card>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">اتاق‌های موجود</h2>
        {rooms.length === 0 ? (
          <Card>
            <div className="p-6 text-center text-gray-600">
              هیچ اتاقی موجود نیست
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((room) => (
              <Card key={room.id}>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {room.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{room.description}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={16} />
                      <span>ساعتی: {room.hourly_price.toLocaleString('fa-IR')} تومان</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign size={16} />
                      <span>روزانه: {room.daily_price.toLocaleString('fa-IR')} تومان</span>
                    </div>
                  </div>
                  {room.features.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">امکانات:</p>
                      <div className="flex flex-wrap gap-2">
                        {room.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={() => onBookRoom(room.id)}
                    fullWidth
                  >
                    رزرو اتاق
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {equipment.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">تجهیزات قابل اجاره</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {equipment.map((item) => (
              <Card key={item.id}>
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{item.brand}</p>
                  <p className="text-sm text-blue-600 font-medium">
                    {item.rental_price.toLocaleString('fa-IR')} تومان
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
