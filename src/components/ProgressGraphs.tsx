import React, { useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface HabitLog {
  date: string;
  value: number;
  habit_id: string;
  user_id: string;
}

interface HabitCompletion {
  date: string;
  completed: number;
  total: number;
}

export const ProgressGraphs = () => {
  const { user } = useAuth();

  useEffect(() => {
    console.log('ProgressGraphs montado');
    return () => {
      console.log('ProgressGraphs desmontado');
    };
  }, []);

  const { data: weeklyData, isLoading: weeklyLoading, error: weeklyError } = useQuery({
    queryKey: ['weeklyProgress', user?.id],
    queryFn: async () => {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);

        console.log('Buscando dados semanais:', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          userId: user?.id,
        });

        const { data: habits, error: habitsError } = await supabase
          .from('habits')
          .select('id')
          .eq('user_id', user?.id);

        if (habitsError) {
          console.error('Erro ao buscar hábitos:', habitsError);
          throw habitsError;
        }

        console.log('Hábitos encontrados:', habits?.length);

        const { data: checks, error: checksError } = await supabase
          .from('habit_checks')
          .select('*')
          .eq('user_id', user?.id)
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0]);

        if (checksError) {
          console.error('Erro ao buscar checks:', checksError);
          throw checksError;
        }

        console.log('Checks encontrados:', checks?.length);

        const totalHabits = habits?.length || 0;

        // Criar um mapa de datas para facilitar o processamento
        const dateMap = new Map<string, { completed: number; total: number }>();
        const weekDays = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];

        // Inicializar todos os dias da semana
        for (let i = 0; i < 7; i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          const weekDay = date.toLocaleDateString('pt-BR', { weekday: 'short' });
          dateMap.set(weekDay, { completed: 0, total: totalHabits });
        }

        // Processar os checks
        checks?.forEach((check: HabitLog) => {
          const date = new Date(check.date);
          const weekDay = date.toLocaleDateString('pt-BR', { weekday: 'short' });
          const dayData = dateMap.get(weekDay);
          if (dayData && check.value > 0) {
            dayData.completed += 1;
          }
        });

        // Converter o mapa em array
        const result = weekDays.map(day => ({
          date: day,
          completed: dateMap.get(day)?.completed || 0,
          total: totalHabits,
        }));

        console.log('Dados processados:', result);

        return result;
      } catch (error) {
        console.error('Erro na query semanal:', error);
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });

  const { data: monthlyData, isLoading: monthlyLoading, error: monthlyError } = useQuery({
    queryKey: ['monthlyProgress', user?.id],
    queryFn: async () => {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);

        console.log('Buscando dados mensais:', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          userId: user?.id,
        });

        const { data: habits, error: habitsError } = await supabase
          .from('habits')
          .select('id')
          .eq('user_id', user?.id);

        if (habitsError) {
          console.error('Erro ao buscar hábitos:', habitsError);
          throw habitsError;
        }

        const { data: checks, error: checksError } = await supabase
          .from('habit_checks')
          .select('*')
          .eq('user_id', user?.id)
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0]);

        if (checksError) {
          console.error('Erro ao buscar checks:', checksError);
          throw checksError;
        }

        const totalHabits = habits?.length || 0;

        // Criar um mapa de datas para facilitar o processamento
        const dateMap = new Map<string, { completed: number; total: number }>();

        // Inicializar todas as datas do período
        for (let i = 0; i < 30; i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          dateMap.set(dateStr, { completed: 0, total: totalHabits });
        }

        // Processar os checks
        checks?.forEach((check: HabitLog) => {
          const date = new Date(check.date);
          const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          const dayData = dateMap.get(dateStr);
          if (dayData && check.value > 0) {
            dayData.completed += 1;
          }
        });

        // Converter o mapa em array
        const result = Array.from(dateMap.entries()).map(([date, data]) => ({
          date,
          completed: data.completed,
          total: data.total,
        }));

        console.log('Dados mensais processados:', result);

        return result;
      } catch (error) {
        console.error('Erro na query mensal:', error);
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });

  if (!user) {
    console.log('ProgressGraphs: usuário não autenticado');
    return null;
  }

  return (
    <div className="space-y-8">
      {weeklyLoading || monthlyLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : weeklyError || monthlyError ? (
        <div className="rounded-lg bg-red-900/50 p-4 text-red-200">
          <p>Erro ao carregar dados dos gráficos.</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg bg-gray-800/50 p-4 shadow-lg backdrop-blur-sm border border-gray-700">
            <h2 className="mb-4 text-xl font-semibold text-white">
              Progresso Semanal
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF' }}
                  />
                  <YAxis 
                    domain={[0, 'auto']} 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '0.375rem',
                      color: '#F3F4F6'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#8B5CF6"
                    name="Hábitos Completados"
                    strokeWidth={2}
                    dot={{ fill: '#8B5CF6', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#8B5CF6' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#10B981"
                    name="Total de Hábitos"
                    strokeWidth={2}
                    dot={{ fill: '#10B981', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#10B981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg bg-gray-800/50 p-4 shadow-lg backdrop-blur-sm border border-gray-700">
            <h2 className="mb-4 text-xl font-semibold text-white">
              Progresso Mensal
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF' }}
                  />
                  <YAxis 
                    domain={[0, 'auto']} 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '0.375rem',
                      color: '#F3F4F6'
                    }}
                  />
                  <Bar 
                    dataKey="completed" 
                    fill="#8B5CF6" 
                    name="Hábitos Completados"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="#10B981" 
                    name="Total de Hábitos"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}; 