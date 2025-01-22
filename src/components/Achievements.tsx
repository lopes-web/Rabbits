import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: number;
  currentProgress: number;
  isUnlocked: boolean;
}

const ACHIEVEMENTS = [
  {
    id: 'first-habit',
    title: 'Primeiro Passo',
    description: 'Complete seu primeiro hábito',
    icon: '🌱',
    requirement: 1,
  },
  {
    id: 'week-streak',
    title: 'Semana Perfeita',
    description: 'Complete todos os hábitos por 7 dias seguidos',
    icon: '🔥',
    requirement: 7,
  },
  {
    id: 'month-streak',
    title: 'Mestre da Consistência',
    description: 'Complete todos os hábitos por 30 dias seguidos',
    icon: '👑',
    requirement: 30,
  },
  {
    id: 'fifty-completions',
    title: 'Meio Centenário',
    description: 'Complete 50 hábitos no total',
    icon: '🎯',
    requirement: 50,
  },
  {
    id: 'hundred-completions',
    title: 'Centenário',
    description: 'Complete 100 hábitos no total',
    icon: '🏆',
    requirement: 100,
  },
];

export const Achievements = () => {
  const { user } = useAuth();

  const { data: achievements, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from('habit_checks')
        .select('*')
        .eq('user_id', user?.id)
        .gt('value', 0);

      if (error) throw error;

      // Calcular progresso das conquistas
      const totalCompleted = logs?.length || 0;
      
      // Calcular maior sequência
      const dateMap = new Map<string, number>();
      logs?.forEach((log) => {
        const date = new Date(log.date).toISOString().split('T')[0];
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
      });

      const dates = Array.from(dateMap.keys()).sort();
      let currentStreak = 0;
      let maxStreak = 0;
      let tempStreak = 0;

      dates.forEach((date, index) => {
        if (dateMap.get(date)! > 0) {
          tempStreak++;
          if (tempStreak > maxStreak) {
            maxStreak = tempStreak;
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

      return ACHIEVEMENTS.map((achievement): Achievement => {
        let currentProgress = 0;
        let isUnlocked = false;

        switch (achievement.id) {
          case 'first-habit':
            currentProgress = Math.min(totalCompleted, 1);
            isUnlocked = totalCompleted >= 1;
            break;
          case 'week-streak':
            currentProgress = Math.min(maxStreak, 7);
            isUnlocked = maxStreak >= 7;
            break;
          case 'month-streak':
            currentProgress = Math.min(maxStreak, 30);
            isUnlocked = maxStreak >= 30;
            break;
          case 'fifty-completions':
            currentProgress = Math.min(totalCompleted, 50);
            isUnlocked = totalCompleted >= 50;
            break;
          case 'hundred-completions':
            currentProgress = Math.min(totalCompleted, 100);
            isUnlocked = totalCompleted >= 100;
            break;
        }

        return {
          ...achievement,
          currentProgress,
          isUnlocked,
        };
      });
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
      {achievements?.map((achievement) => (
        <div
          key={achievement.id}
          className={`relative overflow-hidden rounded-lg p-6 shadow-md transition-all duration-300 ${
            achievement.isUnlocked
              ? 'bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-900 dark:to-gray-800'
              : 'bg-white dark:bg-gray-800'
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-4xl">{achievement.icon}</span>
            {achievement.isUnlocked && (
              <span className="rounded-full bg-yellow-500 px-2 py-1 text-xs font-semibold text-white">
                Desbloqueado!
              </span>
            )}
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            {achievement.title}
          </h3>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
            {achievement.description}
          </p>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Progresso</span>
              <span>
                {achievement.currentProgress}/{achievement.requirement}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  achievement.isUnlocked
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
                }`}
                style={{
                  width: `${(achievement.currentProgress / achievement.requirement) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 