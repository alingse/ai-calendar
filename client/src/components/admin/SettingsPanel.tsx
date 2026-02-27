import { useState, useEffect } from 'react';
import api from '../../api';

interface Settings {
  available_start: string;
  available_end: string;
  available_days: number[];
  timezone: string;
  slot_duration: number;
}

const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>({
    available_start: '09:00',
    available_end: '18:00',
    available_days: [1, 2, 3, 4, 5],
    timezone: 'Asia/Shanghai',
    slot_duration: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      await api.put('/settings', settings);
      setMessage('设置已保存');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: number) => {
    if (settings.available_days.includes(day)) {
      setSettings({
        ...settings,
        available_days: settings.available_days.filter(d => d !== day),
      });
    } else {
      setSettings({
        ...settings,
        available_days: [...settings.available_days, day].sort(),
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">加载中...</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">可用时间设置</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                开始时间
              </label>
              <input
                type="time"
                value={settings.available_start}
                onChange={(e) => setSettings({ ...settings, available_start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                结束时间
              </label>
              <input
                type="time"
                value={settings.available_end}
                onChange={(e) => setSettings({ ...settings, available_end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              可用天数
            </label>
            <div className="flex flex-wrap gap-2">
              {dayNames.map((name, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleDay(index)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    settings.available_days.includes(index)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              时间段长度（分钟）
            </label>
            <input
              type="number"
              value={settings.slot_duration}
              onChange={(e) => setSettings({ ...settings, slot_duration: parseInt(e.target.value) })}
              min="15"
              step="15"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              时区
            </label>
            <input
              type="text"
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              readOnly
            />
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-md text-sm ${
          message.includes('失败')
            ? 'bg-red-50 border border-red-200 text-red-600'
            : 'bg-green-50 border border-green-200 text-green-600'
        }`}>
          {message}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? '保存中...' : '保存设置'}
      </button>
    </div>
  );
}

export default SettingsPanel;
