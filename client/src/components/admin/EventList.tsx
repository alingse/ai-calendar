import { useState, useEffect } from 'react';
import api from '../../api';

interface Event {
  id: number;
  title: string;
  type: 'one-time' | 'recurring';
  date?: string;
  day_of_week?: number;
  start_time: string;
  end_time: string;
}

interface EventListProps {
  onEdit: (event: Event) => void;
}

const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function EventList({ onEdit }: EventListProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个事件吗？')) {
      return;
    }

    try {
      await api.delete(`/events/${id}`);
      setEvents(events.filter(e => e.id !== id));
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('删除失败');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">加载中...</div>;
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        暂无事件，点击上方按钮添加
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          className="border border-gray-200 rounded-lg p-4 hover:border-gray-300"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>
                  类型: {event.type === 'one-time' ? '一次性' : '周期性'}
                </div>
                {event.type === 'one-time' && event.date && (
                  <div>日期: {event.date}</div>
                )}
                {event.type === 'recurring' && event.day_of_week !== undefined && (
                  <div>每周: {dayNames[event.day_of_week]}</div>
                )}
                <div>
                  时间: {event.start_time} - {event.end_time}
                </div>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onEdit(event)}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
              >
                编辑
              </button>
              <button
                onClick={() => handleDelete(event.id)}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-700"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default EventList;
