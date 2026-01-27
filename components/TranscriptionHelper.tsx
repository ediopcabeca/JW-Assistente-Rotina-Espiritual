import React, { useState, useRef } from 'react';
import { analyzeDiscourse } from '../services/geminiService';
import { FileText, Mic, StopCircle, Loader2, Copy, Sparkles, FileAudio, Upload, HelpCircle, Video, BookOpen, ClipboardCopy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const TranscriptionHelper: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Prefer standard codecs supported by browsers
      let options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
         if (MediaRecorder.isTypeSupported('audio/mp4')) {
             options = { mimeType: 'audio/mp4' };
         } else {
             // Fallback to default
             options = {} as any;
         }
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        setAudioBlob(blob);
        setFileName('Gravação de Voz');
        setInputText(''); // Clear text input if audio is present
      };

      mediaRecorder.start();
      setIsRecording(true);
      setResult('');
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
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setFileName(file.name);
      setInputText(''); // Clear text input
      setResult('');
    }
  };

  const handleClearAudio = () => {
    setAudioBlob(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data url prefix (e.g. "data:audio/webm;base64,")
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleProcess = async () => {
    if (!inputText && !audioBlob) return;
    setLoading(true);
    setResult('');

    try {
      let response = '';
      if (audioBlob) {
        const base64 = await blobToBase64(audioBlob);
        response = await analyzeDiscourse(base64, true, audioBlob.type);
      } else {
        response = await analyzeDiscourse(inputText, false);
      }
      setResult(response);
    } catch (error) {
      console.error(error);
      setResult("Ocorreu um erro ao processar. Verifique se o arquivo não é muito grande.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <FileText size={28} className="opacity-90" />
            <div>
              <h2 className="text-xl font-bold">Preparar para NotebookLM</h2>
              <p className="text-emerald-100 text-sm">Transcreva e formate discursos para estudo profundo.</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Config Panel for NotebookLM */}
          <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-lg p-5">
            <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Sparkles size={14} /> Painel de Configuração NotebookLM
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              Copie estas diretrizes e cole no campo de "Instruções" (Audio Overview/System) do NotebookLM para garantir que a IA fale como um instrutor.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => handleCopy(MEDITATION_QUESTIONS, 'meditation')}
                className="flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-500 hover:shadow-sm transition-all group h-full"
              >
                <div className="mb-2 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400">
                   {copiedId === 'meditation' ? <Check size={20} /> : <HelpCircle size={20} />}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Perguntas de Estudo</span>
                <span className="text-xs text-gray-400 mt-1">Copiar lista</span>
              </button>

              <button
                onClick={() => handleCopy(AUDIO_GUIDELINE, 'audio')}
                className="flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-500 hover:shadow-sm transition-all group h-full"
              >
                <div className="mb-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                   {copiedId === 'audio' ? <Check size={20} /> : <Mic size={20} />}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Diretriz de Áudio</span>
                <span className="text-xs text-gray-400 mt-1">Para o Podcast</span>
              </button>

              <button
                onClick={() => handleCopy(VIDEO_GUIDELINE, 'video')}
                className="flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-500 hover:shadow-sm transition-all group h-full"
              >
                <div className="mb-2 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                   {copiedId === 'video' ? <Check size={20} /> : <Video size={20} />}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Diretriz de Vídeo</span>
                <span className="text-xs text-gray-400 mt-1">Para Resumo Visual</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                1. Entrada (Áudio ou Texto)
              </label>
              
              <div className="flex flex-col gap-4">
                 {/* Audio Section */}
                <div className={`p-4 rounded-lg border-2 border-dashed transition-colors ${audioBlob ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-emerald-300'}`}>
                    
                    {!audioBlob ? (
                      <div className="space-y-3">
                         <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Mic size={16} /> Áudio (Gravar ou Enviar)
                            </span>
                            {isRecording && <span className="text-xs text-red-500 font-bold animate-pulse">GRAVANDO...</span>}
                         </div>

                         <div className="grid grid-cols-2 gap-3">
                             {/* Record Button */}
                             {!isRecording ? (
                                <button 
                                    onClick={startRecording}
                                    className="py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors font-medium text-xs sm:text-sm"
                                >
                                    <Mic size={20} />
                                    <span>Gravar Agora</span>
                                </button>
                             ) : (
                                <button 
                                    onClick={stopRecording}
                                    className="col-span-2 py-3 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium border border-red-200 dark:border-red-800"
                                >
                                    <StopCircle size={20} /> Parar Gravação
                                </button>
                             )}

                             {/* Upload Button */}
                             {!isRecording && (
                               <button 
                                  onClick={() => fileInputRef.current?.click()}
                                  className="py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors font-medium text-xs sm:text-sm"
                               >
                                  <Upload size={20} />
                                  <span>Enviar Arquivo</span>
                               </button>
                             )}
                         </div>
                         <input 
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="audio/*"
                            onChange={handleFileUpload}
                         />
                      </div>
                    ) : (
                        <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400 overflow-hidden">
                                <FileAudio size={24} className="flex-shrink-0" />
                                <div className="flex flex-col overflow-hidden">
                                  <span className="text-sm font-medium truncate">{fileName || 'Áudio'}</span>
                                  <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Pronto para processar</span>
                                </div>
                            </div>
                            <button onClick={handleClearAudio} className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 underline flex-shrink-0 ml-2">
                                Remover
                            </button>
                        </div>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
                        Suporta gravações rápidas ou envio de MP3/M4A.
                    </p>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">OU</span>
                    </div>
                </div>

                {/* Text Input */}
                <textarea
                    disabled={!!audioBlob}
                    className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm transition-all h-40 ${audioBlob ? 'bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'}`}
                    placeholder="Cole aqui sua transcrição bruta ou anotações..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                />
              </div>

              <button
                onClick={handleProcess}
                disabled={loading || (!inputText && !audioBlob)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Processando e Formatando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    <span>Gerar Formato NotebookLM</span>
                  </>
                )}
              </button>
            </div>

            {/* Output Section */}
            <div className="flex flex-col h-full min-h-[400px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex justify-between items-center">
                <span>2. Resultado Formatado</span>
                {result && (
                  <button 
                    onClick={() => navigator.clipboard.writeText(result)}
                    className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 text-xs flex items-center gap-1 font-medium"
                  >
                    <Copy size={14} /> Copiar Markdown
                  </button>
                )}
              </label>
              
              <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6 overflow-y-auto max-h-[600px]">
                {result ? (
                  <div className="prose prose-emerald prose-sm dark:prose-invert max-w-none text-gray-900 dark:text-gray-200">
                     <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 text-center p-4">
                    <FileText size={48} className="mb-3 opacity-20" />
                    <p className="text-sm">O resultado aparecerá aqui.</p>
                    <p className="text-xs mt-1">Copie o texto final e cole em um arquivo .txt ou PDF para usar no NotebookLM.</p>
                  </div>
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