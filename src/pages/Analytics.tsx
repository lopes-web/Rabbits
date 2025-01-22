import React from 'react';
import { ProgressGraphs } from '../components/ProgressGraphs';
import { Statistics } from '../components/Statistics';
import { Achievements } from '../components/Achievements';

export const Analytics = () => {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
        Análise de Progresso
      </h1>

      <div className="space-y-12">
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-gray-800 dark:text-white">
            Estatísticas
          </h2>
          <Statistics />
        </section>

        <section>
          <h2 className="mb-6 text-2xl font-semibold text-gray-800 dark:text-white">
            Gráficos de Progresso
          </h2>
          <ProgressGraphs />
        </section>

        <section>
          <h2 className="mb-6 text-2xl font-semibold text-gray-800 dark:text-white">
            Conquistas
          </h2>
          <Achievements />
        </section>
      </div>
    </div>
  );
}; 