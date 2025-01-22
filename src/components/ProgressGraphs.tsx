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

      console.log('Buscando dados semanais:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
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
    },
    enabled: !!user,
  });

  const { data: monthlyData } = useQuery({
    queryKey: ['monthlyProgress'],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      console.log('Buscando dados mensais:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
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
    },
    enabled: !!user,
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