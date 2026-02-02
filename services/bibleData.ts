export const BIBLE_BOOKS = [
  { name: "Gênesis", chapters: 50 },
  { name: "Êxodo", chapters: 40 },
  { name: "Levítico", chapters: 27 },
  { name: "Números", chapters: 36 },
  { name: "Deuteronômio", chapters: 34 },
  { name: "Josué", chapters: 24 },
  { name: "Juízes", chapters: 21 },
  { name: "Rute", chapters: 4 },
  { name: "1 Samuel", chapters: 31 },
  { name: "2 Samuel", chapters: 24 },
  { name: "1 Reis", chapters: 22 },
  { name: "2 Reis", chapters: 25 },
  { name: "1 Crônicas", chapters: 29 },
  { name: "2 Crônicas", chapters: 36 },
  { name: "Esdras", chapters: 10 },
  { name: "Neemias", chapters: 13 },
  { name: "Ester", chapters: 10 },
  { name: "Jó", chapters: 42 },
  { name: "Salmos", chapters: 150 },
  { name: "Provérbios", chapters: 31 },
  { name: "Eclesiastes", chapters: 12 },
  { name: "Cântico de Salomão", chapters: 8 },
  { name: "Isaías", chapters: 66 },
  { name: "Jeremias", chapters: 52 },
  { name: "Lamentações", chapters: 5 },
  { name: "Ezequiel", chapters: 48 },
  { name: "Daniel", chapters: 12 },
  { name: "Oseias", chapters: 14 },
  { name: "Joel", chapters: 3 },
  { name: "Amós", chapters: 9 },
  { name: "Obadias", chapters: 1 },
  { name: "Jonas", chapters: 4 },
  { name: "Miqueias", chapters: 7 },
  { name: "Naum", chapters: 3 },
  { name: "Habacuque", chapters: 3 },
  { name: "Sofonias", chapters: 3 },
  { name: "Ageu", chapters: 2 },
  { name: "Zacarias", chapters: 14 },
  { name: "Malaquias", chapters: 4 },
  { name: "Mateus", chapters: 28 },
  { name: "Marcos", chapters: 16 },
  { name: "Lucas", chapters: 24 },
  { name: "João", chapters: 21 },
  { name: "Atos", chapters: 28 },
  { name: "Romanos", chapters: 16 },
  { name: "1 Coríntios", chapters: 16 },
  { name: "2 Coríntios", chapters: 13 },
  { name: "Gálatas", chapters: 6 },
  { name: "Efésios", chapters: 6 },
  { name: "Filipenses", chapters: 4 },
  { name: "Colossenses", chapters: 4 },
  { name: "1 Tessalonicenses", chapters: 5 },
  { name: "2 Tessalonicenses", chapters: 3 },
  { name: "1 Timóteo", chapters: 6 },
  { name: "2 Timóteo", chapters: 4 },
  { name: "Tito", chapters: 3 },
  { name: "Filemom", chapters: 1 },
  { name: "Hebreus", chapters: 13 },
  { name: "Tiago", chapters: 5 },
  { name: "1 Pedro", chapters: 5 },
  { name: "2 Pedro", chapters: 3 },
  { name: "1 João", chapters: 5 },
  { name: "2 João", chapters: 1 },
  { name: "3 João", chapters: 1 },
  { name: "Judas", chapters: 1 },
  { name: "Apocalipse", chapters: 22 }
];

// Flat list of all 1189 chapters for easy calculation
export const ALL_CHAPTERS: string[] = BIBLE_BOOKS.flatMap(book =>
  Array.from({ length: book.chapters }, (_, i) => `${book.name} ${i + 1}`)
);

export const TOTAL_CHAPTERS = ALL_CHAPTERS.length; // 1189
const CHAPTERS_PER_DAY = 1189 / 365; // ~3.25

// --- Configuration Logic ---
const START_DATE_KEY = 'jw_bible_start_date';

// Helper to get user-specific key
const getKey = (baseKey: string, userId?: string) => userId ? `${baseKey}_${userId}` : baseKey;

// --- SAFE WRAPPERS FOR STORAGE ACCESS ---

const safeGetItem = (key: string): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  } catch (e) {
    console.warn("Error accessing localStorage (get):", e);
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn("Error accessing localStorage (set):", e);
  }
};

export const hasStartDateSet = (userId?: string): boolean => {
  return !!safeGetItem(getKey(START_DATE_KEY, userId));
};

export const getStartDateRaw = (userId?: string): string => {
  return safeGetItem(getKey(START_DATE_KEY, userId)) || '';
};

export const getStartDate = (userId?: string): Date => {
  try {
    const stored = getStartDateRaw(userId);
    if (stored) {
      const [y, m, d] = stored.split('-').map(Number);
      return new Date(y, m - 1, d); // Construct local date
    }
    // Default to Jan 1st of current year if not set
    return new Date(new Date().getFullYear(), 0, 1);
  } catch (e) {
    return new Date();
  }
};

