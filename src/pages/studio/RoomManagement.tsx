import { useState, useEffect } from 'react';
import { supabase, Room, Studio } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Plus, Building2 } from 'lucide-react';

export function RoomManagement() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    studio_id: '',
    name: '',
    description: '',
    hourly_price: '',
    daily_price: '',
    features: '',
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const studiosRes = await supabase
        .from('studios')
        .select('*')
        .eq('owner_id', user!.id)
        .eq('verification_status', 'approved');

      if (studiosRes.data && studiosRes.data.length > 0) {
        setStudios(studiosRes.data);
        setFormData(prev => ({ ...prev, studio_id: studiosRes.data[0].id }));

        const studioIds = studiosRes.data.map(s => s.id);
        const roomsRes = await supabase
          .from('rooms')
          .select('*, studios!inner(name)')
          .in('studio_id', studioIds)
          .order('name');

        setRooms(roomsRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const featuresArray = formData.features
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const { error } = await supabase.from('rooms').insert({
        studio_id: formData.studio_id,
        name: formData.name,
        description: formData.description || null,
        hourly_price: parseFloat(formData.hourly_price),
        daily_price: parseFloat(formData.daily_price),
        features: featuresArray,
      });

      if (error) throw error;

      setShowModal(false);
      setFormData({
        studio_id: studios[0]?.id || '',
        name: '',
        description: '',
        hourly_price: '',
        daily_price: '',
        features: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (studios.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 mb-4">
          برای افزودن اتاق، ابتدا باید یک استودیو تایید شده داشته باشید
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">مدیریت اتاق‌ها</h1>
          <p className="text-gray-600">اتاق‌های استودیو خود را مدیریت کنید</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={20} className="ml-2" />
          افزودن اتاق
        </Button>
      </div>

      {rooms.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-600 mb-4">هنوز اتاقی ثبت نکرده‌اید</p>
            <Button onClick={() => setShowModal(true)}>
              افزودن اولین اتاق
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room.id}>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {room.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  استودیو: {room.studios.name}
                </p>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {room.description || 'بدون توضیحات'}
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ساعتی:</span>
                    <span className="font-medium">
                      {room.hourly_price.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">روزانه:</span>
                    <span className="font-medium">
                      {room.daily_price.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                </div>
                {room.features.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {room.features.slice(0, 3).map((feature: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                    {room.features.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{room.features.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="افزودن اتاق جدید"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              استودیو
            </label>
            <select
              value={formData.studio_id}
              onChange={(e) => setFormData({ ...formData, studio_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            >
              {studios.map((studio) => (
                <option key={studio.id} value={studio.id}>
                  {studio.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="نام اتاق"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              توضیحات
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="قیمت ساعتی (تومان)"
              type="number"
              value={formData.hourly_price}
              onChange={(e) => setFormData({ ...formData, hourly_price: e.target.value })}
              required
            />
            <Input
              label="قیمت روزانه (تومان)"
              type="number"
              value={formData.daily_price}
              onChange={(e) => setFormData({ ...formData, daily_price: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              امکانات (با کاما جدا کنید)
            </label>
            <Input
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              placeholder="مثال: نور طبیعی, بک‌گراند سفید, تجهیزات صدا"
            />
          </div>

          <Button type="submit" fullWidth>
            ثبت اتاق
          </Button>
        </form>
      </Modal>
    </div>
  );
}
