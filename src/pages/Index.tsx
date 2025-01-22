import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { AddHabitDialog } from "@/components/AddHabitDialog";
import { HabitDetails } from "@/components/HabitDetails";
import confetti from "canvas-confetti";
import { Logo } from "@/components/Logo";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchHabits, 
  fetchHabitChecks, 
  createHabit, 
  upsertHabitCheck, 
  deleteHabitCheck,
  type Habit,
  type HabitCheck 
} from "@/services/habits";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Queries
  const { data: habits = [] } = useQuery({
    queryKey: ["habits", user?.id],
    queryFn: () => fetchHabits(user!.id),
    enabled: !!user,
  });

  const { data: habitChecks = [] } = useQuery({
    queryKey: ["habitChecks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const startDate = format(startOfYear(new Date()), "yyyy-MM-dd");
      const endDate = format(endOfYear(new Date()), "yyyy-MM-dd");
      
      // Fetch checks for all habits
      const allChecks = await Promise.all(
        habits.map(habit => 
          fetchHabitChecks(habit.id, user.id, startDate, endDate)
        )
      );
      
      return allChecks.flat();
    },
    enabled: !!user && habits.length > 0,
  });

  // Mutations
  const createHabitMutation = useMutation({
    mutationFn: createHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Hábito criado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar hábito");
    },
  });

  const upsertCheckMutation = useMutation({
    mutationFn: upsertHabitCheck,
    onSuccess: () => {
      console.log('Mutation successful, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ["habitChecks", user?.id] });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast.error("Erro ao atualizar check");
    },
  });

  const deleteCheckMutation = useMutation({
    mutationFn: ({ habitId, date }: { habitId: string; date: string }) => 
      deleteHabitCheck(habitId, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habitChecks"] });
    },
    onError: () => {
      toast.error("Erro ao remover check");
    },
  });

  const getBrazilianDate = () => {
    const date = new Date();
    date.setHours(date.getHours() - 3);
    return date;
  };

  const formatDate = (date: Date) => {
    const brazilianDate = new Date(date.getTime() - 3 * 60 * 60 * 1000);
    return brazilianDate.toISOString().split('T')[0];
  };

  const getWeekDates = () => {
    const today = getBrazilianDate();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today.getTime());
      date.setDate(diff + index);
      return {
        name: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][index],
        date: formatDate(date),
      };
    });
  };

  const days = getWeekDates();

  const isToday = (dateStr: string) => {
    const today = getBrazilianDate();
    const date = new Date(dateStr);
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const getHabitCheckValue = (habitId: string, date: string) => {
    const check = habitChecks.find(
      (check) => check.habit_id === habitId && check.date === date
    );
    return check?.value || 0;
  };

  const triggerConfetti = (color: string) => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: [color, "#ffffff"],
      shapes: ["circle", "star"],
      ticks: 200,
    });
  };

  const handleHabitCheck = async (habitId: string, color: string, date: string) => {
    if (!user) return;

    console.log('Verificando hábito:', { habitId, date });
    
    const existingCheck = habitChecks.find(
      (check) => check.habit_id === habitId && check.date === date
    );
    console.log('Check existente:', existingCheck);
    
    // Alternar entre 0 e 1 baseado no valor atual
    const newValue = existingCheck?.value === 1 ? 0 : 1;
    console.log('Novo valor:', newValue);

    if (newValue === 1) {
      triggerConfetti(color);
    }

    try {
      await upsertCheckMutation.mutateAsync({
        habit_id: habitId,
        user_id: user.id,
        date: date,
        value: newValue,
      });
      console.log('Check atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar check:', error);
    }
  };

  const handleCounterIncrement = async (habitId: string, color: string, date: string, target?: number) => {
    if (!user) return;

    const existingCheck = habitChecks.find(
      (check) => check.habit_id === habitId && check.date === date
    );
    const currentValue = existingCheck?.value || 0;
    const newValue = currentValue + 1;

    if (target && newValue === target) {
      triggerConfetti(color);
    }

    await upsertCheckMutation.mutateAsync({
      habit_id: habitId,
      user_id: user.id,
      date: date,
      value: newValue,
    });
  };

  const handleCounterDecrement = async (habitId: string, date: string) => {
    if (!user) return;

    const existingCheck = habitChecks.find(
      (check) => check.habit_id === habitId && check.date === date
    );
    const currentValue = existingCheck?.value || 0;
    const newValue = Math.max(0, currentValue - 1);

    await upsertCheckMutation.mutateAsync({
      habit_id: habitId,
      user_id: user.id,
      date: date,
      value: newValue,
    });
  };

  const addHabit = (habit: Omit<Habit, "id">) => {
    createHabitMutation.mutate(habit);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <Logo />
        <div className="flex gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            onClick={() => navigate('/analytics')}
            size="sm"
          >
            Análise
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} size="sm">
            Adicionar Hábito
          </Button>
        </div>
      </div>
        <div className="space-y-4">
          {habits.map((habit) => (
            <Card
              key={habit.id}
            className="flex flex-col border-muted bg-card/50 p-4"
          >
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedHabit(selectedHabit === habit.id ? null : habit.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedHabit(selectedHabit === habit.id ? null : habit.id);
                  }
                }}
              >
                <h3 className="text-lg font-medium" style={{ color: habit.color }}>
                  {habit.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>○ {habitChecks.filter(check => check.habit_id === habit.id && check.value > 0).length}</span>
                  <span>⭐ 0</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {days.map(({ name, date }) => (
                  <div key={date} className="text-center">
                    <div className="mb-1 text-xs text-muted-foreground">
                      {name}
                    </div>
                    {habit.type === "counter" ? (
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex h-5 w-5 items-center justify-center rounded-full border border-muted hover:bg-muted/50 p-0 text-xs leading-[0]"
                          onClick={(e) => {
                            e.preventDefault();
                            handleCounterDecrement(habit.id, date);
                          }}
                          disabled={getHabitCheckValue(habit.id, date) === 0}
                          style={{
                            borderColor: habit.color,
                            color: habit.color,
                          }}
                        >
                          -
                        </Button>
                        <span className="min-w-[1.75rem] text-center text-xs" style={{ color: habit.color }}>
                          {getHabitCheckValue(habit.id, date)}/{habit.target || 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex h-5 w-5 items-center justify-center rounded-full border border-muted hover:bg-muted/50 p-0 text-xs leading-[0]"
                          onClick={(e) => {
                            e.preventDefault();
                            handleCounterIncrement(habit.id, habit.color, date, habit.target);
                          }}
                          disabled={getHabitCheckValue(habit.id, date) >= (habit.target || 1)}
                          style={{
                            borderColor: habit.color,
                            color: habit.color,
                          }}
                        >
                          +
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-5 w-5 rounded-full transition-all duration-200 ${
                          getHabitCheckValue(habit.id, date) === 1
                            ? "border-2"
                            : "border"
                        }`}
                        style={{
                          borderColor: habit.color,
                          backgroundColor: getHabitCheckValue(habit.id, date) === 1 ? habit.color : "transparent",
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          console.log('Check clicked for habit:', habit.id, 'date:', date);
                          handleHabitCheck(habit.id, habit.color, date);
                        }}
                      >
                        <span className={`transition-all duration-200 text-xs ${
                          getHabitCheckValue(habit.id, date) === 1
                            ? "text-background scale-125"
                            : `text-muted-foreground hover:text-[${habit.color}]`
                        }`}>
                          ✓
                        </span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedHabit === habit.id && (
              <div className="mt-6 border-t border-muted pt-6 animate-in slide-in-from-top duration-300">
                <HabitDetails habit={habit} checks={habitChecks} />
              </div>
            )}
            </Card>
          ))}

          <Button
            variant="ghost"
            className="w-full border border-dashed border-muted py-8 text-muted-foreground hover:border-primary hover:text-primary"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="mr-2" />
            Add new habit
          </Button>
      </div>

      <AddHabitDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default Index;