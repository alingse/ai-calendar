import { useState, useEffect } from 'react';
import { format, startOfWeek, addWeeks } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import api from '../api';
import WeekView from '../components/calendar/WeekView';

interface TimeSlot {
  start: string;
  end: string;
}

interface DayAvailability {
  date: string;
  dayOfWeek: number;
  slots: TimeSlot[];
}

interface AvailabilityResponse {
  weekOf: string;
  availability: DayAvailability[];
}

function PublicCalendar() {
  const [currentWeek, setCurrentWeek] = useState(() =>
    format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd')
  );
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailability();
  }, [currentWeek]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await api.get<AvailabilityResponse>(`/availability?weekOf=${currentWeek}`);
      setAvailability(response.data.availability);
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousWeek = () => {
    const prevWeek = addWeeks(new Date(currentWeek), -1);
    setCurrentWeek(format(startOfWeek(prevWeek, { weekStartsOn: 0 }), 'yyyy-MM-dd'));
  };

  const goToNextWeek = () => {
    const nextWeek = addWeeks(new Date(currentWeek), 1);
    setCurrentWeek(format(startOfWeek(nextWeek, { weekStartsOn: 0 }), 'yyyy-MM-dd'));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd'));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">面试日历</h1>
          <p className="text-gray-600">查看可用的面试时间段</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goToPreviousWeek}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              上一周
            </button>

            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {format(new Date(currentWeek), 'yyyy年MM月dd日', { locale: zhCN })} 周
              </h2>
              <button
                onClick={goToCurrentWeek}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
              >
                今天
              </button>
            </div>

            <button
              onClick={goToNextWeek}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              下一周
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          ) : (
            <WeekView availability={availability} />
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>时区: Asia/Shanghai (UTC+8)</p>
        </div>
      </div>
    </div>
  );
}

export default PublicCalendar;

