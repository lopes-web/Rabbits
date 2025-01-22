import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext.tsx";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-amber-500 hover:text-amber-600" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700 hover:text-slate-900" />
      )}
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
} 