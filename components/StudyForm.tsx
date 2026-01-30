import React, { useState, useEffect, useRef } from 'react';
import { StudySession, AppStatus } from '../types';
import { AVAILABLE_CLASSES, ClassItem } from '../constants';
import { CheckCircle2, Circle, AlertCircle, Loader2, BookOpen, ListFilter, BarChart2, X } from 'lucide-react';

interface StudyFormProps {
  onSubmit: (data: StudySession) => void;
  status: AppStatus;
  preFillTopic?: string;
}

export const StudyForm: React.FC<StudyFormProps> = ({ onSubmit, status, preFillTopic }) => {
  // State
  const [topicName, setTopicName] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);

  // New Fields - Default values ensured
  const [details, setDetails] = useState('Primeiro Contato');
  const [difficulty, setDifficulty] = useState('Médio');

  const [isClass, setIsClass] = useState(false);
  const [isQuestions, setIsQuestions] = useState(false);

  // Using strings for inputs to allow empty states easily
  const [totalQuestions, setTotalQuestions] = useState<string>('');
  const [correctQuestions, setCorrectQuestions] = useState<string>('');

  const [filteredClasses, setFilteredClasses] = useState<ClassItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Validation Errors State
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Múltiplos temas (tema composto)
  const [temasCompostos, setTemasCompostos] = useState<ClassItem[]>([]);
  const [modoComposicao, setModoComposicao] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Handle outside click to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Filter topics based on input
  useEffect(() => {
    if (topicName) {
      const filtered = AVAILABLE_CLASSES.filter(c =>
        c.name.toLowerCase().includes(topicName.toLowerCase())
      );
      setFilteredClasses(filtered);
    } else {
      setFilteredClasses(AVAILABLE_CLASSES);
    }
  }, [topicName]);

  // Pre-fill form when clicking from HojeView
  useEffect(() => {
    if (preFillTopic) {
      setTopicName(preFillTopic);
      setDetails('Revisão');

      // Try to find matching class
      const matchingClass = AVAILABLE_CLASSES.find(c => c.name === preFillTopic);
      if (matchingClass) {
        setSelectedClass(matchingClass);
      }
    }
  }, [preFillTopic]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Se está em modo composição, validar que tem pelo menos 2 temas
    if (modoComposicao) {
      if (temasCompostos.length < 2) {
        newErrors.topic = "Adicione pelo menos 2 temas para criar um tema composto.";
      }
    } else {
      // Modo normal: validar que tem um tema selecionado
      if (!topicName.trim()) {
        newErrors.topic = "O tema é obrigatório.";
      }
    }

    if (!details) {
      newErrors.details = "Selecione um detalhe.";
    }

    if (!difficulty) {
      newErrors.difficulty = "Selecione a dificuldade.";
    }

    if (!isClass && !isQuestions) {
      newErrors.activity = "Você deve selecionar 'Assisti Aula', 'Fiz Questões' ou ambos.";
    }

    if (isQuestions) {
      if (!totalQuestions || parseInt(totalQuestions) <= 0) {
        newErrors.totalQuestions = "Informe o total de questões.";
      }
      if (correctQuestions === '' || parseInt(correctQuestions) < 0) {
        newErrors.correctQuestions = "Informe o nº de acertos.";
      }
      
      if (totalQuestions && correctQuestions) {
        const total = parseInt(totalQuestions);
        const correct = parseInt(correctQuestions);
        if (correct > total) {
          newErrors.correctQuestions = "Acertos não podem ser maior que o total.";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Funções para gerenciar temas compostos
  const adicionarTemaAoCompost = () => {
    if (!selectedClass) {
      setErrors({ ...errors, topic: 'Selecione um tema primeiro' });
      return;
    }

    // Verificar se o tema já está na lista
    const jaExiste = temasCompostos.some(t => t.id === selectedClass.id);
    if (jaExiste) {
      setErrors({ ...errors, topic: 'Este tema já está na lista' });
      return;
    }

    // Adicionar tema à lista
    setTemasCompostos([...temasCompostos, selectedClass]);
    setModoComposicao(true);

    // Limpar seleção para permitir adicionar outro
    setTopicName('');
    setSelectedClass(null);
    setShowSuggestions(false);
    setErrors({});
  };

  const removerTemaDoComposto = (temaId: string) => {
    const novosTemasCompostos = temasCompostos.filter(t => t.id !== temaId);
    setTemasCompostos(novosTemasCompostos);

    // Se ficou apenas 1 tema ou nenhum, desabilitar modo composição
    if (novosTemasCompostos.length < 2) {
      setModoComposicao(false);
    }
  };

  const cancelarComposicao = () => {
    setTemasCompostos([]);
    setModoComposicao(false);
    setTopicName('');
    setSelectedClass(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to top or show visual shake could be added here
      return;
    }

    // Se está em modo composição, criar tema composto
    let topicFinal = topicName;
    let topicIdFinal = selectedClass?.id || '';

    if (modoComposicao && temasCompostos.length >= 2) {
      // Criar nome composto juntando os nomes com " + "
      topicFinal = temasCompostos.map((t: ClassItem) => t.name).join(' + ');
      // Criar ID composto (usaremos o primeiro ID + sufixo)
      topicIdFinal = `${temasCompostos[0].id}_composto`;
    } else if (modoComposicao && temasCompostos.length === 1) {
      // Se só tem 1 tema na lista, usar ele
      topicFinal = temasCompostos[0].name;
      topicIdFinal = temasCompostos[0].id;
    }

    const sessionData: StudySession = {
      topicId: topicIdFinal,
      topic: topicFinal,
      details,
      difficulty,
      isClass,
      isQuestions,
      totalQuestions: isQuestions ? parseInt(totalQuestions) : 0,
      correctQuestions: isQuestions ? parseInt(correctQuestions) : 0,
      date: new Date().toLocaleDateString('pt-BR')
    };

    onSubmit(sessionData);

    // Resetar modo composição após submit
    if (modoComposicao) {
      cancelarComposicao();
    }
  };

  const isSubmitting = status === AppStatus.SUBMITTING;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Date Display */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
        <span className="font-medium bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
          📅 Hoje: {new Date().toLocaleDateString('pt-BR')}
        </span>
      </div>

      {/* Topic Input with Autocomplete */}
      <div className="relative" ref={wrapperRef}>
        <label className="block text-sm font-bold text-gray-700 mb-1.5">
          Tema Estudado <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <BookOpen className={`h-5 w-5 ${errors.topic ? 'text-red-400' : 'text-gray-400'}`} />
          </div>
          <input
            type="text"
            value={topicName}
            onChange={(e) => {
              setTopicName(e.target.value);
              const exactMatch = AVAILABLE_CLASSES.find(c => c.name === e.target.value);
              setSelectedClass(exactMatch || null);
              setShowSuggestions(true);
              if (errors.topic) setErrors({...errors, topic: ''});
            }}
            onFocus={() => setShowSuggestions(true)}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none
              ${errors.topic ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            placeholder="Digite para buscar uma aula..."
            disabled={isSubmitting}
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && filteredClasses.length > 0 && (
            <ul className="absolute z-50 w-full bg-white mt-1 border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {filteredClasses.slice(0, 50).map((c) => (
                <li
                  key={c.id}
                  onClick={() => {
                    setTopicName(c.name);
                    setSelectedClass(c);
                    setShowSuggestions(false);
                    if (errors.topic) setErrors({...errors, topic: ''});
                  }}
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-800 text-sm transition-colors border-b border-gray-50 last:border-0"
                >
                  {c.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        {errors.topic && <p className="text-red-500 text-xs mt-1 font-medium">{errors.topic}</p>}

        {/* Botão Adicionar Outro Tema */}
        {!modoComposicao && selectedClass && (
          <button
            type="button"
            onClick={adicionarTemaAoCompost}
            className="mt-2 flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span className="text-lg">+</span>
            Estudar junto com outro tema
          </button>
        )}

        {/* Lista de Temas Compostos */}
        {modoComposicao && temasCompostos.length > 0 && (
          <div className="mt-3 p-4 bg-blue-50 border border-blue-300 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-blue-900">
                📚 Estudando múltiplos temas juntos
              </h4>
              <button
                type="button"
                onClick={cancelarComposicao}
                className="text-xs text-blue-700 hover:text-blue-900 underline"
              >
                Cancelar
              </button>
            </div>

            <div className="space-y-2">
              {temasCompostos.map((tema: ClassItem, idx: number) => (
                <div
                  key={tema.id}
                  className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-800">{tema.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removerTemaDoComposto(tema.id)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded"
                    title="Remover tema"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Input para adicionar mais temas */}
            <div className="pt-2 border-t border-blue-200">
              <p className="text-xs text-blue-700 mb-2 font-medium">
                Adicione mais temas ou clique em Registrar para salvar
              </p>
              {selectedClass && (
                <button
                  type="button"
                  onClick={adicionarTemaAoCompost}
                  className="w-full py-2 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  + Adicionar "{selectedClass.name}"
                </button>
              )}
            </div>

            {/* Preview do nome composto */}
            <div className="pt-2 border-t border-blue-200">
              <p className="text-xs text-blue-600 mb-1">Nome que será registrado:</p>
              <p className="text-sm font-bold text-blue-900 bg-white p-2 rounded border border-blue-200">
                {temasCompostos.map((t: ClassItem) => t.name).join(' + ')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Details and Difficulty Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Detalhes */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <ListFilter className="w-4 h-4 text-gray-500" />
            Detalhes <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              disabled={isSubmitting}
              className="w-full pl-3 pr-8 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none outline-none cursor-pointer text-gray-900 font-medium"
            >
              <option value="Primeiro Contato" className="text-gray-900">Primeiro Contato</option>
              <option value="Revisão" className="text-gray-900">Revisão</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {/* Dificuldade */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-gray-500" />
            Dificuldade <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={isSubmitting}
              className="w-full pl-3 pr-8 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none outline-none cursor-pointer text-gray-900 font-medium"
            >
              <option value="Muito Fácil" className="text-gray-900">Muito Fácil</option>
              <option value="Fácil" className="text-gray-900">Fácil</option>
              <option value="Médio" className="text-gray-900">Médio</option>
              <option value="Dificil" className="text-gray-900">Difícil</option>
              <option value="Hardcore" className="text-gray-900">Hardcore</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Checkboxes - Activity Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700 mb-1">
          Atividades Realizadas <span className="text-red-500">*</span>
        </label>
        
        <div className="grid grid-cols-2 gap-4">
          <label 
            className={`
              relative flex items-center p-4 border rounded-xl cursor-pointer transition-all select-none
              ${isClass ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500 shadow-sm' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}
            `}
          >
            <input 
              type="checkbox" 
              checked={isClass} 
              onChange={(e) => {
                setIsClass(e.target.checked);
                if (errors.activity) setErrors({...errors, activity: ''});
              }}
              className="sr-only"
              disabled={isSubmitting}
            />
            <div className="flex items-center gap-3">
              {isClass ? <CheckCircle2 className="w-6 h-6 text-blue-600" /> : <Circle className="w-6 h-6 text-gray-300" />}
              <span className={`font-medium ${isClass ? 'text-blue-900' : 'text-gray-600'}`}>Assisti Aula</span>
            </div>
          </label>

          <label 
            className={`
              relative flex items-center p-4 border rounded-xl cursor-pointer transition-all select-none
              ${isQuestions ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500 shadow-sm' : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'}
            `}
          >
            <input 
              type="checkbox" 
              checked={isQuestions} 
              onChange={(e) => {
                setIsQuestions(e.target.checked);
                if (errors.activity) setErrors({...errors, activity: ''});
              }}
              className="sr-only"
              disabled={isSubmitting}
            />
            <div className="flex items-center gap-3">
              {isQuestions ? <CheckCircle2 className="w-6 h-6 text-purple-600" /> : <Circle className="w-6 h-6 text-gray-300" />}
              <span className={`font-medium ${isQuestions ? 'text-purple-900' : 'text-gray-600'}`}>Fiz Questões</span>
            </div>
          </label>
        </div>
        {errors.activity && (
          <p className="text-red-500 text-xs font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors.activity}
          </p>
        )}
      </div>

      {/* Conditional Inputs for Questions */}
      {isQuestions && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50/50 rounded-xl border border-purple-100 animate-in slide-in-from-top-2 duration-300">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Total Feito <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={totalQuestions}
              onChange={(e) => {
                setTotalQuestions(e.target.value);
                if (errors.totalQuestions) setErrors({...errors, totalQuestions: ''});
              }}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none
                ${errors.totalQuestions ? 'border-red-500 bg-white' : 'border-gray-300'}`}
              placeholder="0"
              disabled={isSubmitting}
            />
            {errors.totalQuestions && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.totalQuestions}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Total Acertos <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={correctQuestions}
              onChange={(e) => {
                setCorrectQuestions(e.target.value);
                if (errors.correctQuestions) setErrors({...errors, correctQuestions: ''});
              }}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none
                 ${errors.correctQuestions ? 'border-red-500 bg-white' : 'border-gray-300'}`}
              placeholder="0"
              disabled={isSubmitting}
            />
             {errors.correctQuestions && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.correctQuestions}</p>}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`
          w-full py-4 px-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.99] flex justify-center items-center gap-2
          ${isSubmitting
            ? 'bg-gray-400 cursor-not-allowed shadow-none' 
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30'}
        `}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Salvando Registro...
          </>
        ) : (
          "Registrar Sessão"
        )}
      </button>
      
      {/* General Form Error Message if needed */}
      {Object.keys(errors).length > 0 && (
         <p className="text-center text-red-500 text-sm font-medium animate-pulse">
           Por favor, corrija os erros acima antes de enviar.
         </p>
      )}

    </form>
  );
};