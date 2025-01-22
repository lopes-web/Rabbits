import React from 'react';
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

  const { data: weeklyData } = useQuery({
    queryKey: ['weeklyProgress'],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);

      const { data: habits } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', user?.id);

      const { data: checks, error } = await supabase
        .from('habit_checks')
        .select('*')
        .eq('user_id', user?.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (error) throw error;

      const totalHabits = habits?.length || 0;

      // Processar dados para formato do gráfico
      const processedData = (checks || []).reduce((acc: { [key: string]: HabitCompletion }, log: HabitLog) => {
        const date = new Date(log.date).toLocaleDateString('pt-BR', { weekday: 'short' });
        if (!acc[date]) {
          acc[date] = { date, completed: 0, total: totalHabits };
        }
        if (log.value > 0) {
          acc[date].completed += 1;
        }
        return acc;
      }, {});

      // Preencher dias sem dados
      const weekDays = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];
      const result = weekDays.map(day => ({
        date: day,
        completed: processedData[day]?.completed || 0,
        total: totalHabits,
      }));

      return result;
    },
  });

  const { data: monthlyData } = useQuery({
    queryKey: ['monthlyProgress'],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      const { data: habits } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', user?.id);

      const { data: checks, error } = await supabase
        .from('habit_checks')
        .select('*')
        .eq('user_id', user?.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (error) throw error;

      const totalHabits = habits?.length || 0;

      // Processar dados para formato do gráfico
      const processedData = (checks || []).reduce((acc: { [key: string]: HabitCompletion }, log: HabitLog) => {
        const date = new Date(log.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (!acc[date]) {
          acc[date] = { date, completed: 0, total: totalHabits };
        }
        if (log.value > 0) {
          acc[date].completed += 1;
        }
        return acc;
      }, {});

      return Object.values(processedData);
    },
  });

  return (
    <div className="space-y-8">
      <div className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
          Progresso Semanal
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 'auto']} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#8884d8"
                name="Hábitos Completados"
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#82ca9d"
                name="Total de Hábitos"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
          Progresso Mensal
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 'auto']} />
              <Tooltip />
              <Bar dataKey="completed" fill="#8884d8" name="Hábitos Completados" />
              <Bar dataKey="total" fill="#82ca9d" name="Total de Hábitos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}; 