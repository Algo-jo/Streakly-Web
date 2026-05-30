export interface Profile {
  id: string;
  name: string;
  username: string;
  role: string;
  bio: string;
  streak: number;
  highest_streak: number;
  last_submit_date: string | null;
  avatar_url: string | null;
  followed_ids: string[];
  followers_count?: number;
  following_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  streak: number;
  highest_streak: number;
  last_submit_date: string | null;
  created_at: string;
}

export interface WorkLog {
  id: string;
  user_id: string;
  category_id: string;
  category_name: string;
  description: string;
  activity_level: 'LOW' | 'MID' | 'HIGH';
  files: { name: string; size: string; previewUrl: string }[];
  timestamp: number;
  date_str: string;
  created_at: string;

  // Legacy fields for backwards-compatibility with old UI components
  title: string;          // Maps to category_name
  content: string;        // Maps to description (or fallback text)
  category: 'code' | 'note' | 'paper' | 'other'; // 'code' for category, 'note' for activity
  priority: 'NONE' | 'LOW' | 'MID' | 'HIGH';    // Maps to activity_level
  metadata?: {
    repo?: string;        // Maps to category_name
    folder?: string;
    tags?: string[];
    description?: string; // Maps to description
  };
}

export interface ProductivityAnalysis {
  summary: string;
  topCategories: string[];
  productivityScore: number;
  suggestions: string[];
  streakInfo: {
    currentStreak: number;
    lastLoggedDate: string | null;
  };
}
