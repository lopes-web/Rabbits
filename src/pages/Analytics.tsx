import React, { useEffect } from 'react';
import { ProgressGraphs } from '../components/ProgressGraphs';
import { Statistics } from '../components/Statistics';
import { Achievements } from '../components/Achievements';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from "@/components/ThemeToggle";

export const Analytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Analytics montado');
    return () => {
      console.log('Analytics desmontado');
    };
  }, []);

  useEffect(() => {
    if (!user) {
      console.log('Usuário não autenticado, redirecionando...');
      navigate('/login');
      return;
    }
    console.log('Usuário autenticado:', user.id);
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="h-10 w-10 rounded-full hover:bg-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold text-white">
          Análise de Progresso
        </h1>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-gray-100">
            Estatísticas
          </h2>
          <Statistics />
        </section>

        <section>
          <h2 className="mb-6 text-2xl font-semibold text-gray-100">
            Gráficos de Progresso
          </h2>
          <ProgressGraphs />
        </section>

        <section>
          <h2 className="mb-6 text-2xl font-semibold text-gray-100">
            Conquistas
          </h2>
          <Achievements />
        </section>
      </div>
    </div>
  );
}; 