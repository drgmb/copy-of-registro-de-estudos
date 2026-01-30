import React, { useState, useEffect, useMemo } from 'react';
import { CalendarioMensal } from './CalendarioMensal';
import { DetalheDiaModal } from './DetalheDiaModal';
import { Loader2, AlertCircle } from 'lucide-react';

interface RegistroDiario {
  data: string; // ISO date
  tema: string;
  acao: string; // "Primeira vez" ou "Revisão"
  semana?: number;
}

interface PlanejamentoViewProps {
  sheetUrl: string;
}

export const PlanejamentoView: React.FC<PlanejamentoViewProps> = ({ sheetUrl }) => {
  // Mês atual (navegável, mas limitado a 2026)
  const [mesAtual, setMesAtual] = useState(() => {
    const agora = new Date();
    // Se estamos em 2026, usar o mês atual, senão usar Janeiro 2026
    if (agora.getFullYear() === 2026) {
      return new Date(2026, agora.getMonth(), 1);
    }
    return new Date(2026, 0, 1); // Janeiro 2026
  });

  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  const [registrosDiario, setRegistrosDiario] = useState<RegistroDiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data de início do cronograma: 25 de Janeiro 2026 (início da Semana 1)
  const dataInicioCronograma = useMemo(() => {
    const inicioS1 = new Date(2026, 0, 25); // 25 de Janeiro de 2026
    inicioS1.setHours(0, 0, 0, 0);
    return inicioS1;
  }, []);

  // Fetch data from DIÁRIO
  useEffect(() => {
    if (!sheetUrl) {
      setLoading(false);
      return;
    }

    const fetchDiario = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${sheetUrl}?action=getDiario`, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Erro ao buscar dados do DIÁRIO');
        }

        const data = await response.json();

        // Aceitar tanto 'diario' quanto 'data' para compatibilidade
        const registros = data.diario || data.data;

        if (data.status === 'success' && Array.isArray(registros)) {
          setRegistrosDiario(registros);
        } else {
          throw new Error(data.message || 'Formato de resposta inválido');
        }
      } catch (err: any) {
        console.error('Erro ao buscar DIÁRIO:', err);
        setError(err.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchDiario();
  }, [sheetUrl]);

  // Processar registros para contar atividades por dia
  const diasComAtividades = useMemo(() => {
    const map: { [dataISO: string]: { temas: number; revisoes: number } } = {};

    registrosDiario.forEach((registro) => {
      const dataISO = registro.data.split('T')[0]; // Garantir formato YYYY-MM-DD

      if (!map[dataISO]) {
        map[dataISO] = { temas: 0, revisoes: 0 };
      }

      // Normalizar ação
      const acaoNormalizada = registro.acao
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

      if (
        acaoNormalizada.includes('primeira') ||
        acaoNormalizada.includes('primeiro') ||
        acaoNormalizada === '1'
      ) {
        map[dataISO].temas += 1;
      } else if (acaoNormalizada.includes('revisao') || acaoNormalizada.includes('revis')) {
        map[dataISO].revisoes += 1;
      }
    });

    return map;
  }, [registrosDiario]);

  const handleDiaClick = (data: Date) => {
    setDiaSelecionado(data);
  };

  const handleFecharModal = () => {
    setDiaSelecionado(null);
  };

  const handleAtualizarDiario = () => {
    // Recarregar dados do DIÁRIO após uma atualização
    if (sheetUrl) {
      const fetchDiario = async () => {
        try {
          const response = await fetch(`${sheetUrl}?action=getDiario`, {
            method: 'GET',
          });

          if (!response.ok) return;

          const data = await response.json();

          // Aceitar tanto 'diario' quanto 'data' para compatibilidade
          const registros = data.diario || data.data;

          if (data.status === 'success' && Array.isArray(registros)) {
            setRegistrosDiario(registros);
          }
        } catch (err) {
          console.error('Erro ao recarregar DIÁRIO:', err);
        }
      };

      fetchDiario();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
        <p className="text-sm font-medium">Carregando planejamento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertCircle className="w-5 h-5" />
            <strong>Erro ao carregar</strong>
          </div>
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 w-full py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!sheetUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <AlertCircle className="w-12 h-12 mb-4 text-amber-500" />
        <p className="text-sm font-medium mb-2">Planilha não configurada</p>
        <p className="text-xs text-gray-400 text-center max-w-xs">
          Configure a URL da planilha Google para usar o planejamento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Informações sobre o planejamento */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h3 className="text-sm font-bold text-indigo-900 mb-1">
          📅 Planejamento de Estudos
        </h3>
        <p className="text-xs text-indigo-700">
          Visualize e gerencie seus temas e revisões programados. Clique em um dia para ver detalhes e
          fazer alterações.
        </p>
        <p className="text-xs text-indigo-600 mt-2">
          <strong>Atenção:</strong> Apenas dias atuais e futuros podem ser editados.
        </p>
      </div>

      {/* Calendário */}
      <CalendarioMensal
        mesAtual={mesAtual}
        onDiaClick={handleDiaClick}
        diasComAtividades={diasComAtividades}
        dataInicioCronograma={dataInicioCronograma}
      />

      {/* Modal de detalhes do dia */}
      {diaSelecionado && (
        <DetalheDiaModal
          data={diaSelecionado}
          registrosDiario={registrosDiario}
          sheetUrl={sheetUrl}
          onFechar={handleFecharModal}
          onAtualizar={handleAtualizarDiario}
        />
      )}
    </div>
  );
};
