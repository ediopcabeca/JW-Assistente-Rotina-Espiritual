import React, { useState, useEffect } from 'react';
import { generateBibleHighlights } from '../services/geminiService';
import {
  getReadingForToday,
  markChapterAsRead,
  isReadingDone,
  getProgressPercentage,
  getStartDateRaw,
  setStartDate as saveStartDate,
  hasStartDateSet,
  BIBLE_BOOKS,
  getReadChapters
} from '../services/bibleData';
import { BookOpen, Sparkles, Loader2, CheckSquare, Square, Settings, ChevronUp, Book } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface BibleReadingProps {
  userId?: string;
}

const BibleReading: React.FC<BibleReadingProps> = ({ userId }) => {
  const [loading, setLoading] = useState(false);
  const [highlights, setHighlights] = useState('');

  const [showConfig, setShowConfig] = useState(false);
  const [startDateInput, setStartDateInput] = useState('');

  const [dailyReading, setDailyReading] = useState(getReadingForToday(userId));
  const [isTodayDone, setIsTodayDone] = useState(false);
  const [progress, setProgress] = useState(0);

  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [readChapters, setReadChapters] = useState<string[]>([]);

  const refreshState = () => {
    const reading = getReadingForToday(userId);
    setDailyReading(reading);
    setIsTodayDone(isReadingDone(reading.chapters, userId));
    setProgress(getProgressPercentage(userId));
    setStartDateInput(getStartDateRaw(userId));
    setShowConfig(!hasStartDateSet(userId));
    setReadChapters(getReadChapters(userId));
  };

  useEffect(() => {
    refreshState();
    setHighlights('');
    setSelectedBook(null);
  }, [userId]);

  const handleGenerate = async (chaptersToUse: string) => {
    if (!chaptersToUse) return;
    setLoading(true);
    const result = await generateBibleHighlights(chaptersToUse);
    setHighlights(result);
    setLoading(false);
  };

  const toggleTodayRead = () => {
    const newState = !isTodayDone;
    dailyReading.chapters.forEach(cap => {
      markChapterAsRead(cap, newState, userId);
    });
    refreshState();
  };

  const toggleSingleChapter = (bookName: string, chapterNum: number) => {
    const chapterId = `${bookName} ${chapterNum}`;
    const isRead = readChapters.includes(chapterId);
    markChapterAsRead(chapterId, !isRead, userId);
    refreshState();
  };

  const handleSaveConfig = () => {
    if (startDateInput) {
      saveStartDate(startDateInput, userId);
      refreshState();
      setShowConfig(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center space-x-3">
              <BookOpen size={28} className="opacity-90" />
              <div>
                <h2 className="text-xl font-bold">Leitura Bíblica</h2>
                <div className={`text-sm font-medium ${dailyReading.isBehind ? 'text-red-200' : 'text-indigo-100'}`}>
                  {hasStartDateSet(userId) ? `Dia ${dailyReading.planDay} (Plano de 1 Ano)` : 'Plano de Leitura'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <button onClick={() => setShowConfig(!showConfig)} className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center gap-2">
                <Settings size={14} /> {showConfig ? 'Fechar' : 'Configurar Início'}
              </button>
              <div className="text-right pl-4 border-l border-indigo-400/30">
                <span className="text-2xl font-bold block">{progress}%</span>
                <p className="text-[10px] text-indigo-200 uppercase">Total Lido</p>
              </div>
            </div>
          </div>
          <div className="mt-6 w-full bg-indigo-900/30 rounded-full h-2.5">
            <div className="bg-white/90 h-2.5 rounded-full transition-all duration-700" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {showConfig && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 border-b border-indigo-100 dark:border-indigo-800">
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-3 flex items-center gap-2"><Settings size={16} /> Data de Início</h3>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <input type="date" value={startDateInput} onChange={(e) => setStartDateInput(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white" />
              <button onClick={handleSaveConfig} className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">Salvar</button>
            </div>
          </div>
        )}

        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2">
                <Sparkles size={16} /> {dailyReading.isBehind ? 'Você deveria estar em:' : 'Próxima Leitura'}
              </h3>
              <p className={`text-2xl font-bold mt-1 ${dailyReading.isBehind ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {dailyReading.text || "Leitura em dia!"}
              </p>
            </div>
            {dailyReading.chapters.length > 0 && (
              <button onClick={toggleTodayRead} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${isTodayDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                {isTodayDone ? <CheckSquare size={20} /> : <Square size={20} />} {isTodayDone ? 'Concluído' : 'Marcar Lido'}
              </button>
            )}
          </div>
          <button onClick={() => handleGenerate(dailyReading.text)} disabled={loading || !dailyReading.text} className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-medium py-2 px-4 rounded-lg flex items-center gap-2 text-sm">
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} Pérolas para Hoje
          </button>
        </div>

        {highlights && (
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-indigo-50/30 dark:bg-indigo-900/10">
            <div className="prose prose-indigo dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-200 mt-6 mb-3" {...props} />,
                  p: ({ node, ...props }) => <p className="text-gray-800 dark:text-gray-100 mb-4 leading-relaxed" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-2 text-gray-800 dark:text-gray-100" {...props} />,
                  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-bold text-indigo-900 dark:text-white" {...props} />,
                }}
              >
                {highlights}
              </ReactMarkdown>
            </div>
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-900/50 p-6">
          <h3 className="text-md font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Book size={18} /> Painel Geral</h3>
          {!selectedBook ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {BIBLE_BOOKS.map((book) => {
                const bookReadCount = readChapters.filter(c => c.startsWith(`${book.name} `)).length;
                const isCompleted = bookReadCount === book.chapters;
                return (
                  <button key={book.name} onClick={() => setSelectedBook(book.name)} className={`p-3 border rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                    <span className={isCompleted ? 'text-green-800' : 'text-gray-700 dark:text-gray-300'}>{book.name}</span>
                    <span className="text-xs text-gray-400">{bookReadCount}/{book.chapters}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <button onClick={() => setSelectedBook(null)} className="mb-4 text-sm text-indigo-600 font-medium flex items-center gap-1 hover:underline">
                <ChevronUp size={16} /> Voltar para lista
              </button>
              <div className="flex items-center justify-between mb-4"><h4 className="text-lg font-bold text-gray-900 dark:text-white">{selectedBook}</h4></div>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {Array.from({ length: BIBLE_BOOKS.find(b => b.name === selectedBook)?.chapters || 0 }, (_, i) => i + 1).map(num => {
                  const isRead = readChapters.includes(`${selectedBook} ${num}`);
                  return (
                    <button key={num} onClick={() => toggleSingleChapter(selectedBook, num)} className={`h-10 w-full rounded-lg font-bold text-sm transition-all ${isRead ? 'bg-green-500 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 text-gray-600 dark:text-gray-400'}`}>
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BibleReading;