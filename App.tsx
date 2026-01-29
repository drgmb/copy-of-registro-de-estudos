import React, { useState, useEffect, useMemo } from 'react';
import { StudyForm } from './components/StudyForm';
import { ConfigModal } from './components/ConfigModal';
import { StudySession, AppStatus } from './types';
import { Settings, GraduationCap, AlertCircle } from 'lucide-react';

// Lista exata de arquivos na pasta public/Fotos (47 fotos)
const PHOTO_FILENAMES = [
  "PHOTO-2025-11-14-12-04-55.jpg",
  "PHOTO-2025-11-18-07-19-35.jpg",
  "PHOTO-2025-11-18-13-21-25.jpg",
  "PHOTO-2025-11-21-11-12-39.jpg",
  "PHOTO-2025-11-24-14-48-04.jpg",
  "PHOTO-2025-11-25-18-03-28.jpg",
  "PHOTO-2025-11-28-09-36-55.jpg",
  "PHOTO-2025-11-28-19-53-21.jpg",
  "PHOTO-2025-12-01-14-25-24.jpg",
  "PHOTO-2025-12-02-15-00-03.jpg",
  "PHOTO-2025-12-04-14-24-50.jpg",
  "PHOTO-2025-12-05-08-00-01.jpg",
  "PHOTO-2025-12-05-12-17-39.jpg",
  "PHOTO-2025-12-09-06-52-27.jpg",
  "PHOTO-2025-12-09-09-24-35.jpg",
  "PHOTO-2025-12-11-07-48-45.jpg",
  "PHOTO-2025-12-11-10-28-40.jpg",
  "PHOTO-2025-12-16-06-45-21.jpg",
  "PHOTO-2025-12-16-11-18-37.jpg",
  "PHOTO-2025-12-17-07-14-41.jpg",
  "PHOTO-2025-12-17-11-07-34.jpg",
  "PHOTO-2025-12-18-09-45-10.jpg",
  "PHOTO-2025-12-18-13-07-17.jpg",
  "PHOTO-2025-12-23-08-55-28.jpg",
  "PHOTO-2025-12-29-13-54-39.jpg",
  "PHOTO-2026-01-11-10-50-45 2.jpg",
  "PHOTO-2026-01-11-10-50-45.jpg",
  "PHOTO-2026-01-11-10-50-46 2.jpg",
  "PHOTO-2026-01-11-10-50-46 3.jpg",
  "PHOTO-2026-01-11-10-50-46.jpg",
  "PHOTO-2026-01-11-10-50-47 2.jpg",
  "PHOTO-2026-01-11-10-50-47.jpg",
  "PHOTO-2026-01-16-09-29-32.jpg",
  "PHOTO-2026-01-16-15-50-33.jpg",
  "PHOTO-2026-01-17-16-53-02.jpg",
  "PHOTO-2026-01-18-08-58-17.jpg",
  "PHOTO-2026-01-18-16-53-40.jpg",
  "PHOTO-2026-01-18-19-13-14.jpg",
  "PHOTO-2026-01-25-09-44-44.jpg",
  "PHOTO-2026-01-25-10-51-35.jpg",
  "PHOTO-2026-01-26-11-11-56.jpg",
  "PHOTO-2026-01-27-07-35-46.jpg",
  "PHOTO-2026-01-27-23-08-20.jpg",
  "PHOTO-2026-01-27-23-09-04.jpg",
  "PHOTO-2026-01-28-07-02-56.jpg",
  "PHOTO-2026-01-28-17-21-00.jpg",
  "PHOTO-2026-01-28-17-37-20.jpg"
];

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // State to manage the active image source and fallback status
  const [currentImageSrc, setCurrentImageSrc] = useState<string>('');
  const [isFallbackImage, setIsFallbackImage] = useState(false);

  // Error states
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorCode, setErrorCode] = useState<string>('');

  // Load URL from local storage on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('googleSheetScriptUrl');
    if (savedUrl) {
      setSheetUrl(savedUrl);
    }
  }, []);

  // Data for the success screen
  const successData = useMemo(() => {
    const nicknames = [
      "Gabi", "Gaby", "GabyGatinha", "Nina", "Ninina", 
      "Tichana", "Tichanilds", "Pichel", "Seruezinho", 
      "Mo", "Amor", "Amorzinho", "Mozao"
    ];
    
    // Pick random nickname
    const nickname = nicknames[Math.floor(Math.random() * nicknames.length)];
    
    // Pick random filename
    const randomFileName = PHOTO_FILENAMES[Math.floor(Math.random() * PHOTO_FILENAMES.length)];
    
    // Construct path with URL encoding for spaces
    const encodedFileName = randomFileName.replace(/ /g, '%20');
    // Use absolute path - Vite copies /public/ to /dist/ automatically
    const imagePath = `/Fotos/${encodedFileName}`;

    return { nickname, imagePath };
  }, [status]);

  // Update image source when success state is reached
  useEffect(() => {
    if (status === AppStatus.SUCCESS) {
      setCurrentImageSrc(successData.imagePath);
      setIsFallbackImage(false);
    }
  }, [status, successData]);

  const handleSaveConfig = (url: string) => {
    setSheetUrl(url);
    localStorage.setItem('googleSheetScriptUrl', url);
  };

  const handleSubmit = async (data: StudySession) => {
    setStatus(AppStatus.SUBMITTING);

    if (!sheetUrl) {
      // Demo mode
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.warn("Nenhuma URL de script configurada. Os dados não foram salvos na planilha.");
      setStatus(AppStatus.SUCCESS);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(sheetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Ler resposta JSON
      const result = await response.json();

      if (result.status === 'error') {
        console.error("Backend error:", result);
        setErrorMessage(result.message || 'Erro ao salvar.');
        setErrorCode(result.code || 'UNKNOWN_ERROR');
        setStatus(AppStatus.ERROR);
      } else {
        setStatus(AppStatus.SUCCESS);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn("Request timed out");
        setErrorMessage('Tempo esgotado. Tente novamente.');
        setErrorCode('TIMEOUT');
        setStatus(AppStatus.ERROR);
      } else {
        console.error("Error submitting data:", error);
        setErrorMessage('Erro de conexão. Verifique sua internet.');
        setErrorCode('NETWORK_ERROR');
        setStatus(AppStatus.ERROR);
      }
    }
  };

  const resetForm = () => {
    setStatus(AppStatus.IDLE);
  };

  return (
    // Updated container: reduced padding for small iframe/sidebar support
    <div className="min-h-screen w-full flex flex-col items-center bg-gray-50/50">
      
      <div className="w-full max-w-lg bg-white sm:shadow-lg sm:my-6 sm:rounded-2xl overflow-hidden border-b sm:border border-gray-100 flex-1 sm:flex-none flex flex-col">
        
        {/* Header */}
        <div className="bg-white px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 shadow-sm sm:shadow-none">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-blue-200 shadow-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">Study Tracker</h1>
              <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">Sistema de Revisão</p>
            </div>
          </div>
          <button 
            onClick={() => setIsConfigOpen(true)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
            title="Configurações"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content: Reduced padding on mobile (px-4 vs px-6) */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          {!sheetUrl && status === AppStatus.IDLE && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex flex-col gap-2">
              <p>⚠️ Modo Demonstração.</p>
              <button 
                onClick={() => setIsConfigOpen(true)}
                className="text-amber-900 font-bold underline text-left hover:text-amber-700"
              >
                Conectar Planilha Google
              </button>
            </div>
          )}

          {status === AppStatus.SUCCESS ? (
            <div className="py-8 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300 h-full">
              
              {/* Moldura da Foto */}
              <div className="relative mb-6 group">
                <div className="absolute inset-0 bg-blue-500 rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-xl overflow-hidden relative bg-gray-100 flex items-center justify-center">
                   <img 
                    src={currentImageSrc} 
                    alt="Celebration" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      if (isFallbackImage) return;
                      setIsFallbackImage(true);
                      e.currentTarget.src = `https://placehold.co/400x400/f1f5f9/475569?text=${encodeURIComponent(successData.nickname)}`;
                    }}
                   />
                </div>

                <div className="absolute bottom-2 right-2 bg-green-500 text-white p-1.5 sm:p-2 rounded-full border-4 border-white shadow-sm z-10">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Excelente, {successData.nickname}!</h2>
              
              {isFallbackImage && (
                <p className="text-xs text-amber-600 mb-2 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                  Foto não encontrada.
                </p>
              )}

              <p className="text-gray-500 mb-8 max-w-[240px] text-sm leading-relaxed">
                Dados salvos e revisões agendadas conforme o protocolo.
              </p>
              
              <button
                onClick={resetForm}
                className="w-full py-3 px-6 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 active:scale-95 transform"
              >
                Nova Sessão
              </button>
            </div>
          ) : (
            <StudyForm onSubmit={handleSubmit} status={status} />
          )}

          {status === AppStatus.ERROR && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5" />
                <strong>Erro ao salvar</strong>
              </div>
              <p>{errorMessage}</p>
              {errorCode === 'DUPLICATE_FIRST_ENTRY' && (
                <p className="mt-2 text-xs bg-red-100 p-2 rounded border border-red-200">
                  💡 <strong>Dica:</strong> Mude "Detalhes" para "Revisão" e tente novamente.
                </p>
              )}
              <button
                onClick={() => setStatus(AppStatus.IDLE)}
                className="mt-3 w-full py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfigModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
        currentUrl={sheetUrl}
        onSave={handleSaveConfig}
      />
    </div>
  );
};

export default App;