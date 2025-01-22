import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Habit, HabitCheck, deleteHabit } from "@/services/habits";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ActivityCalendar } from "react-activity-calendar";

interface HabitDetailsProps {
  habit: Habit;
  checks: HabitCheck[];
}

export function HabitDetails({ habit, checks }: HabitDetailsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => deleteHabit(habit.id, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Hábito excluído com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir hábito");
    },
  });

  const handleDelete = async () => {
    if (!user) return;
    if (window.confirm("Tem certeza que deseja excluir este hábito?")) {
      await mutation.mutateAsync();
    }
  };

  // Prepara os dados para o calendário
  const currentYear = new Date().getFullYear();
  const calendarData = Array.from({ length: 365 }, (_, i) => {
    const date = new Date(currentYear, 0, i + 1);
    const formattedDate = format(date, "yyyy-MM-dd");
    const check = checks.find((check) => check.date === formattedDate);
    return {
      date: formattedDate,
      count: check?.value || 0,
      level: check?.value > 0 ? 1 : 0,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{habit.name}</h2>
        <Button variant="destructive" onClick={handleDelete}>
          Excluir
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total de dias</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {checks.filter((check) => check.value > 0).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sequência atual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {(() => {
                let streak = 0;
                const today = new Date();
                const sortedChecks = [...checks].sort(
                  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                );

                for (const check of sortedChecks) {
                  const checkDate = new Date(check.date);
                  const diff = Math.floor(
                    (today.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24)
                  );

                  if (diff === streak && check.value > 0) {
                    streak++;
                  } else {
                    break;
                  }
                }

                return streak;
              })()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maior sequência</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {(() => {
                let maxStreak = 0;
                let currentStreak = 0;
                const sortedChecks = [...checks].sort(
                  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                );

                for (let i = 0; i < sortedChecks.length; i++) {
                  if (sortedChecks[i].value > 0) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                  } else {
                    currentStreak = 0;
                  }
                }

                return maxStreak;
              })()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent hover:scrollbar-thumb-muted/80 transition-colors">
            <div className="min-w-[800px] p-2">
              <ActivityCalendar
                data={calendarData}
                blockSize={12}
                blockMargin={4}
                hideColorLegend={false}
                hideTotalCount={true}
                showWeekdayLabels={true}
                weekStart={0}
                maxLevel={1}
                theme={{
                  light: ["#1f1f1f", habit.color],
                }}
                labels={{
                  months: [
                    "Janeiro",
                    "Fevereiro",
                    "Março",
                    "Abril",
                    "Maio",
                    "Junho",
                    "Julho",
                    "Agosto",
                    "Setembro",
                    "Outubro",
                    "Novembro",
                    "Dezembro",
                  ],
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 