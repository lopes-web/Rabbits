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

      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', user?.id)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());

      if (error) throw error;

      // Processar dados para formato do gráfico
      const processedData = data.reduce((acc: { [key: string]: HabitCompletion }, log) => {
        const date = new Date(log.date).toLocaleDateString('pt-BR', { weekday: 'short' });
        if (!acc[date]) {
          acc[date] = { date, completed: 0, total: 0 };
        }
        acc[date].completed += log.completed ? 1 : 0;
        acc[date].total += 1;
        return acc;
      }, {});

      return Object.values(processedData);
    },
  });

  const { data: monthlyData } = useQuery({
    queryKey: ['monthlyProgress'],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', user?.id)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());

      if (error) throw error;

      // Processar dados para formato do gráfico
      const processedData = data.reduce((acc: { [key: string]: HabitCompletion }, log) => {
        const date = new Date(log.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (!acc[date]) {
          acc[date] = { date, completed: 0, total: 0 };
        }
        acc[date].completed += log.completed ? 1 : 0;
        acc[date].total += 1;
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
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
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
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
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