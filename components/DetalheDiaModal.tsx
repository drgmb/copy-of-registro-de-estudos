import React, { useState, useMemo } from 'react';
import { X, Plus, Calendar, BookOpen, RefreshCw, Trash2, Edit2, Save, Loader2 } from 'lucide-react';

interface RegistroDiario {
  data: string;
  tema: string;
  acao: string;
  semana?: number;
}

interface DetalheDiaModalProps {
  data: Date;
  registrosDiario: RegistroDiario[];
  sheetUrl: string;
  onFechar: () => void;
  onAtualizar: () => void;
}

type TipoRegistro = 'tema' | 'revisao';

interface NovoRegistro {
  tema: string;
  tipo: TipoRegistro;
  data: string;
}

interface EdicaoRegistro {
  original: RegistroDiario;
  novaData: string;
}

export const DetalheDiaModal: React.FC<DetalheDiaModalProps> = ({
  data,
  registrosDiario,
  sheetUrl,
  onFechar,
  onAtualizar,
}) => {
  const [modoAdicionar, setModoAdicionar] = useState(false);
  const [novoTema, setNovoTema] = useState('');
  const [novoTipo, setNovoTipo] = useState<TipoRegistro>('tema');
  const [novaData, setNovaData] = useState(data.toISOString().split('T')[0]);
  const [editando, setEditando] = useState<{ [key: string]: string }>({});
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hoje = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const isPast = data < hoje;
  const podeEditar = !isPast || data.getTime() === hoje.getTime();

  // Filtrar registros para a data selecionada
  const registrosDoDia = useMemo(() => {
    const dataISO = data.toISOString().split('T')[0];
    return registrosDiario.filter((r) => r.data.split('T')[0] === dataISO);
  }, [data, registrosDiario]);

  // Separar em temas e revisões
  const { temas, revisoes } = useMemo(() => {
    const temas: RegistroDiario[] = [];
    const revisoes: RegistroDiario[] = [];

    registrosDoDia.forEach((registro) => {
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
        temas.push(registro);
      } else {
        revisoes.push(registro);
      }
    });

    return { temas, revisoes };
  }, [registrosDoDia]);

  const formatarData = (data: Date): string => {
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];

    const diaSemana = dias[data.getDay()];
    const dia = data.getDate();
    const mes = meses[data.getMonth()];
    const ano = data.getFullYear();

    return `${diaSemana}, ${dia} de ${mes} de ${ano}`;
  };

  const handleAdicionarRegistro = async () => {
    if (!novoTema.trim()) {
      setError('Digite o nome do tema');
      return;
    }

    setSalvando(true);
    setError(null);

    try {
      const formData = new URLSearchParams();
      formData.append('action', 'adicionarRegistroDiario');
      formData.append('tema', novoTema.trim());
      formData.append('acao', novoTipo === 'tema' ? 'Primeira vez' : 'Revisão');
      formData.append('data', novaData);

      const response = await fetch(sheetUrl, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.status === 'success') {
        setNovoTema('');
        setNovaData(data.toISOString().split('T')[0]);
        setModoAdicionar(false);
        onAtualizar();
      } else {
        throw new Error(result.message || 'Erro ao adicionar registro');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  const handleEditarData = (registro: RegistroDiario, key: string) => {
    const novaDataEdit = editando[key];
    if (!novaDataEdit) return;

    // Apenas permitir salvar se a data mudou
    if (novaDataEdit === registro.data.split('T')[0]) {
      delete editando[key];
      setEditando({ ...editando });
      return;
    }

    salvarEdicaoData(registro, novaDataEdit, key);
  };

  const salvarEdicaoData = async (
    registroOriginal: RegistroDiario,
    novaDataValue: string,
    key: string
  ) => {
    setSalvando(true);
    setError(null);

    try {
      const formData = new URLSearchParams();
      formData.append('action', 'editarDataRegistroDiario');
      formData.append('tema', registroOriginal.tema);
      formData.append('acao', registroOriginal.acao);
      formData.append('dataAntiga', registroOriginal.data.split('T')[0]);
      formData.append('dataNova', novaDataValue);

      const response = await fetch(sheetUrl, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.status === 'success') {
        delete editando[key];
        setEditando({ ...editando });
        onAtualizar();
      } else {
        throw new Error(result.message || 'Erro ao editar registro');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar edição');
    } finally {
      setSalvando(false);
    }
  };

  const handleRemoverRegistro = async (registro: RegistroDiario) => {
    if (!confirm(`Remover "${registro.tema}" de ${registro.data.split('T')[0]}?`)) {
      return;
    }

    setSalvando(true);
    setError(null);

    try {
      const formData = new URLSearchParams();
      formData.append('action', 'removerRegistroDiario');
      formData.append('tema', registro.tema);
      formData.append('acao', registro.acao);
      formData.append('data', registro.data.split('T')[0]);

      const response = await fetch(sheetUrl, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.status === 'success') {
        onAtualizar();
      } else {
        throw new Error(result.message || 'Erro ao remover registro');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao remover');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
          <div>
            <h2 className="text-lg font-bold">{formatarData(data)}</h2>
            {isPast && !podeEditar && (
              <p className="text-xs text-indigo-100 mt-1">⚠️ Data passada - apenas visualização</p>
            )}
          </div>
          <button
            onClick={onFechar}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Seção Temas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-gray-800">Temas (Primeira Vez)</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {temas.length}
                </span>
              </div>
            </div>

            {temas.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Nenhum tema programado</p>
            ) : (
              <div className="space-y-2">
                {temas.map((tema, index) => {
                  const key = `tema-${index}`;
                  const estaEditando = key in editando;

                  return (
                    <div
                      key={key}
                      className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{tema.tema}</p>
                        {estaEditando ? (
                          <input
                            type="date"
                            value={editando[key]}
                            onChange={(e) =>
                              setEditando({ ...editando, [key]: e.target.value })
                            }
                            className="mt-1 text-xs border border-purple-300 rounded px-2 py-1"
                          />
                        ) : (
                          <p className="text-xs text-purple-700 mt-1">
                            {tema.data.split('T')[0]}
                          </p>
                        )}
                      </div>

                      {podeEditar && (
                        <div className="flex items-center gap-1">
                          {estaEditando ? (
                            <button
                              onClick={() => handleEditarData(tema, key)}
                              disabled={salvando}
                              className="p-1.5 rounded text-green-600 hover:bg-green-100 transition-colors"
                              title="Salvar"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                setEditando({ ...editando, [key]: tema.data.split('T')[0] })
                              }
                              disabled={salvando}
                              className="p-1.5 rounded text-indigo-600 hover:bg-indigo-100 transition-colors"
                              title="Editar data"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoverRegistro(tema)}
                            disabled={salvando}
                            className="p-1.5 rounded text-red-600 hover:bg-red-100 transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Seção Revisões */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-orange-600" />
                <h3 className="text-sm font-bold text-gray-800">Revisões</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {revisoes.length}
                </span>
              </div>
            </div>

            {revisoes.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Nenhuma revisão programada</p>
            ) : (
              <div className="space-y-2">
                {revisoes.map((revisao, index) => {
                  const key = `revisao-${index}`;
                  const estaEditando = key in editando;

                  return (
                    <div
                      key={key}
                      className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{revisao.tema}</p>
                        {estaEditando ? (
                          <input
                            type="date"
                            value={editando[key]}
                            onChange={(e) =>
                              setEditando({ ...editando, [key]: e.target.value })
                            }
                            className="mt-1 text-xs border border-orange-300 rounded px-2 py-1"
                          />
                        ) : (
                          <p className="text-xs text-orange-700 mt-1">
                            {revisao.data.split('T')[0]}
                          </p>
                        )}
                      </div>

                      {podeEditar && (
                        <div className="flex items-center gap-1">
                          {estaEditando ? (
                            <button
                              onClick={() => handleEditarData(revisao, key)}
                              disabled={salvando}
                              className="p-1.5 rounded text-green-600 hover:bg-green-100 transition-colors"
                              title="Salvar"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                setEditando({
                                  ...editando,
                                  [key]: revisao.data.split('T')[0],
                                })
                              }
                              disabled={salvando}
                              className="p-1.5 rounded text-indigo-600 hover:bg-indigo-100 transition-colors"
                              title="Editar data"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoverRegistro(revisao)}
                            disabled={salvando}
                            className="p-1.5 rounded text-red-600 hover:bg-red-100 transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botão Adicionar */}
          {podeEditar && !modoAdicionar && (
            <button
              onClick={() => setModoAdicionar(true)}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Adicionar Tema ou Revisão
            </button>
          )}

          {/* Formulário de Adicionar */}
          {modoAdicionar && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-bold text-gray-800">Adicionar Registro</h4>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Tipo</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNovoTipo('tema')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      novoTipo === 'tema'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Tema (Primeira Vez)
                  </button>
                  <button
                    onClick={() => setNovoTipo('revisao')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      novoTipo === 'revisao'
                        ? 'bg-orange-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Revisão
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Nome do Tema
                </label>
                <input
                  type="text"
                  value={novoTema}
                  onChange={(e) => setNovoTema(e.target.value)}
                  placeholder="Digite o nome do tema..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Data</label>
                <input
                  type="date"
                  value={novaData}
                  onChange={(e) => setNovaData(e.target.value)}
                  min={hoje.toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAdicionarRegistro}
                  disabled={salvando}
                  className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {salvando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setModoAdicionar(false);
                    setNovoTema('');
                    setError(null);
                  }}
                  disabled={salvando}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onFechar}
            className="py-2 px-6 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
