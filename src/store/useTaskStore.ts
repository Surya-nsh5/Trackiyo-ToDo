import { create } from 'zustand';
import api from '../services/api';

export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  category: string;
  due_date: string | null;
  created_at: string;
  is_completed: boolean;
}

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'created_at'>) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  deleteTasks: (ids: string[]) => Promise<void>;
  completeTasks: (ids: string[]) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/tasks');
      set({ tasks: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch tasks', error);
      set({ isLoading: false });
    }
  },

  addTask: async (taskData) => {
    try {
      const response = await api.post('/tasks', taskData);
      set((state) => ({ tasks: [response.data, ...state.tasks] }));
    } catch (error) {
      console.error('Failed to add task', error);
    }
  },

  updateTask: async (id, data) => {
    try {
      const response = await api.put(`/tasks/${id}`, data);
      set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? response.data : t)
      }));
    } catch (error) {
      console.error('Failed to update task', error);
    }
  },

  toggleTask: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;
    try {
      const response = await api.put(`/tasks/${id}`, { is_completed: !task.is_completed });
      set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? response.data : t)
      }));
    } catch (error) {
      console.error('Failed to toggle task', error);
    }
  },

  deleteTask: async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete task', error);
    }
  },

  deleteTasks: async (ids) => {
    try {
      await api.post('/tasks/batch-delete', { ids });
      set((state) => ({
        tasks: state.tasks.filter(t => !ids.includes(t.id))
      }));
    } catch (error) {
      console.error('Failed to delete tasks', error);
    }
  },

  completeTasks: async (ids) => {
    try {
      await api.post('/tasks/batch-complete', { ids });
      set((state) => ({
        tasks: state.tasks.map(t => ids.includes(t.id) ? { ...t, is_completed: true } : t)
      }));
    } catch (error) {
      console.error('Failed to complete tasks', error);
    }
  }
}));
