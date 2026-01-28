import React, { useState, useEffect } from 'react';
import { User, Lock, ArrowRight, Loader2, UserPlus, LogIn, Eye, EyeOff, Users, X, Chrome } from 'lucide-react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

interface LoginScreenProps {
  onLogin: (userId: string, token?: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedUsers, setSavedUsers] = useState<string[]>([]);

  // Client ID do Google Cloud Console retirado do painel Hostinger
  const GOOGLE_CLIENT_ID = "172285702411-fpdidnlddbdr177gc7j8iok6j56ufges.apps.googleusercontent.com";

  useEffect(() => {
    try {
      localStorage.setItem('jw_storage_test', 'test');
      localStorage.removeItem('jw_storage_test');

      const db = localStorage.getItem('jw_users_db');
      if (db) {
        setSavedUsers(Object.keys(JSON.parse(db)));
      }
    } catch (e) {
      setError('⚠️ Seu navegador não está salvando dados. O login pode não funcionar corretamente (Verifique modo anônimo).');
    }
  }, []);

  const validatePassword = (pwd: string) => {
    // 6 a 8 caracteres, números e letras (alfanumérico)
    const regex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,8}$/;
    return regex.test(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim()) {
      setError('Por favor, insira um usuário.');
      setLoading(false);
      return;
    }

    const userId = email.trim().toLowerCase().replace(/\s+/g, '_');

    if (!validatePassword(password)) {
      setError('A senha deve ter de 6 a 8 caracteres e conter letras e números.');
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
          password: password.trim().toLowerCase()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na autenticação');
      }

      if (isRegistering) {
        setIsRegistering(false);
        setError('Conta criada! Agora faça o login.');
        setLoading(false);
        return;
      }

      onLogin(data.user.email, data.token);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao processar login.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError('');
    try {
      const apiHost = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
      const response = await fetch(`${apiHost}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro no login com Google');
      }

      onLogin(data.user.email, data.token);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha no login com Google.');
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

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center text-white relative">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <User size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Bem-vindo</h1>
          <p className="text-blue-100 text-sm">Acesse sua rotina espiritual</p>
        </div>

        {savedUsers.length > 0 && !isRegistering && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide flex items-center gap-1">
              <Users size={12} /> Contas salvas
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
                    title="Remover"
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
              <div className="flex flex-col items-center gap-4 mb-2">
                <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Falha no login com Google')}
                    theme="filled_blue"
                    shape="pill"
                    text="continue_with"
                    width="100%"
                  />
                </GoogleOAuthProvider>
              </div>

              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">ou use seu email</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
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
                  autoComplete="current-password"
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
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg flex items-start gap-2 animate-fade-in">
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
                  <span>{isRegistering ? 'Criar e Entrar' : 'Acessar Rotina'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4 leading-relaxed">
              A senha deve ter 6-8 caracteres (letras e números).<br />
              Seus dados serão salvos com segurança no servidor.
            </p>

          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;