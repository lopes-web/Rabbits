import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface HabitLog {
  date: string;
  value: number;
  habit_id: string;
  user_id: string;
}

interface Statistics {
  completionRate: number;
  bestDay: string;
  totalCompleted: number;
  currentStreak: number;
  bestStreak: number;
}

export const Statistics = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['habitStats'],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30); // Últimos 30 dias

      const { data, error } = await supabase
        .from('habit_checks')
        .select('*')
        .eq('user_id', user?.id)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());

      if (error) throw error;

      // Calcular estatísticas
      const stats: Statistics = {
        completionRate: 0,
        bestDay: '',
        totalCompleted: 0,
        currentStreak: 0,
        bestStreak: 0,
      };

      if (!data || data.length === 0) return stats;

      const habitLogs = data as HabitLog[];

      // Agrupar por dia
      const dailyStats = habitLogs.reduce((acc: { [key: string]: { completed: number; total: number } }, log) => {
        const date = new Date(log.date).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { completed: 0, total: 0 };
        }
        acc[date].completed += log.value > 0 ? 1 : 0;
        acc[date].total += 1;
        return acc;
      }, {});

      // Calcular taxa de conclusão
      const totalCompleted = Object.values(dailyStats).reduce((sum, day) => sum + day.completed, 0);
      const totalHabits = Object.values(dailyStats).reduce((sum, day) => sum + day.total, 0);
      stats.completionRate = (totalCompleted / totalHabits) * 100;
      stats.totalCompleted = totalCompleted;

      // Encontrar melhor dia
      let bestCompletionRate = 0;
      Object.entries(dailyStats).forEach(([date, day]) => {
        const rate = (day.completed / day.total) * 100;
        if (rate > bestCompletionRate) {
          bestCompletionRate = rate;
          stats.bestDay = new Date(date).toLocaleDateString('pt-BR', {
            weekday: 'long',
          });
        }
      });

      // Calcular sequências
      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;

      const dates = Object.keys(dailyStats).sort();
      dates.forEach((date, index) => {
        const day = dailyStats[date];
        const isComplete = day.completed === day.total;

        if (isComplete) {
          tempStreak++;
          if (tempStreak > bestStreak) {
            bestStreak = tempStreak;
          }
          if (index === dates.length - 1) {
            currentStreak = tempStreak;
          }
        } else {
          if (index === dates.length - 1) {
            currentStreak = 0;
          }
          tempStreak = 0;
        }
      });

      stats.currentStreak = currentStreak;
      stats.bestStreak = bestStreak;

      return stats;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-lg bg-white dark:bg-gray-800/50 p-6 shadow-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Taxa de Conclusão
        </h3>
        <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
          {stats?.completionRate.toFixed(1)}%
        </p>
      </div>

      <div className="rounded-lg bg-white dark:bg-gray-800/50 p-6 shadow-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Melhor Dia
        </h3>
        <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-white capitalize">
          {stats?.bestDay}
        </p>
      </div>

      <div className="rounded-lg bg-white dark:bg-gray-800/50 p-6 shadow-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Total Completado
        </h3>
        <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
          {stats?.totalCompleted}
        </p>
      </div>

      <div className="rounded-lg bg-white dark:bg-gray-800/50 p-6 shadow-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Sequência Atual
        </h3>
        <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
          {stats?.currentStreak} dias
        </p>
      </div>

      <div className="rounded-lg bg-white dark:bg-gray-800/50 p-6 shadow-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Melhor Sequência
        </h3>
        <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
          {stats?.bestStreak} dias
        </p>
      </div>
    </div>
  );
}; 