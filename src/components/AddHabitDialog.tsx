import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createHabit } from "@/services/habits";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PRESET_COLORS = [
  { name: "Vermelho", value: "#ef4444" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Roxo", value: "#a855f7" },
  { name: "Azul", value: "#3b82f6" },
  { name: "Verde", value: "#22c55e" },
  { name: "Amarelo", value: "#eab308" },
  { name: "Laranja", value: "#f97316" },
];

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  color: z.string().min(1, "Cor é obrigatória"),
  type: z.enum(["daily", "counter"], {
    required_error: "Tipo é obrigatório",
  }),
  recurrence: z.enum(["daily", "weekly", "monthly"], {
    required_error: "Recorrência é obrigatória",
  }),
  target: z.number().min(1, "Meta deve ser maior que 0").optional(),
});

type FormData = z.infer<typeof schema>;

interface AddHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddHabitDialog({ open, onOpenChange }: AddHabitDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      color: PRESET_COLORS[0].value,
      type: "daily",
      recurrence: "daily",
    },
  });

  const habitType = watch("type");

  const mutation = useMutation({
    mutationFn: createHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      onOpenChange(false);
      reset();
      toast.success("Hábito criado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar hábito");
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    await mutation.mutateAsync({
      name: data.name,
      color: data.color,
      type: data.type,
      recurrence: data.recurrence,
      target: data.target,
      user_id: user.id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo hábito</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="grid grid-cols-7 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`h-8 w-8 rounded-full transition-transform ${
                    selectedColor === color.value ? "scale-110 ring-2 ring-offset-2" : ""
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => {
                    setSelectedColor(color.value);
                    setValue("color", color.value);
                  }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <RadioGroup
              value={habitType}
              onValueChange={(value: "daily" | "counter") => setValue("type", value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily">Diário</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="counter" id="counter" />
                <Label htmlFor="counter">Contador</Label>
              </div>
            </RadioGroup>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Recorrência</Label>
            <RadioGroup
              defaultValue="daily"
              onValueChange={(value: "daily" | "weekly" | "monthly") => setValue("recurrence", value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="rec-daily" />
                <Label htmlFor="rec-daily">Diária</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="rec-weekly" />
                <Label htmlFor="rec-weekly">Semanal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="rec-monthly" />
                <Label htmlFor="rec-monthly">Mensal</Label>
              </div>
            </RadioGroup>
            {errors.recurrence && (
              <p className="text-sm text-destructive">{errors.recurrence.message}</p>
            )}
          </div>

          {habitType === "counter" && (
            <div className="space-y-2">
              <Label htmlFor="target">Meta diária</Label>
              <Input
                id="target"
                type="number"
                min={1}
                placeholder="Ex: 8 copos d'água"
                {...register("target", { 
                  valueAsNumber: true,
                  required: "Meta é obrigatória para contador" 
                })}
              />
              {errors.target && (
                <p className="text-sm text-destructive">{errors.target.message}</p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full">
            Criar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}