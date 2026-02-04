import React, { useState, useRef, useEffect } from 'react';
import { analyzeDiscourse } from '../services/geminiService';
import { FileText, Mic, StopCircle, Loader2, Copy, Sparkles, FileAudio, Upload, HelpCircle, Video, BookOpen, ClipboardCopy, Check, Plus, Trash2, List, Play, Pause, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface RecordingSession {
  id: string;
  blob: Blob | null;
  fileName: string;
  textInput?: string; // Para entradas de texto puro
  result?: string;
  status: 'idle' | 'processing' | 'success' | 'error';
  type: 'audio' | 'text';
}

const TranscriptionHelper: React.FC = () => {
  // Batch State
  const [sessions, setSessions] = useState<RecordingSession[]>([]);
  const [isBatchMode, setIsBatchMode] = useState(true); // Default to batch capability

  // Current Input State
  const [inputText, setInputText] = useState('');
  const [currentBlob, setCurrentBlob] = useState<Blob | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // UI State
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);

  // Guidelines Constants
  const MEDITATION_QUESTIONS = `Perguntas para Meditação e Estudo:
1. O que este discurso me ensinou sobre a personalidade e as qualidades de Jeová?
2. Como posso aplicar os princípios bíblicos citados em minha vida familiar e pessoal?
3. Que pontos específicos posso usar para melhorar minha participação no ministério de campo?
4. Como este ensino fortalece minha confiança nas promessas do Reino?`;

  const AUDIO_GUIDELINE = `Atuem como instrutores bíblicos. O tom deve ser encorajador e na 1ª pessoa do plural. É OBRIGATÓRIO citar as referências bíblicas (livro, capítulo e versículo) sempre que explicarem um ponto principal. Não usem tom jornalístico. O objetivo é que o ouvinte saiba exatamente qual texto bíblico apoia cada lição ensinada.`;

  const VIDEO_GUIDELINE = `Ajam como tutores que guiam o estudante pelas pérolas espirituais. Foquem em fixação visual. Cada tópico apresentado deve vir acompanhado da sua respectiva referência bíblica de forma clara. Tratem a Bíblia como a autoridade máxima e evitem linguagem de dúvida como "a fonte afirma".`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Timer Logic
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else {
          options = {} as any;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        setCurrentBlob(blob);
        setCurrentFileName(`Gravação ${new Date().toLocaleTimeString()}`);
        setInputText('');
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Não foi possível acessar o microfone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Suporte a múltiplos arquivos no upload
      Array.from(e.target.files).forEach(file => {
        addToQueue(file, file.name, 'audio');
      });
    }
  };

  const handleClearCurrent = () => {
    setCurrentBlob(null);
    setCurrentFileName(null);
    setInputText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addToQueue = (blobOrNull: Blob | null, name: string, type: 'audio' | 'text', textVal?: string) => {
    const newSession: RecordingSession = {
      id: Math.random().toString(36).substr(2, 9),
      blob: blobOrNull,
      fileName: name,
      textInput: textVal,
      status: 'idle',
      type
    };
    setSessions(prev => [...prev, newSession]);
    handleClearCurrent(); // Limpa área de input
  };

  const removeFromQueue = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const processQueue = async () => {
    setLoading(true);
    const newSessions = [...sessions];

    for (let i = 0; i < newSessions.length; i++) {
      if (newSessions[i].status === 'success') continue; // Pula os já feitos

      newSessions[i].status = 'processing';
      setSessions([...newSessions]); // Atualiza UI

      try {
        let response = '';
        if (newSessions[i].type === 'audio' && newSessions[i].blob) {
          const base64 = await blobToBase64(newSessions[i].blob!);
          response = await analyzeDiscourse(base64, true, newSessions[i].blob!.type);
        } else if (newSessions[i].type === 'text' && newSessions[i].textInput) {
          response = await analyzeDiscourse(newSessions[i].textInput!, false);
        }

        newSessions[i].result = response;
        newSessions[i].status = 'success';
      } catch (error) {
        console.error(error);
        newSessions[i].status = 'error';
        newSessions[i].result = "Erro ao processar item.";
      }
      setSessions([...newSessions]);
    }
    setLoading(false);
  };

  const getConsolidatedMarkdown = () => {
    return sessions
      .filter(s => s.status === 'success' && s.result)
      .map(s => `# Fonte: ${s.fileName}\n\n${s.result}`)
      .join('\n\n---\n\n');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <FileText size={28} className="opacity-90" />
            <div>
              <h2 className="text-xl font-bold">Preparar para NotebookLM (Modo Lote)</h2>
              <p className="text-emerald-100 text-sm">Grave múltiplos discursos ou suba arquivos e gere um resumo unificado.</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">

          {/* Config Panel */}
          <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-lg p-5">
            <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Sparkles size={14} /> Painel de Configuração NotebookLM
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button onClick={() => handleCopy(MEDITATION_QUESTIONS, 'meditation')} className="guideline-btn p-3 bg-white dark:bg-gray-800 rounded-lg border hover:border-emerald-500 text-sm flex flex-col items-center text-center gap-2 transition-all">
                <span className="font-bold text-gray-700 dark:text-gray-200">Perguntas de Estudo</span>
                <span className="text-[10px] text-gray-400">{copiedId === 'meditation' ? 'Copiado!' : 'Copiar'}</span>
              </button>
              <button onClick={() => handleCopy(AUDIO_GUIDELINE, 'audio')} className="guideline-btn p-3 bg-white dark:bg-gray-800 rounded-lg border hover:border-emerald-500 text-sm flex flex-col items-center text-center gap-2 transition-all">
                <span className="font-bold text-gray-700 dark:text-gray-200">Diretriz Áudio</span>
                <span className="text-[10px] text-gray-400">{copiedId === 'audio' ? 'Copiado!' : 'Copiar'}</span>
              </button>
              <button onClick={() => handleCopy(VIDEO_GUIDELINE, 'video')} className="guideline-btn p-3 bg-white dark:bg-gray-800 rounded-lg border hover:border-emerald-500 text-sm flex flex-col items-center text-center gap-2 transition-all">
                <span className="font-bold text-gray-700 dark:text-gray-200">Diretriz Vídeo</span>
                <span className="text-[10px] text-gray-400">{copiedId === 'video' ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Input */}
            <div className="space-y-6">
              <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><Plus size={18} /> Adicionar Novo Item</h3>

              {/* Audio Recorder Area */}
              <div className={`p-6 rounded-xl border-2 border-dashed transition-all ${isRecording ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-gray-600'}`}>
                {!currentBlob ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Gravação de Áudio</span>
                      {isRecording && <span className="text-red-500 font-mono font-bold animate-pulse">{formatTime(recordingTime)}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {!isRecording ? (
                        <button onClick={startRecording} className="py-4 bg-gray-100 dark:bg-gray-700 hover:bg-emerald-500 hover:text-white rounded-lg flex flex-col items-center gap-2 transition-all">
                          <Mic size={24} /> <span className="text-xs font-bold">GRAVAR</span>
                        </button>
                      ) : (
                        <button onClick={stopRecording} className="col-span-2 py-4 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center gap-3 transition-all">
                          <StopCircle size={24} /> <span className="font-bold">PARAR ({formatTime(recordingTime)})</span>
                        </button>
                      )}

                      {!isRecording && (
                        <button onClick={() => fileInputRef.current?.click()} className="py-4 bg-gray-100 dark:bg-gray-700 hover:bg-blue-500 hover:text-white rounded-lg flex flex-col items-center gap-2 transition-all">
                          <Upload size={24} /> <span className="text-xs font-bold">UPLOAD ARQUIVO</span>
                        </button>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" multiple onChange={handleFileUpload} />
                  </div>
                ) : (
                  // Preview of Recorded Clip waiting to be added
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-emerald-200">
                      <FileAudio className="text-emerald-500" />
                      <div className="flex-1 overflow-hidden">
                        <input
                          type="text"
                          value={currentFileName || ''}
                          onChange={(e) => setCurrentFileName(e.target.value)}
                          className="w-full bg-transparent font-medium text-gray-800 dark:text-white outline-none"
                        />
                        <p className="text-xs text-gray-500">Pronto para adicionar à fila</p>
                      </div>
                      <button onClick={handleClearCurrent} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500"><Trash2 size={16} /></button>
                    </div>
                    <button
                      onClick={() => addToQueue(currentBlob, currentFileName || 'Sem nome', 'audio')}
                      className="w-full py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-lg hover:bg-emerald-700"
                    >
                      Adicionar à Fila de Lote
                    </button>
                  </div>
                )}
              </div>

              {/* Manual Text Input */}
              <div className="space-y-2">
                <textarea
                  className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 bg-white h-32 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  placeholder="Ou cole um texto aqui..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                {inputText && (
                  <button
                    onClick={() => addToQueue(null, `Texto Manual ${sessions.length + 1}`, 'text', inputText)}
                    className="w-full py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg font-bold text-sm hover:bg-gray-900"
                  >
                    Adicionar Texto à Fila
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Queue & Process */}
            <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <List size={20} /> Fila de Lote ({sessions.length})
                </h3>
                {sessions.length > 0 && <button onClick={() => setSessions([])} className="text-xs text-red-500 hover:underline">Limpar Tudo</button>}
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px] mb-4 pr-2 custom-scrollbar">
                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <BookOpen size={48} className="mb-2 opacity-20" />
                    <p className="text-sm">Nenhum item adicionado.</p>
                  </div>
                ) : (
                  sessions.map((session, idx) => (
                    <div key={session.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500">{idx + 1}</span>
                          {session.type === 'audio' ? <FileAudio size={16} className="text-blue-500 flex-shrink-0" /> : <FileText size={16} className="text-orange-500 flex-shrink-0" />}
                          <span className="text-sm font-medium truncate max-w-[150px]">{session.fileName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {session.status === 'processing' && <Loader2 size={14} className="animate-spin text-emerald-500" />}
                          {session.status === 'success' && <Check size={14} className="text-green-500" />}
                          {session.status === 'error' && <span className="text-red-500 text-xs">Erro</span>}
                          <button onClick={() => removeFromQueue(session.id)} className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      {session.result && (
                        <div className="mt-2 pl-9">
                          <p className="text-xs text-gray-500 line-clamp-2 italic border-l-2 border-emerald-200 pl-2">{session.result}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={processQueue}
                  disabled={loading || sessions.length === 0}
                  className={`
                        w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-xl
                        ${loading || sessions.length === 0
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border-2 border-dashed border-gray-200 dark:border-gray-700'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white transform hover:scale-[1.02] active:scale-[0.98] shadow-emerald-500/30 ring-4 ring-emerald-500/10'
                    }
                      `}
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} className={sessions.length > 0 ? "animate-pulse" : ""} />}
                  <span className="text-sm sm:text-base uppercase tracking-wide">
                    {loading ? 'Processando Fila...' : sessions.length === 0 ? 'Adicione itens para Gerar' : 'Gerar Resumos (Processar Lote)'}
                  </span>
                </button>

                {sessions.some(s => s.status === 'success') && (
                  <button
                    onClick={() => navigator.clipboard.writeText(getConsolidatedMarkdown())}
                    className="w-full py-3 bg-white dark:bg-gray-800 border-2 border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-500 dark:hover:border-indigo-500 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  >
                    <Copy size={18} /> Copiar Markdown Unificado
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionHelper;
