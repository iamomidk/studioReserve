import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { User } from 'lucide-react';

export function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name,
          phone_number: phoneNumber || null,
        })
        .eq('id', user!.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'پروفایل با موفقیت به‌روزرسانی شد' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'خطا در به‌روزرسانی پروفایل' });
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'photographer': return 'عکاس / فیلمبردار';
      case 'studio_owner': return 'صاحب استودیو';
      case 'admin': return 'مدیر';
      default: return role;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">پروفایل کاربری</h1>
        <p className="text-gray-600">مدیریت اطلاعات حساب کاربری</p>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-blue-100 rounded-full">
              <User className="text-blue-600" size={48} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="نام"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="ایمیل"
              value={user?.email || ''}
              disabled
              className="bg-gray-100"
            />

            <Input
              label="شماره تماس"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="مثال: 09123456789"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نوع کاربری
              </label>
              <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700">
                {getRoleLabel(user?.role || '')}
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
