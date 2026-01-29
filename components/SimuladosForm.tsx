import React, { useState, useMemo } from 'react';
import { SimuladoSession, AppStatus } from '../types';
import { Loader2, FileText, Hash } from 'lucide-react';

interface SimuladosFormProps {
  onSubmit: (data: SimuladoSession) => void;
  status: AppStatus;
}

interface AreaData {
  questions: string;
  correct: string;
}

export const SimuladosForm: React.FC<SimuladosFormProps> = ({ onSubmit, status }) => {
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estado para cada área
  const [clinica, setClinica] = useState<AreaData>({ questions: '', correct: '' });
  const [cirurgia, setCirurgia] = useState<AreaData>({ questions: '', correct: '' });
  const [preventiva, setPreventiva] = useState<AreaData>({ questions: '', correct: '' });
  const [pediatria, setPediatria] = useState<AreaData>({ questions: '', correct: '' });
  const [ginecologia, setGinecologia] = useState<AreaData>({ questions: '', correct: '' });

  // Calcular totais
  const totals = useMemo(() => {
    const areas = [clinica, cirurgia, preventiva, pediatria, ginecologia];
    let totalQuestions = 0;
    let totalCorrect = 0;

    areas.forEach(area => {
      const q = parseInt(area.questions) || 0;
      const c = parseInt(area.correct) || 0;
      totalQuestions += q;
      totalCorrect += c;
    });

    return { totalQuestions, totalCorrect };
  }, [clinica, cirurgia, preventiva, pediatria, ginecologia]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!description.trim()) {
      newErrors.description = "A descrição do simulado é obrigatória.";
    }

    // Validar cada área
    const areas = [
      { name: 'clinica', data: clinica, label: 'Clínica Médica' },
      { name: 'cirurgia', data: cirurgia, label: 'Cirurgia' },
      { name: 'preventiva', data: preventiva, label: 'Preventiva' },
      { name: 'pediatria', data: pediatria, label: 'Pediatria' },
      { name: 'ginecologia', data: ginecologia, label: 'Ginecologia e Obstetrícia' }
    ];

    areas.forEach(area => {
      const questions = parseInt(area.data.questions) || 0;
      const correct = parseInt(area.data.correct) || 0;

      if (questions > 0 && correct > questions) {
        newErrors[`${area.name}_correct`] = `Acertos não podem ser maiores que o total em ${area.label}.`;
      }

      if (correct > 0 && questions === 0) {
        newErrors[`${area.name}_questions`] = `Informe o total de questões em ${area.label}.`;
      }
    });

    // Validar se há pelo menos uma área preenchida
    if (totals.totalQuestions === 0) {
      newErrors.general = "Você deve preencher ao menos uma área do simulado.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Gerar ID aleatório
    const id = Math.random().toString(36).substring(2, 15);

    const sessionData: SimuladoSession = {
      id,
      description,
      totalQuestionsGeneral: totals.totalQuestions,
      clinicaQuestions: parseInt(clinica.questions) || 0,
      clinicaCorrect: parseInt(clinica.correct) || 0,
      cirurgiaQuestions: parseInt(cirurgia.questions) || 0,
      cirurgiaCorrect: parseInt(cirurgia.correct) || 0,
      preventivaQuestions: parseInt(preventiva.questions) || 0,
      preventivaCorrect: parseInt(preventiva.correct) || 0,
      pediatriaQuestions: parseInt(pediatria.questions) || 0,
      pediatriaCorrect: parseInt(pediatria.correct) || 0,
      ginecologiaQuestions: parseInt(ginecologia.questions) || 0,
      ginecologiaCorrect: parseInt(ginecologia.correct) || 0,
      date: new Date().toLocaleDateString('pt-BR')
    };

    onSubmit(sessionData);
  };

  const isSubmitting = status === AppStatus.SUBMITTING;

  const renderAreaInputs = (
    label: string,
    areaData: AreaData,
    setAreaData: React.Dispatch<React.SetStateAction<AreaData>>,
    areaName: string
  ) => (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
      <h4 className="text-sm font-bold text-gray-700 mb-3">{label}</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Questões
          </label>
          <input
            type="number"
            min="0"
            value={areaData.questions}
            onChange={(e) => {
              setAreaData({ ...areaData, questions: e.target.value });
              if (errors[`${areaName}_questions`]) {
                const newErrors = { ...errors };
                delete newErrors[`${areaName}_questions`];
                setErrors(newErrors);
              }
            }}
            className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm
              ${errors[`${areaName}_questions`] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            placeholder="0"
            disabled={isSubmitting}
          />
          {errors[`${areaName}_questions`] && (
            <p className="text-red-500 text-[10px] mt-1 font-medium">{errors[`${areaName}_questions`]}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Acertos
          </label>
          <input
            type="number"
            min="0"
            value={areaData.correct}
            onChange={(e) => {
              setAreaData({ ...areaData, correct: e.target.value });
              if (errors[`${areaName}_correct`]) {
                const newErrors = { ...errors };
                delete newErrors[`${areaName}_correct`];
                setErrors(newErrors);
              }
            }}
            className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm
              ${errors[`${areaName}_correct`] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            placeholder="0"
            disabled={isSubmitting}
          />
          {errors[`${areaName}_correct`] && (
            <p className="text-red-500 text-[10px] mt-1 font-medium">{errors[`${areaName}_correct`]}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Date Display */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
        <span className="font-medium bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
          📅 Hoje: {new Date().toLocaleDateString('pt-BR')}
        </span>
      </div>

      {/* Descrição do Simulado */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1.5">
          Descrição do Simulado <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FileText className={`h-5 w-5 ${errors.description ? 'text-red-400' : 'text-gray-400'}`} />
          </div>
          <input
            type="text"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) {
                const newErrors = { ...errors };
                delete newErrors.description;
                setErrors(newErrors);
              }
            }}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none
              ${errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            placeholder="Ex: Simulado Revalida 2026 - Prova 1"
            disabled={isSubmitting}
          />
        </div>
        {errors.description && <p className="text-red-500 text-xs mt-1 font-medium">{errors.description}</p>}
      </div>

      {/* Erro geral */}
      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
          {errors.general}
        </div>
      )}

      {/* Áreas */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
          Distribuição por Área
        </h3>

        {renderAreaInputs('Clínica Médica', clinica, setClinica, 'clinica')}
        {renderAreaInputs('Cirurgia', cirurgia, setCirurgia, 'cirurgia')}
        {renderAreaInputs('Preventiva', preventiva, setPreventiva, 'preventiva')}
        {renderAreaInputs('Pediatria', pediatria, setPediatria, 'pediatria')}
        {renderAreaInputs('Ginecologia e Obstetrícia', ginecologia, setGinecologia, 'ginecologia')}
      </div>

      {/* Totais */}
      <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <Hash className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide">
            Totais
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-blue-700 mb-1">
              Total de Questões
            </label>
            <input
              type="text"
              value={totals.totalQuestions}
              readOnly
              className="w-full p-3 border-2 border-blue-300 bg-white rounded-lg font-bold text-blue-900 text-center cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-blue-700 mb-1">
              Total de Acertos
            </label>
            <input
              type="text"
              value={totals.totalCorrect}
              readOnly
              className="w-full p-3 border-2 border-green-300 bg-white rounded-lg font-bold text-green-900 text-center cursor-not-allowed"
            />
          </div>
        </div>
        {totals.totalQuestions > 0 && (
          <div className="mt-3 text-center">
            <span className="text-sm font-bold text-gray-700">
              Aproveitamento: {((totals.totalCorrect / totals.totalQuestions) * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`
          w-full py-4 px-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.99] flex justify-center items-center gap-2
          ${isSubmitting
            ? 'bg-gray-400 cursor-not-allowed shadow-none'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-500/30'}
        `}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Salvando Simulado...
          </>
        ) : (
          "Registrar Simulado"
        )}
      </button>

      {/* General Form Error Message */}
      {Object.keys(errors).length > 0 && (
        <p className="text-center text-red-500 text-sm font-medium animate-pulse">
          Por favor, corrija os erros acima antes de enviar.
        </p>
      )}

    </form>
  );
};
