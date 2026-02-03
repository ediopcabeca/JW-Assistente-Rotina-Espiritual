import React, { useState, useEffect } from 'react';
import { AppView } from './types';
import ScheduleBuilder from './components/ScheduleBuilder';
import MinistryHelper from './components/MinistryHelper';
import BibleReading from './components/BibleReading';
import TranscriptionHelper from './components/TranscriptionHelper';
import StudyQuestionsHelper from './components/StudyQuestionsHelper';
import IllustrationBuilder from './components/IllustrationBuilder';
import LoginScreen from './components/LoginScreen';
import AdminPanel from './components/AdminPanel';
import { syncAdapter } from './services/syncAdapter';
import { getReadingForToday } from './services/bibleData';
import {
  LayoutDashboard,
  CalendarDays,
  Briefcase,
  Book,
  Menu,
  X,
  FileText,
  Sun,
  Moon,
  LogOut,
  User,
  PanelLeftClose,
  PanelLeft,
  Palette,
  BookOpen,
  Search,
  Database
} from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jw_current_session_user');
    }
    return null;
  });

  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [readingData, setReadingData] = useState({ text: '', planDay: 0 });

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      // If saved, use it. If not saved, default to TRUE (dark).
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return true;
    }
    return true;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Sincronização inicial ao carregar o app se estiver logado
  useEffect(() => {
    if (currentUser) {
      syncAdapter.initializeUser();
    }
  }, [currentUser]);

  // Sincronização automática periódica (a cada 5 minutos)
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      syncAdapter.pushUserData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Load daily reading based on current user - PRODUCTION SAFE
  useEffect(() => {
    if (!currentUser) return;

    try {
      const reading = getReadingForToday(currentUser);
      setReadingData({
        text: reading.text || '',
        planDay: reading.planDay || 0
      });
    } catch (error) {
      console.error("Non-fatal error loading reading data:", error);
      // Safe fallback to ensure UI doesn't crash
      setReadingData({ text: '', planDay: 0 });
    }
  }, [currentUser]); // Removed currentView to prevent unnecessary re-runs

  const handleLogin = (userId: string, token?: string) => {
    localStorage.setItem('jw_current_session_user', userId);
    if (token) {
      localStorage.setItem('jw_auth_token', token);
    }
    setCurrentUser(userId);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleLogout = () => {
    localStorage.removeItem('jw_current_session_user');
    localStorage.removeItem('jw_auth_token');
    setCurrentUser(null);
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  // If not logged in, show Login Screen
  if (!currentUser) {
    return (
      <div className={darkMode ? 'dark' : ''}>

        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-yellow-400"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        <LoginScreen onLogin={handleLogin} />
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case AppView.SCHEDULE:
        return <ScheduleBuilder userId={currentUser} />;
      case AppView.MINISTRY:
        return <MinistryHelper />;
      case AppView.BIBLE:
        return <BibleReading userId={currentUser} />;
      case AppView.TRANSCRIPTION:
        return <TranscriptionHelper />;
      case AppView.STUDY_QUESTIONS:
        return <StudyQuestionsHelper />;
      case AppView.ILLUSTRATIONS:
        return <IllustrationBuilder />;
      case AppView.ADMIN:
        return <AdminPanel />;
      case AppView.DASHBOARD:
      default:
        return (
          <div className="max-w-4xl mx-auto p-4 animate-fade-in">
            <header className="mb-10 text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">JW: Assistente Espiritual</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Organize sua rotina, prepare ilustrações poderosas e formate discursos para estudo profundo.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DashboardCard
                title="INSTRUA: Ilustrações e Discursos"
                description="Crie ilustrações memoráveis e prepare seus discursos públicos."
                icon={<Palette size={32} className="text-indigo-600 dark:text-indigo-400" />}
                color="bg-indigo-50 hover:bg-indigo-100 border-indigo-200 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 dark:border-indigo-800"
                className="md:col-span-2 border-2 border-indigo-500 shadow-xl shadow-indigo-500/10"
                onClick={() => setCurrentView(AppView.ILLUSTRATIONS)}
              />
              <DashboardCard
                title="Planejar Semana"
                description="Crie um cronograma de estudo adaptado ao seu tempo."
                icon={<CalendarDays size={32} className="text-blue-600 dark:text-blue-400" />}
                color="bg-blue-50 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800"
                onClick={() => setCurrentView(AppView.SCHEDULE)}
              />
              <DashboardCard
                title="Estudo Profundo"
                description="Gere perguntas parágrafo por parágrafo para publicações."
                icon={
                  <div className="relative flex items-center justify-center">
                    <BookOpen size={30} className="text-purple-600 dark:text-purple-400" />
                    <Search size={14} className="absolute -bottom-0.5 -right-0.5 text-white bg-purple-600 rounded-full p-0.5" />
                  </div>
                }
                color="bg-purple-50 hover:bg-purple-100 border-purple-200 dark:bg-purple-900/20 dark:hover:bg-indigo-900/30 dark:border-purple-800"
                onClick={() => setCurrentView(AppView.STUDY_QUESTIONS)}
              />
              <DashboardCard
                title="Ministério de Campo"
                description="Ideias para revisitas e explicações bíblicas."
                icon={<Briefcase size={32} className="text-orange-600 dark:text-orange-400" />}
                color="bg-orange-50 hover:bg-orange-100 border-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:border-orange-800"
                onClick={() => setCurrentView(AppView.MINISTRY)}
              />
              <DashboardCard
                title="Leitura da Bíblia"
                description={
                  <span className="flex flex-col gap-1">
                    <span>Pontos de meditação e pérolas.</span>
                    {readingData.text && (
                      <span className="font-semibold text-indigo-700 dark:text-indigo-300 text-xs bg-indigo-100 dark:bg-indigo-900/50 py-1 px-2 rounded-md self-start flex items-center gap-1">
                        <span>Dia {readingData.planDay}:</span>
                        <span>{readingData.text}</span>
                      </span>
                    )}
                  </span>
                }
                icon={<Book size={32} className="text-indigo-600 dark:text-indigo-400" />}
                color="bg-indigo-50 hover:bg-indigo-100 border-indigo-200 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 dark:border-indigo-800"
                onClick={() => setCurrentView(AppView.BIBLE)}
              />
              <DashboardCard
                title="NotebookLM Prep"
                description="Transcreva e formate discursos para estudo."
                icon={<FileText size={32} className="text-emerald-600 dark:text-emerald-400" />}
                color="bg-emerald-50 hover:bg-emerald-100 border-emerald-200 shadow-sm ring-1 ring-emerald-300 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 dark:border-emerald-800 dark:ring-emerald-700"
                className="transform hover:scale-[1.02] transition-transform duration-300 md:col-span-2"
                onClick={() => setCurrentView(AppView.TRANSCRIPTION)}
              />
            </div>
          </div>
        );
    }
  };

  const NavItem = ({ view, label, icon, colorClass }: { view: AppView; label: string; icon: React.ReactNode; colorClass?: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center space-x-3 px-4 py-3 w-full rounded-lg transition-colors ${currentView === view
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
    >
      <div className={currentView === view ? 'text-white' : (colorClass || '')}>
        {icon}
      </div>
      <span className="font-medium whitespace-nowrap">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900 transition-colors duration-200">


      {/* Theme Toggle Button (Desktop Only) */}
      <button
        onClick={toggleTheme}
        className="hidden md:block fixed top-4 right-4 z-50 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-yellow-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
        aria-label="Alternar tema"
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-gray-900 p-4 flex justify-between items-center shadow-sm z-20 relative border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          {/* Standardized Logo for Mobile */}
          <span className="w-8 h-8 bg-[#5a3696] rounded-lg flex items-center justify-center text-white font-bold text-xs">JW</span>
          <span className="font-bold text-gray-800 dark:text-white text-lg">Assistente</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            title="Alternar Tema"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Add Logout here for mobile accessibility */}
          <button
            onClick={handleLogout}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600 dark:text-gray-300">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-all duration-300 ease-in-out shadow-2xl
        md:relative md:shadow-none md:z-10 flex flex-col justify-between overflow-hidden
        ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
        ${isDesktopSidebarOpen ? 'md:translate-x-0 md:w-64' : 'md:w-0 md:translate-x-0 md:border-r-0'}
      `}>
        <div className="w-64"> {/* Fixed width container to prevent layout shift of contents during collapse */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Desktop Close Button - Now on the left for better UX */}
              <button
                onClick={() => setIsDesktopSidebarOpen(false)}
                className="hidden md:flex p-1.5 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Recolher Menu"
              >
                <PanelLeftClose size={20} />
              </button>

              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2 truncate">
                    <span className="w-7 h-7 bg-[#5a3696] rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-[10px]">JW</span>
                    <span className="truncate">Assistente</span>
                  </h1>
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 font-black flex-shrink-0 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">v2.0.6</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 dark:bg-gray-900/40 rounded-md border border-gray-100 dark:border-gray-800 w-full overflow-hidden">
                  <User size={12} className="text-gray-400 flex-shrink-0" />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">{currentUser}</span>
                </div>
              </div>
            </div>

            {/* Close button for mobile within drawer */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>
          <nav className="p-4 space-y-2">
            <NavItem view={AppView.DASHBOARD} label="Início" icon={<LayoutDashboard size={20} />} colorClass="text-blue-500" />
            <NavItem view={AppView.ILLUSTRATIONS} label="INSTRUA" icon={<Palette size={20} />} colorClass="text-indigo-500" />
            <NavItem view={AppView.SCHEDULE} label="Cronograma" icon={<CalendarDays size={20} />} colorClass="text-blue-500" />
            <NavItem
              view={AppView.STUDY_QUESTIONS}
              label="Estudo Profundo"
              colorClass="text-purple-500"
              icon={
                <div className="relative flex items-center justify-center">
                  <BookOpen size={20} />
                  <Search size={10} className={`absolute -bottom-0.5 -right-0.5 rounded-full p-[1px] ${currentView === AppView.STUDY_QUESTIONS ? 'bg-white text-blue-600' : 'bg-purple-500 text-white'}`} />
                </div>
              }
            />
            <NavItem view={AppView.MINISTRY} label="Ministério" icon={<Briefcase size={20} />} colorClass="text-orange-500" />
            <NavItem view={AppView.BIBLE} label="Leitura Bíblica" icon={<Book size={20} />} colorClass="text-indigo-500" />
            <NavItem view={AppView.TRANSCRIPTION} label="NotebookLM Prep" icon={<FileText size={20} />} colorClass="text-emerald-500" />
            <NavItem view={AppView.ADMIN} label="Gestão" icon={<Database size={20} />} colorClass="text-slate-500" />
          </nav>
        </div>

        <div className="w-64 p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={async () => {
              try {
                const ok = await syncAdapter.pushUserData();
                if (ok) alert('✅ Dados sincronizados com sucesso!');
              } catch (err: any) {
                if (err.message === 'NO_TOKEN') {
                  alert('💡 Para sincronizar, você precisa sair e entrar novamente usando o botão "Criar Conta" para registrar seu e-mail no servidor.');
                } else if (err.message === 'AUTH_ERROR') {
                  alert('⚠️ Sua sessão expirou. Por favor, saia e entre novamente.');
                } else {
                  alert('❌ Erro de conexão com o servidor. Verifique sua internet ou as configurações do banco de dados na Hostinger.');
                }
              }
            }}
            className="w-full flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg transition-colors text-sm font-medium mb-2"
          >
            <Sun size={16} className={syncAdapter.isAvailable() ? "animate-pulse" : ""} />
            {syncAdapter.isAvailable() ? 'Sincronizar Agora' : 'Ativar Sincronização'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors text-sm font-medium mb-4"
          >
            <LogOut size={16} /> Sair da Conta
          </button>
          <p className="text-xs text-center text-gray-400 dark:text-gray-500">
            Dados sincronizados em nuvem.<br />Sempre consulte as publicações oficiais.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)] md:h-screen p-4 md:p-8 relative">
        {/* Desktop Sidebar Toggle (Open) */}
        {!isDesktopSidebarOpen && (
          <button
            onClick={() => setIsDesktopSidebarOpen(true)}
            className="hidden md:flex absolute top-6 left-6 z-20 p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-transform active:scale-95"
            title="Expandir Menu"
          >
            <PanelLeft size={24} />
          </button>
        )}
        {renderView()}
      </main>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

const DashboardCard = ({ title, description, icon, color, onClick, className }: any) => (
  <div
    onClick={onClick}
    className={`p-6 rounded-xl border transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg cursor-pointer flex items-start gap-4 ${color} ${className || ''}`}
  >
    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{title}</h3>
      <div className="text-gray-600 dark:text-gray-300 text-sm leading-snug">{description}</div>
    </div>
  </div>
);

export default App;