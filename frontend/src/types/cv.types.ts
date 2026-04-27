export interface Template {
  id: string;
  name: string;
  description: string;
}

export interface CV {
  id: string;
  title: string;
  templateId?: string;
  template?: Template;
  content: CVContent;
  createdAt: string;
  updatedAt: string;
  type?: 'generated' | 'tailored';
  status?: 'draft' | 'finalized';
}

export interface CVContent {
  header: {
    full_name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin_url?: string;
  };
  professional_summary?: string;
  experiences: Experience[];
  education: Education[];
  skills: Skill[];
}

export interface Skill {
  name: string;
}

export interface Experience {
  id?: string;
  company: string;
  position: string;
  start_date: string;
  end_date?: string | null;
  description: string;
}

export interface Education {
  id?: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url?: string;
  technologies: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
}

export interface CreateCVRequest {
  title: string;
  templateId?: string;
  content: CVContent;
}

export interface UpdateCVRequest {
  title?: string;
  content?: CVContent;
}