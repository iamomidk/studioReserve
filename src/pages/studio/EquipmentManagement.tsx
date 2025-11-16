import { useState, useEffect } from 'react';
import { supabase, Equipment, Studio } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Plus, Package } from 'lucide-react';

export function EquipmentManagement() {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    studio_id: '',
    name: '',
    brand: '',
    type: '',
    rental_price: '',
    serial_number: '',
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
        const equipmentRes = await supabase
          .from('equipment')
          .select('*')
          .in('studio_id', studioIds)
          .order('name');

        setEquipment(equipmentRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateBarcodeCode = () => {
    return `EQ${Date.now()}${Math.floor(Math.random() * 1000)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('equipment').insert({
        ...formData,
        rental_price: parseFloat(formData.rental_price),
        barcode_code: generateBarcodeCode(),
        status: 'available',
      });

      if (error) throw error;

      setShowModal(false);
      setFormData({
        studio_id: studios[0]?.id || '',
        name: '',
        brand: '',
        type: '',
        rental_price: '',
        serial_number: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating equipment:', error);
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
        <Package size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 mb-4">
          برای افزودن تجهیزات، ابتدا باید یک استودیو تایید شده داشته باشید
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">مدیریت تجهیزات</h1>
          <p className="text-gray-600">تجهیزات خود را مدیریت کنید</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={20} className="ml-2" />
          افزودن تجهیزات
        </Button>
      </div>

      {equipment.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-600 mb-4">هنوز تجهیزاتی ثبت نکرده‌اید</p>
            <Button onClick={() => setShowModal(true)}>
              افزودن اولین تجهیز
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipment.map((item) => (
            <Card key={item.id}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.name}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    item.status === 'available' ? 'bg-green-100 text-green-800' :
                    item.status === 'rented' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.status === 'available' ? 'موجود' :
                     item.status === 'rented' ? 'در اجاره' : 'خراب'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">برند:</span> {item.brand || '-'}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">نوع:</span> {item.type}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">قیمت اجاره:</span> {item.rental_price.toLocaleString('fa-IR')} تومان
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">بارکد:</span> {item.barcode_code}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="افزودن تجهیزات جدید"
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
            label="نام تجهیز"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="برند"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          />

          <Input
            label="نوع تجهیز"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            placeholder="مثلا: دوربین، لنز، نور و..."
            required
          />

          <Input
            label="قیمت اجاره (تومان)"
            type="number"
            value={formData.rental_price}
            onChange={(e) => setFormData({ ...formData, rental_price: e.target.value })}
            required
          />

          <Input
            label="شماره سریال"
            value={formData.serial_number}
            onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
          />

          <Button type="submit" fullWidth>
            ثبت تجهیز
          </Button>
        </form>
      </Modal>
    </div>
  );
}
