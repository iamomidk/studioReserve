import { useState, useEffect } from 'react';
import { supabase, Studio } from '../../lib/supabase';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Search, MapPin, Star } from 'lucide-react';

interface StudioListProps {
  onSelectStudio: (studioId: string) => void;
}

export function StudioList({ onSelectStudio }: StudioListProps) {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  useEffect(() => {
    fetchStudios();
  }, []);

  const fetchStudios = async () => {
    try {
      const { data, error } = await supabase
        .from('studios')
        .select('*')
        .eq('verification_status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudios(data || []);
    } catch (error) {
      console.error('Error fetching studios:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudios = studios.filter((studio) => {
    const matchesSearch = studio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          studio.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = !cityFilter || studio.city === cityFilter;
    return matchesSearch && matchesCity;
  });

  const cities = Array.from(new Set(studios.map(s => s.city)));

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">جستجوی استودیو</h1>
        <p className="text-gray-600">استودیوی مناسب خود را پیدا کنید</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="جستجوی استودیو..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
          <div>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">همه شهرها</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredStudios.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">استودیویی یافت نشد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudios.map((studio) => (
            <Card
              key={studio.id}
              hover
              onClick={() => onSelectStudio(studio.id)}
            >
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
              <div className="p-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {studio.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {studio.description || 'بدون توضیحات'}
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin size={16} className="ml-1" />
                  <span>{studio.city}، {studio.province}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