export const setStartDate = (dateStr: string, userId?: string) => {
  safeSetItem(getKey(START_DATE_KEY, userId), dateStr);
};

// --- Storage Logic for Progress ---
const STORAGE_KEY = 'jw_bible_progress';

export const getReadChapters = (userId?: string): string[] => {
  try {
    const stored = safeGetItem(getKey(STORAGE_KEY, userId));
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Error parsing read chapters:", e);
    return [];
  }
};

export const markChapterAsRead = (chapter: string, isRead: boolean, userId?: string) => {
  try {
    const current = getReadChapters(userId);
    let updated;
    if (isRead) {
      updated = [...new Set([...current, chapter])];
    } else {
      updated = current.filter(c => c !== chapter);
    }
    safeSetItem(getKey(STORAGE_KEY, userId), JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Error marking chapter:", e);
    return [];
  }
};

export const isReadingDone = (chapters: string[], userId?: string): boolean => {
  try {
    const read = getReadChapters(userId);
    return chapters.length > 0 && chapters.every(c => read.includes(c));
  } catch (e) {
    return false;
  }
};

export const getProgressPercentage = (userId?: string): number => {
  try {
    const readCount = getReadChapters(userId).length;
    return Math.round((readCount / TOTAL_CHAPTERS) * 100);
  } catch (e) {
    return 0;
  }
};

// --- Helper to format ranges ---
export const formatChapters = (chapters: string[]): string => {
  if (chapters.length === 0) return "";
  const groups: Record<string, number[]> = {};
  chapters.forEach(cap => {
    const lastSpace = cap.lastIndexOf(' ');
    const book = cap.substring(0, lastSpace);
    const num = parseInt(cap.substring(lastSpace + 1));
    if (!groups[book]) groups[book] = [];
    groups[book].push(num);
  });

  return Object.entries(groups).map(([book, nums]) => {
    if (nums.length === 1) return `${book} ${nums[0]}`;
    return `${book} ${nums[0]}-${nums[nums.length - 1]}`;
  }).join('; ');
};

const getDayRange = (day: number) => {
  const start = Math.floor((day - 1) * CHAPTERS_PER_DAY);
  const end = Math.min(TOTAL_CHAPTERS, Math.floor(day * CHAPTERS_PER_DAY));
  return { start, end };
};

export const getPlanDayOfChapter = (chapter: string): number => {
  const index = ALL_CHAPTERS.indexOf(chapter);
  if (index === -1) return 1;
  for (let d = 1; d <= 365; d++) {
    const { start, end } = getDayRange(d);
    if (index >= start && index < end) return d;
  }
  return 365;
};

export const getReadingForToday = (userId?: string): {
  text: string;
  chapters: string[];
  planDay: number;
  isBehind: boolean;
  isAhead: boolean;
  idealText: string;
} => {
  try {
    const readChapters = getReadChapters(userId);
    const startDate = getStartDate(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const baseStart = new Date(startDate);
    baseStart.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - baseStart.getTime();
    const elapsedDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    const idealPlanDay = Math.min(365, elapsedDays + 1);

    // Bloco Ideal
    const { start: idealStart, end: idealEnd } = getDayRange(idealPlanDay);
    const idealChapters = ALL_CHAPTERS.slice(idealStart, idealEnd);
    const idealText = formatChapters(idealChapters);

    // Bloco Real
    const firstUnreadIndex = ALL_CHAPTERS.findIndex(c => !readChapters.includes(c));
    const effectiveIndex = firstUnreadIndex === -1 ? TOTAL_CHAPTERS : firstUnreadIndex;

    // Determina qual dia do plano contém o primeiro capítulo não lido
    const effectivePlanDay = firstUnreadIndex === -1 ? 365 : getPlanDayOfChapter(ALL_CHAPTERS[effectiveIndex]);
    const { start: adaptiveStart, end: adaptiveEnd } = getDayRange(effectivePlanDay);

    const adaptiveChapters = ALL_CHAPTERS.slice(adaptiveStart, adaptiveEnd);
    const adaptiveText = formatChapters(adaptiveChapters);

    const isBehind = effectiveIndex < idealStart;
    const isAhead = (effectiveIndex >= idealEnd) || (firstUnreadIndex === -1);

    return {
      text: adaptiveText,
      chapters: adaptiveChapters,
      planDay: idealPlanDay,
      isBehind,
      isAhead,
      idealText
    };
  } catch (e) {
    console.error("Critical error in getReadingForToday:", e);
    return {
      text: "Leitura do Dia",
      chapters: [],
      planDay: 1,
      isBehind: false,
      isAhead: false,
      idealText: ""
    };
  }
};
