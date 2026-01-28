import React, { useState, useEffect } from 'react';
import { User, Lock, ArrowRight, Loader2, UserPlus, LogIn, Eye, EyeOff, Users, X } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (userId: string, token: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedUsers, setSavedUsers] = useState<string[]>([]);

  useEffect(() => {
    try {
      const db = localStorage.getItem('jw_users_db');
      if (db) {
        setSavedUsers(Object.keys(JSON.parse(db)));
      }
    } catch (e) {
      console.error('Erro ao carregar usuários salvos', e);
    }
  }, [isRegistering]);

  const validatePassword = (pwd: string) => {
    // Regra: 6 a 8 caracteres, alfanumérico
    const regex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,8}$/;
    return regex.test(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.');
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError('A senha deve ter 6-8 caracteres e conter letras e números.');
      setLoading(false);
      return;
    }

    try {
      const apiHost = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';

      const response = await fetch(`${apiHost}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim().toLowerCase() // Normalizamos para evitar erros de case
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na autenticação');
      }

      if (isRegistering) {
        setIsRegistering(false);
        setError('Conta criada com sucesso! Faça login agora.');
        setEmail(email.trim().toLowerCase());
        setPassword('');
      } else {
        // Salva o usuário na lista local de "Contas salvas"
        const db = JSON.parse(localStorage.getItem('jw_users_db') || '{}');
        db[data.user.email] = { savedAt: new Date().toISOString() };
        localStorage.setItem('jw_users_db', JSON.stringify(db));

        onLogin(data.user.email, data.token);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao processar autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: string) => {
    setEmail(user);
    setPassword('');
    setError('');
    setIsRegistering(false);
  };

  const handleRemoveUser = (e: React.MouseEvent, userToRemove: string) => {
    e.stopPropagation();
    if (confirm(`Remover o usuário ${userToRemove} deste dispositivo?`)) {
      try {
        const db = JSON.parse(localStorage.getItem('jw_users_db') || '{}');
        delete db[userToRemove];
        localStorage.setItem('jw_users_db', JSON.stringify(db));
        setSavedUsers(Object.keys(db));
        if (email === userToRemove) setEmail('');
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">

        <div className="bg-[#5a3696] p-8 text-center text-white relative">
          <div className="w-20 h-20 bg-[#5a3696] border-2 border-white/30 rounded-2xl flex flex-col items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden">
            <span className="text-2xl font-black leading-none mt-1">JW</span>
            <span className="text-[8px] font-bold tracking-widest leading-none mb-1">ASSISTENTE</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">Bem-vindo</h1>
          <p className="text-purple-100 text-sm opacity-80">Sincronize sua rotina espiritual</p>
        </div>

        {savedUsers.length > 0 && !isRegistering && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide flex items-center gap-1">
              <Users size={12} /> Contas recomendadas
            </p>
            <div className="flex gap-2 pb-2">
              {savedUsers.map(u => (
                <div
                  key={u}
                  onClick={() => handleSelectUser(u)}
                  className={`
                    relative group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-all
                    ${email === u
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-300'
                    }
                  `}
                >
                  <span className="text-sm font-medium whitespace-nowrap">{u}</span>
                  <button
                    onClick={(e) => handleRemoveUser(e, u)}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-0.5 rounded transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6">
              <button
                type="button"
                onClick={() => { setIsRegistering(false); setError(''); }}
                className={`flex-1 text-sm font-medium py-2 rounded-md transition-all flex items-center justify-center gap-2 ${!isRegistering ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
              >
                <LogIn size={16} /> Entrar
              </button>
              <button
                type="button"
                onClick={() => { setIsRegistering(true); setError(''); }}
                className={`flex-1 text-sm font-medium py-2 rounded-md transition-all flex items-center justify-center gap-2 ${isRegistering ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
              >
                <UserPlus size={16} /> Criar Conta
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className={`text-sm p-3 rounded-lg flex items-start gap-2 animate-fade-in ${error.includes('sucesso') ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
                <div className="mt-0.5"><X size={14} /></div>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-70 shadow-md transform active:scale-[0.98] duration-100"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>{isRegistering ? 'Criar Conta' : 'Acessar Rotina'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4 leading-relaxed">
              Dica: A senha deve ter 6-8 caracteres (letras e números).<br />
              Seus dados agora são salvos com segurança no servidor.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;