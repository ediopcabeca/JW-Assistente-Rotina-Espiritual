import React, { useState } from 'react';
import { Upload, FileText, Music, CheckCircle, AlertCircle, Loader2, Database } from 'lucide-react';
import { BIBLE_BOOKS, formatChapters } from '../services/bibleData';

interface BatchFile {
    id: string;
    name: string;
    type: 'text' | 'audio';
    content?: string;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
    chapters?: string;
}

const AdminPanel: React.FC = () => {
    const [files, setFiles] = useState<BatchFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileObjectsRef = React.useRef<Record<string, File>>({});

    // Converte nome de arquivo (ex: Genesis_49_Exodo_1_devocional.txt ou Genesis_1_3.txt)
    const parseFileName = (name: string): string => {
        let base = name.split('.')[0];
        // Remover sufixos de descrição
        base = base.replace(/_devocional$/, '').replace(/_devociona$/, '').replace(/_devocion$/, '');

        const parts = base.split('_');
        if (parts.length < 2) return base;

        // Limpeza de nomes de livros (Inglês/Sem acento -> Português)
        const fixBook = (b: string) => {
            b = b.toLowerCase().replace(/-/g, ' ');
            if (b === 'genesis') return 'Gênesis';
            if (b === 'exodo' || b === 'exodus') return 'Êxodo';
            if (b === 'levitico' || b === 'leviticus') return 'Levítico';
            if (b === 'numeros' || b === 'numbers') return 'Números';
            if (b === 'deuteronomio' || b === 'deuteronomy') return 'Deuteronômio';
            if (b === 'josue' || b === 'joshua') return 'Josué';
            if (b === 'juizes' || b === 'judges') return 'Juízes';
            if (b === 'cronicas' || b === 'chronicles') return 'Crônicas';
            // Adicione outros conforme necessário ou capitalize a primeira letra
            return b.charAt(0).toUpperCase() + b.slice(1);
        };

        // Caso 1: Livro_Cap1_Cap2 (ex: Genesis_1_3)
        if (parts.length === 3 && /^\d+$/.test(parts[1]) && /^\d+$/.test(parts[2])) {
            return `${fixBook(parts[0])} ${parts[1]}-${parts[2]}`;
        }

        // Caso 2: Livro1_Cap1_Livro2_Cap2 (ex: Genesis_49_Exodo_1)
        if (parts.length === 4 && /^\d+$/.test(parts[1]) && /^\d+$/.test(parts[3])) {
            return `${fixBook(parts[0])} ${parts[1]} - ${fixBook(parts[2])} ${parts[3]}`;
        }

        // Caso Padrão: Livro_CapFinal
        const book = fixBook(parts[0]);
        const chapters = parts[1];
        return `${book} ${chapters.replace(/-/g, '-')}`;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const newFiles: BatchFile[] = selectedFiles.map(file => {
            const fileId = Math.random().toString(36).substr(2, 9);
            fileObjectsRef.current[fileId] = file;

            const type = (file.name.endsWith('.txt')) ? 'text' : 'audio';
            return {
                id: fileId,
                name: file.name,
                type: type as any,
                status: 'pending',
                chapters: parseFileName(file.name)
            };
        });
        setFiles(prev => [...prev, ...newFiles]);
    };

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                // Remove o prefixo "data:audio/mpeg;base64," se existir
                resolve(result.split(',')[1]);
            };
            reader.onerror = error => reject(error);
        });
    };

    const uploadBatch = async () => {
        setIsProcessing(true);
        const token = localStorage.getItem('jw_auth_token');
        if (!token) {
            alert('Token não encontrado. Faça login novamente.');
            setIsProcessing(false);
            return;
        }

        // Agrupa arquivos por "chapters" (nome base)
        const groups: Record<string, { txt?: File, mp3?: File }> = {};

        files.forEach(f => {
            const fileObj = fileObjectsRef.current[f.id];
            if (!fileObj || !f.chapters) return;

            if (!groups[f.chapters]) groups[f.chapters] = {};
            if (f.type === 'text') groups[f.chapters].txt = fileObj;
            if (f.type === 'audio') groups[f.chapters].mp3 = fileObj;
            if (f.type === 'audio') groups[f.chapters].mp3 = fileObj;
        });

        // Marca todos como 'uploading' inicialmente para feedback visual
        setFiles(prev => prev.map(item => ({ ...item, status: 'uploading' })));

        for (const chapters in groups) {
            const { txt, mp3 } = groups[chapters];
            if (!txt && !mp3) continue;

            try {
                const formData = new FormData();
                formData.append('chapters', chapters);

                if (txt) {
                    formData.append('content', await txt.text());
                }

                if (mp3) {
                    formData.append('audio_file', mp3);
                }

                // Log para depuração
                console.log(`Subindo ${chapters}: TXT=${!!txt}, MP3=${!!mp3}`);

                const res = await fetch('/api/highlights.php', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error('Erro Servidor:', errorText);
                    throw new Error(`Servidor: ${res.status}`);
                }

                const data = await res.json();
                if (data.status === 'success' || data.status === 'updated') {
                    setFiles(prev => prev.map(f => f.chapters === chapters ? { ...f, status: 'success' } : f));
                } else {
                    throw new Error(data.error || 'Erro no processamento');
                }
            } catch (e: any) {
                console.error(`Erro ao subir ${chapters}:`, e);
                setFiles(prev => prev.map(f => f.chapters === chapters ? { ...f, status: 'error', error: e.message } : f));
            }
        }
        setIsProcessing(false);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-8 text-white">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white/10 rounded-xl">
                            <Database size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Gestão de Conteúdo (Lote)</h2>
                            <p className="text-slate-400 text-sm mt-1">Importe pérolas e áudios gerados no AI Studio para o servidor.</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors group relative">
                            <input
                                type="file"
                                id="batch-upload-input"
                                multiple
                                accept=".txt,.mp3,.wav"
                                onChange={handleFileSelect}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <Upload className="mx-auto text-slate-400 group-hover:text-indigo-500 mb-4" size={48} />
                            <h3 className="font-bold text-slate-700 dark:text-slate-200">Selecionar Arquivos</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Arraste seus .txt, .mp3 ou .wav para cá</p>
                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">Ex: Gênesis_1-3.txt</span>
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">Ex: Gênesis_1-3.wav</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-700 dark:text-slate-200">Fila de Importação ({files.length})</h3>
                                {files.length > 0 && (
                                    <button
                                        onClick={() => {
                                            setFiles([]);
                                            fileObjectsRef.current = {};
                                        }}
                                        className="text-xs text-red-500 hover:underline"
                                    >
                                        Limpar Tudo
                                    </button>
                                )}
                            </div>
                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {files.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400 border border-slate-100 dark:border-slate-700 rounded-lg">
                                        Nenhum arquivo na fila.
                                    </div>
                                ) : (
                                    files.map(file => (
                                        <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center space-x-3 overflow-hidden">
                                                {file.type === 'text' ? <FileText size={18} className="text-blue-500" /> : <Music size={18} className="text-purple-500" />}
                                                <div className="overflow-hidden">
                                                    <p className="text-xs font-medium dark:text-slate-200 truncate">{file.name}</p>
                                                    <p className="text-[10px] text-slate-500 italic">Identificado como: {file.chapters}</p>
                                                </div>
                                            </div>
                                            <div className="ml-2">
                                                {file.status === 'uploading' && <Loader2 size={16} className="animate-spin text-indigo-500" />}
                                                {file.status === 'success' && <CheckCircle size={16} className="text-green-500" />}
                                                {file.status === 'error' && (
                                                    <div className="group relative">
                                                        <AlertCircle size={16} className="text-red-500" />
                                                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-red-600 text-white text-[10px] p-2 rounded shadow-lg whitespace-nowrap z-50">
                                                            {file.error}
                                                        </div>
                                                    </div>
                                                )}
                                                {file.status === 'pending' && <div className="w-4 h-4 rounded-full border border-slate-300"></div>}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                        <button
                            onClick={uploadBatch}
                            disabled={isProcessing || files.length === 0}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-500/20"
                        >
                            {isProcessing ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
                            {isProcessing ? 'Enviando para o Banco de Dados...' : 'Iniciar Importação Massiva'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800">
                <h4 className="font-bold text-indigo-900 dark:text-indigo-200 mb-2 flex items-center gap-2">
                    <AlertCircle size={18} /> Instruções Importantes
                </h4>
                <ul className="text-sm text-indigo-800 dark:text-indigo-300 space-y-2 list-disc pl-5">
                    <li>Os arquivos .txt e .wav (ou .mp3) devem ter o **mesmo nome base**.</li>
                    <li>Formatos suportados: **Textos (.txt)** e **Áudios (.mp3 ou .wav)**.</li>
                    <li>Se o áudio estiver corrompido, siga as instruções de reconstrução de cabeçalho no `PROMPT_IA.md`.</li>
                    <li>Os registros existentes no banco serão atualizados automaticamente.</li>
                </ul>
            </div>
        </div>
    );
};

export default AdminPanel;
