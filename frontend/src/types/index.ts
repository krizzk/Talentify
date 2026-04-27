// User &uth Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  public_slug?: string | null;
  plan: 'free' | 'premium' | 'enterprise';
  role: 'user' | 'admin';
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// Profile Types
export interface Education {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string | null;
  gpa?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  start_date: string;
  end_date: string | null;
  description: string;
  is_current: boolean;
}

export interface Skill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: 'hard_skill' | 'soft_skill' | 'tool';
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  target_role: string;
  location: string;
  phone: string;
  linkedin_url?: string;
  portfolio_url?: string;
  professional_summary?: string;
  education: Education[];
  experiences: Experience[];
  skills: Skill[];
  created_at: string;
  updated_at: string;
}

// CV Types
export interface CV {
  id: string;
  user_id: string;
  title: string;
  type: 'generated' | 'tailored';
  status: 'draft' | 'finalized';
  plain_text?: string;
  parent_cv_id?: string | null;
  is_public?: boolean;
  public_slug?: string | null;
  public_url?: string | null;
  content: CVContent;
  original_content?: CVContent;
  created_at: string;
  updated_at: string;
}

export interface CVContent {
  header: {
    full_name: string;
    email: string;
    phone: string;
    location: string;
    linkedin_url?: string;
  };
  professional_summary?: string;
  experiences: CVExperience[];
  education: CVEducation[];
  skills: CVSkill[];
}

export interface CVExperience {
  company: string;
  position: string;
  start_date: string;
  end_date: string | null;
  description: string;
}

export interface CVEducation {
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string | null;
  gpa?: string;
}

export interface CVSkill {
  name: string;
  level: string;
}

export interface PublicResumePayload {
  slug: string;
  public_url: string;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
  profile: {
    target_role: string;
    phone: string;
    location: string;
    linkedin_url?: string;
    portfolio_url?: string;
    professional_summary?: string;
  };
  cv: CV;
}

// ATS Analyzer Types
export interface ATSAnalysisRequest {
  cv_id: string;
  job_description: string;
}

export interface ATSAnalysisResult {
  id: string;
  cv_id: string;
  job_description: string;
  ats_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  suggestions: string[];
  analyzed_at: string;
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown[];
}

export interface AdminDashboardData {
  metrics: {
    total_users: number;
    new_users_this_week: number;
    admin_count: number;
    premium_users: number;
    enterprise_users: number;
    total_cvs: number;
    total_ats_analyses: number;
  };
  recent_users: User[];
}

export interface AdminManagedUser extends User {
  cv_count: number;
}

export interface AdminUsersResponse {
  items: AdminManagedUser[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ModerationItem {
  id: string;
  title: string;
  status: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  reasons: string[];
  updated_at: string;
  preview: string;
  user: Pick<User, 'id' | 'email' | 'full_name' | 'plan' | 'role'> | null;
}

export interface ModerationResponse {
  summary: {
    total_reviewed: number;
    flagged: number;
    high_risk: number;
    medium_risk: number;
  };
  items: ModerationItem[];
}

export interface SystemHealthResponse {
  timestamp: string;
  environment: string;
  uptime_seconds: number;
  services: {
    api: 'healthy' | 'unhealthy';
    database: 'healthy' | 'unhealthy';
    redis: 'healthy' | 'unhealthy';
  };
  runtime: {
    rss_mb: number;
    heap_used_mb: number;
    heap_total_mb: number;
    external_mb: number;
  };
}
