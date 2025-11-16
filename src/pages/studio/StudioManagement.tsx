import { useState, useEffect } from 'react';
import { supabase, Studio } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Plus, MapPin, CheckCircle, Clock, XCircle } from 'lucide-react';

export function StudioManagement() {
  const { user } = useAuth();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    province: '',
    city: '',
    address: '',
  });

  useEffect(() => {
    if (user) {
      fetchStudios();
    }
  }, [user]);

  const fetchStudios = async () => {
    try {
      const { data, error } = await supabase
        .from('studios')
        .select('*')
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudios(data || []);
    } catch (error) {
      console.error('Error fetching studios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('studios').insert({
        owner_id: user!.id,
        ...formData,
      });

      if (error) throw error;

      setShowModal(false);
      setFormData({
        name: '',
        description: '',
        province: '',
        city: '',
        address: '',
      });
      fetchStudios();
    } catch (error) {
      console.error('Error creating studio:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'pending':
        return <Clock className="text-yellow-600" size={20} />;
      case 'rejected':
        return <XCircle className="text-red-600" size={20} />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'تایید شده';
      case 'pending': return 'در انتظار تایید';
      case 'rejected': return 'رد شده';
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">مدیریت استودیوها</h1>
          <p className="text-gray-600">استودیوهای خود را مدیریت کنید</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={20} className="ml-2" />
          افزودن استودیو
        </Button>
      </div>

      {studios.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-600 mb-4">هنوز استودیویی ثبت نکرده‌اید</p>
            <Button onClick={() => setShowModal(true)}>
              افزودن اولین استودیو
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {studios.map((studio) => (
            <Card key={studio.id}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {studio.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(studio.verification_status)}
                    <span className="text-sm text-gray-600">
                      {getStatusLabel(studio.verification_status)}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">
                  {studio.description || 'بدون توضیحات'}
                </p>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={16} />
                  <span>{studio.city}، {studio.province}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="افزودن استودیو جدید"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="نام استودیو"
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
              label="استان"
              value={formData.province}
              onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              required
            />
            <Input
              label="شهر"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
          </div>

          <Input
            label="آدرس کامل"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />

          <Button type="submit" fullWidth>
            ثبت استودیو
          </Button>
        </form>
      </Modal>
    </div>
  );
}
