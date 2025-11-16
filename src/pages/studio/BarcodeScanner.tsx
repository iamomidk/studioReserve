import { useState, useEffect } from 'react';
import { supabase, Equipment } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Scan, Package, CheckCircle, XCircle } from 'lucide-react';

export function BarcodeScanner() {
  const { user } = useAuth();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);

  useEffect(() => {
    fetchRecentScans();
  }, []);

  const fetchRecentScans = async () => {
    try {
      const studiosRes = await supabase
        .from('studios')
        .select('id')
        .eq('owner_id', user!.id);

      if (studiosRes.data && studiosRes.data.length > 0) {
        const studioIds = studiosRes.data.map(s => s.id);

        const { data, error } = await supabase
          .from('equipment_logs')
          .select(`
            *,
            equipment!inner(*, studios!inner(*)),
            users(name)
          `)
          .in('equipment.studio_id', studioIds)
          .order('timestamp', { ascending: false })
          .limit(10);

        if (error) throw error;
        setRecentScans(data || []);
      }
    } catch (error) {
      console.error('Error fetching recent scans:', error);
    }
  };

  const handleScan = async (action: 'scan_out' | 'scan_in') => {
    if (!barcodeInput.trim()) {
      setMessage({ type: 'error', text: 'لطفا بارکد را وارد کنید' });
      return;
    }

    setScanning(true);
    setMessage(null);

    try {
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('*, studios!inner(*)')
        .eq('barcode_code', barcodeInput.trim())
        .maybeSingle();

      if (equipmentError) throw equipmentError;

      if (!equipmentData) {
        setMessage({ type: 'error', text: 'تجهیز با این بارکد یافت نشد' });
        setScanning(false);
        return;
      }

      if (equipmentData.studios.owner_id !== user!.id) {
        setMessage({ type: 'error', text: 'شما مجاز به اسکن این تجهیز نیستید' });
        setScanning(false);
        return;
      }

      if (action === 'scan_out' && equipmentData.status !== 'available') {
        setMessage({ type: 'error', text: 'این تجهیز در حال حاضر موجود نیست' });
        setScanning(false);
        return;
      }

      if (action === 'scan_in' && equipmentData.status !== 'rented') {
        setMessage({ type: 'error', text: 'این تجهیز در اجاره نیست' });
        setScanning(false);
        return;
      }

      const { error: logError } = await supabase
        .from('equipment_logs')
        .insert({
          equipment_id: equipmentData.id,
          user_id: user!.id,
          action,
        });

      if (logError) throw logError;

      const newStatus = action === 'scan_out' ? 'rented' : 'available';
      const { error: updateError } = await supabase
        .from('equipment')
        .update({ status: newStatus })
        .eq('id', equipmentData.id);

      if (updateError) throw updateError;

      setMessage({
        type: 'success',
        text: action === 'scan_out'
          ? 'تجهیز با موفقیت تحویل داده شد'
          : 'تجهیز با موفقیت بازگشت داده شد'
      });

      setEquipment({ ...equipmentData, status: newStatus });
      setBarcodeInput('');
      fetchRecentScans();

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'خطا در اسکن' });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">اسکن بارکد تجهیزات</h1>
        <p className="text-gray-600">مدیریت تحویل و بازگشت تجهیزات</p>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="p-6 bg-blue-50 rounded-full">
              <Scan className="text-blue-600" size={48} />
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="کد بارکد"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="کد بارکد را وارد کنید یا اسکن کنید"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
            />

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleScan('scan_out')}
                disabled={scanning}
                variant="success"
                fullWidth
              >
                تحویل تجهیز
              </Button>
              <Button
                onClick={() => handleScan('scan_in')}
                disabled={scanning}
                variant="primary"
                fullWidth
              >
                بازگشت تجهیز
              </Button>
            </div>

            {message && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="text-green-600" size={20} />
                ) : (
                  <XCircle className="text-red-600" size={20} />
                )}
                <p className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                  {message.text}
                </p>
              </div>
            )}

            {equipment && (
              <Card className="bg-gray-50">
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{equipment.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>برند: {equipment.brand || '-'}</p>
                    <p>نوع: {equipment.type}</p>
                    <p>وضعیت: {
                      equipment.status === 'available' ? 'موجود' :
                      equipment.status === 'rented' ? 'در اجاره' : 'خراب'
                    }</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">آخرین اسکن‌ها</h2>
          {recentScans.length === 0 ? (
            <p className="text-gray-600 text-center py-8">هنوز اسکنی انجام نشده است</p>
          ) : (
            <div className="space-y-3">
              {recentScans.map((scan) => (
                <div key={scan.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{scan.equipment.name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(scan.timestamp).toLocaleString('fa-IR')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    scan.action === 'scan_out'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {scan.action === 'scan_out' ? 'تحویل' : 'بازگشت'}
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
