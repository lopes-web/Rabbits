import { supabase } from "@/lib/supabase";

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  color: string;
  type: "daily" | "counter";
  recurrence?: string[];
  target?: number;
  created_at: string;
  updated_at: string;
}

export interface HabitCheck {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  value: number;
  created_at: string;
  updated_at: string;
}

// Função para buscar todos os hábitos do usuário
export const fetchHabits = async (userId: string) => {
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Habit[];
};

// Função para buscar checks de um período específico
export const fetchHabitChecks = async (habitId: string, userId: string, startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .from("habit_checks")
    .select("*")
    .eq("habit_id", habitId)
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) throw error;
  return data as HabitCheck[];
};

// Função para criar um novo hábito
export const createHabit = async (habit: Omit<Habit, "id" | "created_at" | "updated_at">) => {
  const { data, error } = await supabase
    .from("habits")
    .insert([habit])
    .select()
    .single();

  if (error) throw error;
  return data as Habit;
};

// Função para atualizar um hábito
export const updateHabit = async (id: string, userId: string, habit: Partial<Omit<Habit, "id" | "user_id" | "created_at" | "updated_at">>) => {
  const { data, error } = await supabase
    .from("habits")
    .update(habit)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as Habit;
};

// Função para deletar um hábito
export const deleteHabit = async (id: string, userId: string) => {
  const { error } = await supabase
    .from("habits")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
};

// Função para upsert um check (criar ou atualizar)
export const upsertHabitCheck = async (check: Omit<HabitCheck, "id" | "created_at" | "updated_at">) => {
  const { data, error } = await supabase
    .from("habit_checks")
    .upsert([check], {
      onConflict: 'habit_id,date'
    })
    .select()
    .single();

  if (error) throw error;
  return data as HabitCheck;
};

// Função para deletar um check
export const deleteHabitCheck = async (habitId: string, date: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { error } = await supabase
    .from("habit_checks")
    .delete()
    .eq("habit_id", habitId)
    .eq("date", date)
    .eq("user_id", user.id);

  if (error) throw error;
}; 