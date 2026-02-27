import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TimeSlot {
  start: string;
  end: string;
}

interface DayAvailability {
  date: string;
  dayOfWeek: number;
  slots: TimeSlot[];
}

interface WeekViewProps {
  availability: DayAvailability[];
}

const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function WeekView({ availability }: WeekViewProps) {
  if (availability.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        本周没有可用时间段
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 min-w-max">
        {availability.map((day) => (
          <div key={day.date} className="border border-gray-200 rounded-lg p-4 min-w-[150px]">
            <div className="mb-3 pb-2 border-b border-gray-200">
              <div className="font-semibold text-gray-900">
                {dayNames[day.dayOfWeek]}
              </div>
              <div className="text-sm text-gray-600">
                {format(new Date(day.date), 'MM/dd', { locale: zhCN })}
              </div>
            </div>

            <div className="space-y-2">
              {day.slots.length === 0 ? (
                <div className="text-sm text-gray-400 italic">无空闲时段</div>
              ) : (
                day.slots.map((slot, index) => (
                  <div
                    key={index}
                    className="bg-green-50 border border-green-200 rounded px-3 py-2 text-sm text-green-800"
                  >
                    {slot.start} - {slot.end}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WeekView;
