import { Profile, Category, WorkLog, ProductivityAnalysis } from './types';

/**
 * Get a local YYYY-MM-DD string representation of a Date object,
 * preventing any UTC-offset timezone issues.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get local yesterday YYYY-MM-DD string.
 */
export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
}

/**
 * Calculates current streak count based on an array of YYYY-MM-DD string dates.
 */
export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  // Deduplicate and sort dates descending (newest first)
  const sorted = Array.from(new Set(dates)).sort().reverse();
  const today = getLocalDateString();
  const yesterday = getYesterdayDateString();

  // If the newest logged date is neither today nor yesterday, streak is broken
  if (sorted[0] !== today && sorted[0] !== yesterday) {
    return 0;
  }

  let currentStreak = 0;
  // Initialize to midnight of newest date
  const expectedDate = new Date(sorted[0]);
  expectedDate.setHours(0, 0, 0, 0);

  for (const dateStr of sorted) {
    const actualDate = new Date(dateStr);
    actualDate.setHours(0, 0, 0, 0);

    if (actualDate.getTime() === expectedDate.getTime()) {
      currentStreak++;
      // Set to previous expected day
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }

  return currentStreak;
}

/**
 * Client-side local check to see if streaks are broken and need resetting to 0.
 * Returns updated profile and updated categories if resets were made, otherwise null.
 */
export function checkAndResetStreaks(
  profile: Profile | null,
  categories: Category[]
): { profileUpdates: Partial<Profile> | null; categoryUpdates: { id: string; streak: number }[] } | null {
  if (!profile) return null;

  const today = getLocalDateString();
  const yesterday = getYesterdayDateString();
  let needsProfileUpdate = false;
  const categoryUpdates: { id: string; streak: number }[] = [];

  // 1. Check Global Streak
  if (
    profile.streak > 0 &&
    profile.last_submit_date &&
    profile.last_submit_date !== today &&
    profile.last_submit_date !== yesterday
  ) {
    needsProfileUpdate = true;
  }

  // 2. Check Categories Streaks
  for (const cat of categories) {
    if (
      cat.streak > 0 &&
      cat.last_submit_date &&
      cat.last_submit_date !== today &&
      cat.last_submit_date !== yesterday
    ) {
      categoryUpdates.push({ id: cat.id, streak: 0 });
    }
  }

  if (needsProfileUpdate || categoryUpdates.length > 0) {
    return {
      profileUpdates: needsProfileUpdate ? { streak: 0 } : null,
      categoryUpdates,
    };
  }

  return null;
}

/**
 * Dynamic Static Productivity Insights (without AI) based on user local data.
 */
export function generateLocalAnalysis(
  profile: Profile | null,
  categories: Category[],
  activities: WorkLog[]
): ProductivityAnalysis {
  if (!profile || activities.length === 0) {
    return {
      summary: 'Belum ada aktivitas yang dicatat. Ayo buat kategori baru dan mulai catat konsistensi harian Anda sekarang!',
      topCategories: [],
      productivityScore: 0,
      suggestions: [
        'Buat kategori baru seperti "Gym" atau "Membaca" di menu Dashboard.',
        'Catat aktivitas pertama Anda hari ini untuk langsung memicu 1-Day streak!',
        'Anda bisa menyalin tautan publik profil Anda untuk dibagikan dengan teman-teman Anda.'
      ],
      streakInfo: { currentStreak: 0, lastLoggedDate: null }
    };
  }

  const todayStr = getLocalDateString();
  const yesterdayStr = getYesterdayDateString();
  
  // 1. Check if logged today
  const hasLoggedToday = activities.some(act => act.date_str === todayStr);

  // 2. Generate custom summary & warnings
  let summary = '';
  const suggestions: string[] = [];

  if (profile.streak > 0) {
    if (hasLoggedToday) {
      summary = `Konsistensi luar biasa! Streak global ${profile.streak} hari Anda aman dan aktif untuk hari ini.`;
      suggestions.push('Anda sudah mengamankan streak harian Anda hari ini! Kerja bagus.');
      suggestions.push('Istirahatlah dengan cukup, dan bersiaplah untuk melanjutkannya besok.');
    } else {
      summary = `Aduh! Streak global ${profile.streak} hari Anda terancam putus! Anda belum mencatat aktivitas apa pun hari ini.`;
      suggestions.push('Catat aktivitas cepat sekarang di kategori mana saja untuk menyelamatkan streak harian Anda!');
      suggestions.push('Kebiasaan kecil yang terus diulang jauh lebih baik daripada intensitas sesaat tanpa konsistensi.');
    }
  } else {
    summary = 'Streak Anda saat ini kosong. Ayo mulai konsistensi harian yang baru hari ini!';
    suggestions.push('Masukkan catatan aktivitas hari ini untuk langsung memulai 1-Day streak baru Anda!');
    suggestions.push('Pilih kategori favorit Anda untuk difokuskan minggu ini.');
  }

  // 3. Productivity Score: percentage of logged days in the last 7 days
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - i);
    return getLocalDateString(d);
  });
  const loggedDaysLast7 = last7Days.filter(d => activities.some(act => act.date_str === d)).length;
  const productivityScore = Math.round((loggedDaysLast7 / 7) * 100);

  // 4. Top Categories
  const categoryCounts: Record<string, number> = {};
  activities.forEach(act => {
    categoryCounts[act.category_name] = (categoryCounts[act.category_name] || 0) + 1;
  });
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => `${entry[0]} (${entry[1]}x)`);

  // Extra suggestions based on category streaks
  const categoriesAtRisk = categories.filter(
    cat => cat.streak > 0 && cat.last_submit_date === yesterdayStr && !activities.some(act => act.category_id === cat.id && act.date_str === todayStr)
  );
  
  if (categoriesAtRisk.length > 0) {
    suggestions.push(
      `Peringatan: Streak Kategori "${categoriesAtRisk[0].name}" (${categoriesAtRisk[0].streak} hari) terancam putus hari ini!`
    );
  }

  if (categories.length === 0) {
    suggestions.push('Buat kategori aktivitas pertama Anda untuk memulai pengelompokan catatan harian.');
  }

  return {
    summary,
    topCategories,
    productivityScore,
    suggestions,
    streakInfo: {
      currentStreak: profile.streak,
      lastLoggedDate: profile.last_submit_date
    }
  };
}
