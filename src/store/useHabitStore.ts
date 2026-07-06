import { create } from 'zustand';
import api from '../services/api';
import type { Habit, HabitLog, WellnessLog } from '../types';
import { format } from 'date-fns';

interface HabitState {
  habits: Habit[];
  habitLogs: HabitLog;
  wellnessLogs: WellnessLog;
  currentMonthId: string;
  isLoading: boolean;
  
  setCurrentMonth: (monthId: string) => Promise<void>;
  loadData: () => Promise<void>;
  toggleHabitLog: (habitId: string, dateStr: string) => Promise<void>;
  updateWellnessLog: (dateStr: string, type: 'mood' | 'sleep', value: number | null) => Promise<void>;
  addHabit: (name: string, icon: string, monthlyGoal: number) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
}

const getCurrentMonthId = () => format(new Date(), 'yyyy-MM');

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  habitLogs: {},
  wellnessLogs: {},
  currentMonthId: getCurrentMonthId(),
  isLoading: false,

  setCurrentMonth: async (monthId: string) => {
    set({ currentMonthId: monthId });
    await get().loadData();
  },

  loadData: async () => {
    const monthId = get().currentMonthId;
    const [year, month] = monthId.split('-');
    
    set({ isLoading: true });
    try {
      const [habitsRes, wellnessRes] = await Promise.all([
        api.get(`/habits?year=${year}&month=${month}`),
        api.get(`/wellness?year=${year}&month=${month}`)
      ]);

      const habits = habitsRes.data.habits || [];
      const logsArray = habitsRes.data.logs || [];
      
      const newHabitLogs: HabitLog = {};
      logsArray.forEach((log: any) => {
        newHabitLogs[`${log.habit_id}_${log.log_date}`] = log.completed;
      });

      const newWellnessLogs: WellnessLog = {};
      (wellnessRes.data || []).forEach((w: any) => {
        newWellnessLogs[w.log_date] = { mood: w.mood, sleep: w.sleep };
      });

      set({
        habits,
        habitLogs: newHabitLogs,
        wellnessLogs: newWellnessLogs,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to load habit data', error);
      set({ isLoading: false });
    }
  },

  toggleHabitLog: async (habitId: string, dateStr: string) => {
    const { habitLogs } = get();
    const key = `${habitId}_${dateStr}`;
    const isCurrentlyChecked = habitLogs[key] || false;
    const newStatus = !isCurrentlyChecked;
    
    // Optimistic update
    set({
      habitLogs: {
        ...habitLogs,
        [key]: newStatus
      }
    });

    try {
      await api.post('/habits/logs', {
        habit_id: habitId,
        log_date: dateStr,
        completed: newStatus
      });
    } catch (error) {
      console.error('Failed to toggle habit', error);
      // Revert on error
      set({
        habitLogs: {
          ...get().habitLogs,
          [key]: isCurrentlyChecked
        }
      });
    }
  },

  updateWellnessLog: async (dateStr: string, type: 'mood' | 'sleep', value: number | null) => {
    const { wellnessLogs } = get();
    const currentData = wellnessLogs[dateStr] || { mood: null, sleep: null };
    const newData = { ...currentData, [type]: value };
    
    // Optimistic update
    set({
      wellnessLogs: {
        ...wellnessLogs,
        [dateStr]: newData
      }
    });

    try {
      await api.post('/wellness', {
        log_date: dateStr,
        ...newData
      });
    } catch (error) {
      console.error('Failed to update wellness log', error);
      // Revert on error
      set({
        wellnessLogs: {
          ...get().wellnessLogs,
          [dateStr]: currentData
        }
      });
    }
  },

  addHabit: async (name: string, icon: string, monthlyGoal: number) => {
    try {
      const { habits } = get();
      const response = await api.post('/habits', {
        name,
        icon,
        monthlyGoal,
        order_index: habits.length
      });
      
      set({ habits: [...habits, response.data] });
    } catch (error) {
      console.error('Failed to add habit', error);
    }
  },

  deleteHabit: async (habitId: string) => {
    try {
      await api.delete(`/habits/${habitId}`);
      const { habits } = get();
      set({ habits: habits.filter(h => h.id !== habitId) });
    } catch (error) {
      console.error('Failed to delete habit', error);
    }
  }
}));
