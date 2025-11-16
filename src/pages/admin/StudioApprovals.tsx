import { useState, useEffect } from 'react';
import { supabase, Studio } from '../../lib/supabase';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { MapPin, Clock } from 'lucide-react';

export function StudioApprovals() {
  const [pendingStudios, setpendingStudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingStudios();
  }, []);

  const fetchPendingStudios = async () => {
    try {
      const { data, error } = await supabase
        .from('studios')
        .select('*, users!inner(name, email)')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setpendingStudios(data || []);
    } catch (error) {
      console.error('Error fetching pending studios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (studioId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('studios')
        .update({ verification_status: status })
        .eq('id', studioId);

      if (error) throw error;

      const studio = pendingStudios.find(s => s.id === studioId);
      if (studio) {
        await supabase.from('notifications').insert({
          user_id: studio.owner_id,
          title: status === 'approved' ? 'استودیو تایید شد' : 'استودیو رد شد',
          message: status === 'approved'
            ? `استودیو ${studio.name} شما با موفقیت تایید شد`
            : `متاسفانه استودیو ${studio.name} شما تایید نشد`,
          type: 'approval',
        });
      }

      fetchPendingStudios();
    } catch (error) {
      console.error('Error updating studio:', error);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">تایید استودیوها</h1>
        <p className="text-gray-600">مدیریت درخواست‌های استودیوهای جدید</p>
      </div>

      {pendingStudios.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <Clock size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">هیچ استودیویی در انتظار تایید نیست</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingStudios.map((studio) => (
            <Card key={studio.id}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {studio.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      صاحب: {studio.users.name} ({studio.users.email})
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    در انتظار تایید
                  </span>
                </div>

                <p className="text-gray-700 mb-4">
                  {studio.description || 'بدون توضیحات'}
                </p>

                <div className="flex items-center gap-2 text-gray-600 mb-6">
                  <MapPin size={18} />
                  <span className="text-sm">
                    {studio.address}، {studio.city}، {studio.province}
                  </span>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApproval(studio.id, 'approved')}
                    variant="success"
                  >
                    تایید استودیو
                  </Button>
                  <Button
                    onClick={() => handleApproval(studio.id, 'rejected')}
                    variant="danger"
                  >
                    رد درخواست
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
