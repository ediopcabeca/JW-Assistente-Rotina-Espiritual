import React, { useState, useEffect, useRef } from 'react';
import { generateStudySchedule } from '../services/geminiService';
import { ScheduleItem } from '../types';
import { Calendar, Loader2, CheckCircle2, Circle, Bell, BellRing, Clock, Mic, Square, RefreshCw } from 'lucide-react';
import { syncAdapter } from '../services/syncAdapter';

const STORAGE_KEY_SCHEDULE = 'jw_schedule_data';
const STORAGE_KEY_CONFIG = 'jw_schedule_config';

interface ScheduleBuilderProps {
  userId?: string;
}

const ScheduleBuilder: React.FC<ScheduleBuilderProps> = ({ userId }) => {
  const getKey = (key: string) => userId ? `${key}_${userId}` : key;

  const [profile, setProfile] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(getKey(STORAGE_KEY_CONFIG));
      return saved ? JSON.parse(saved).profile : '';
    }
    return '';
  });
  const [timeAvailable, setTimeAvailable] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(getKey(STORAGE_KEY_CONFIG));
      return saved ? JSON.parse(saved).timeAvailable : '';
    }
    return '';
  });

  const [weekStartDate, setWeekStartDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(getKey(STORAGE_KEY_CONFIG));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.weekStartDate) return parsed.weekStartDate;
      }
    }
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(false);
  const [activeField, setActiveField] = useState<'profile' | 'time' | null>(null);
  const recognitionRef = useRef<any>(null);

  const [schedule, setSchedule] = useState<ScheduleItem[] | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(getKey(STORAGE_KEY_SCHEDULE));
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const notificationTimeouts = useRef<number[]>([]);

  useEffect(() => {
    const initData = async () => {
      if (userId && syncAdapter.isAvailable()) {
        try {
          await syncAdapter.pullUserData();
        } catch (e) {
          console.error('[SYNC] Falha ao sincronizar na inicialização:', e);
        }
      }

      const savedConfig = localStorage.getItem(getKey(STORAGE_KEY_CONFIG));
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setProfile(parsed.profile);
        setTimeAvailable(parsed.timeAvailable);
        if (parsed.weekStartDate) setWeekStartDate(parsed.weekStartDate);
      } else {
        setProfile('');
        setTimeAvailable('');
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        setWeekStartDate(monday.toISOString().split('T')[0]);
      }

      const savedSchedule = localStorage.getItem(getKey(STORAGE_KEY_SCHEDULE));
      setSchedule(savedSchedule ? JSON.parse(savedSchedule) : null);
    };

    initData();
  }, [userId]);

  useEffect(() => {
    const configData = { profile, timeAvailable, weekStartDate };
    localStorage.setItem(getKey(STORAGE_KEY_CONFIG), JSON.stringify(configData));
  }, [profile, timeAvailable, weekStartDate, userId]);

  useEffect(() => {
    if (schedule) {
      localStorage.setItem(getKey(STORAGE_KEY_SCHEDULE), JSON.stringify(schedule));
      notificationTimeouts.current.forEach((id) => window.clearTimeout(id));
      notificationTimeouts.current = [];
      schedule.forEach((item, index) => {
        if (item.notificationEnabled && item.notificationTime && !item.completed) {
          scheduleNotification(item, index);
        }
      });
    }
    return () => {
      notificationTimeouts.current.forEach((id) => window.clearTimeout(id));
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [schedule, userId, weekStartDate]);

  const toggleRecording = (field: 'profile' | 'time') => {
    if (activeField === field) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setActiveField(null);
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setActiveField(field);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join('');

      if (event.results[0].isFinal) {
        if (field === 'profile') {
          setProfile(prev => prev ? `${prev} ${transcript}` : transcript);
        } else {
          setTimeAvailable(prev => prev ? `${prev} ${transcript}` : transcript);
        }
      }
    };

    recognition.onerror = () => setActiveField(null);
    recognition.onend = () => setActiveField(null);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const parseDate = (str: string) => {
    if (!str) return new Date();
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  };

  const scheduleNotification = (item: ScheduleItem, index: number) => {
    if (!weekStartDate || !item.notificationTime) return;
    const startOfWeek = parseDate(weekStartDate);
    const targetDate = new Date(startOfWeek);
    targetDate.setDate(targetDate.getDate() + index);
    const [hours, minutes] = item.notificationTime.split(':').map(Number);
    targetDate.setHours(hours, minutes, 0, 0);
    const now = new Date();
    const timeUntil = targetDate.getTime() - now.getTime();

    if (timeUntil > 0 && timeUntil < 2147483647) {
      console.log(`Notificação agendada para ${item.activity} em ${timeUntil}ms`);
      const timeoutId = window.setTimeout(() => {
        if ('serviceWorker' in navigator && Notification.permission === 'granted') {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(`Lembrete JW: ${item.activity}`, {
              body: item.focus,
              icon: '/icon.png',
              tag: `jw-notification-${index}`,
              badge: '/icon.png',
              vibrate: [200, 100, 200],
              actions: [
                { action: 'open_app', title: 'Ver no App' },
                { action: 'snooze_1h', title: 'Adiar 1h' }
              ]
            } as any);
          });
        } else {
          new Notification(`Lembrete JW: ${item.activity}`, {
            body: item.focus,
            tag: `jw-notification-${index}`
          });
        }
      }, timeUntil);
      notificationTimeouts.current.push(timeoutId);
    }
  };

  const handleGenerate = async () => {
    if (!profile || !timeAvailable) return;
    setLoading(true);
    const start = parseDate(weekStartDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const weekContext = `${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')}`;
    const result = await generateStudySchedule(profile, timeAvailable, weekContext);
    const initialSchedule = result.map(item => ({
      ...item,
      completed: false,
      notificationEnabled: false,
      notificationTime: ''
    }));
    setSchedule(initialSchedule);
    setLoading(false);
  };

  const toggleComplete = (index: number) => {
    if (!schedule) return;
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], completed: !newSchedule[index].completed };
    setSchedule(newSchedule);
  };

  const toggleNotification = async (index: number) => {
    if (!schedule) return;
    if (!schedule[index].notificationEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }
    const newSchedule = [...schedule];
    newSchedule[index] = {
      ...newSchedule[index],
      notificationEnabled: !newSchedule[index].notificationEnabled
    };
    setSchedule(newSchedule);
  };

  const handleTimeChange = (index: number, time: string) => {
    if (!schedule) return;
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], notificationTime: time };
    setSchedule(newSchedule);
  };

  const getWeekRangeDisplay = () => {
    if (!weekStartDate) return "";
    const start = parseDate(weekStartDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')}`;
  };

  const getDayDateDisplay = (index: number) => {
    if (!weekStartDate) return "";
    const start = parseDate(weekStartDate);
    const date = new Date(start);
    date.setDate(date.getDate() + index);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <Calendar size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Organizador Semanal</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Crie uma rotina equilibrada para suas atividades espirituais.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Semana de Início</label>
            <input
              type="date"
              className="w-full p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Seu perfil / Rotina</label>
            <div className="relative">
              <textarea
                className="w-full p-3 pr-10 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                rows={3}
                placeholder="Ex: Trabalho das 8h às 18h..."
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
              />
              <button
                onClick={() => toggleRecording('profile')}
                className={`absolute top-2 right-2 p-2 rounded-full transition-all ${activeField === 'profile' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {activeField === 'profile' ? <Square size={16} /> : <Mic size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tempo para estudo</label>
            <div className="relative">
              <input
                type="text"
                className="w-full p-3 pr-10 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                placeholder="Ex: 45 min"
                value={timeAvailable}
                onChange={(e) => setTimeAvailable(e.target.value)}
              />
              <button
                onClick={() => toggleRecording('time')}
                className={`absolute top-1/2 -translate-y-1/2 right-2 p-2 rounded-full transition-all ${activeField === 'time' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {activeField === 'time' ? <Square size={16} /> : <Mic size={16} />}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !profile || !timeAvailable}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <span>Gerar Cronograma</span>}
        </button>
      </div>

      {schedule && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg inline-block">
            Semana de {getWeekRangeDisplay()}
          </h3>

          <div className="grid gap-4">
            {schedule.map((item, index) => (
              <div
                key={index}
                className={`p-5 rounded-xl border shadow-sm transition-all duration-200 ${item.completed ? 'bg-gray-50 dark:bg-gray-900/50 opacity-70' : 'bg-white dark:bg-gray-800 border-l-4 border-l-blue-500'}`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 flex gap-4 cursor-pointer" onClick={() => toggleComplete(index)}>
                    <div className="text-gray-300 dark:text-gray-600 pt-1">
                      {item.completed ? <CheckCircle2 size={24} className="text-green-500" /> : <Circle size={24} />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className={`text-xs font-bold uppercase ${item.completed ? 'text-gray-400' : 'text-blue-600 dark:text-blue-400'}`}>{item.day}</span>
                        <span className="text-xs text-gray-400">{getDayDateDisplay(index)}</span>
                      </div>
                      <h4 className={`font-semibold text-lg ${item.completed ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>{item.activity}</h4>
                      <p className={`text-sm ${item.completed ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>{item.focus}</p>
                    </div>
                  </div>

                  {!item.completed && (
                    <div className="flex items-center gap-2 self-end md:self-center">
                      {item.notificationEnabled && (
                        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1">
                          <Clock size={14} className="text-gray-500 mr-2" />
                          <input
                            type="time"
                            value={item.notificationTime || ''}
                            onChange={(e) => handleTimeChange(index, e.target.value)}
                            className="bg-transparent border-none outline-none text-sm text-gray-800 dark:text-white w-24 p-0"
                          />
                        </div>
                      )}
                      <button
                        onClick={() => toggleNotification(index)}
                        className={`p-2 rounded-full transition-all ${item.notificationEnabled ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >
                        {item.notificationEnabled ? <BellRing size={20} /> : <Bell size={20} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleBuilder;