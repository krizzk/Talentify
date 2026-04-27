import { http, HttpResponse } from 'msw';
import type { User, CV, Profile, ATSAnalysisResult } from '@/types';

// Mock data
const mockUser: User = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  full_name: 'Budi Santoso',
  plan: 'free',
  role: 'user',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockProfile: Profile = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  user_id: mockUser.id,
  full_name: 'Budi Santoso',
  target_role: 'Backend Engineer',
  location: 'Jakarta, Indonesia',
  phone: '+62812345678',
  linkedin_url: 'https://linkedin.com/in/budisantoso',
  professional_summary:
    'Passionate backend engineer dengan 2+ tahun pengalaman membangun scalable APIs dan microservices.',
  education: [
    {
      id: '1',
      institution: 'Institut Teknologi Bandung',
      degree: 'S1',
      field_of_study: 'Teknik Informatika',
      start_date: '2018-08',
      end_date: '2022-06',
      gpa: '3.8',
    },
  ],
  experiences: [
    {
      id: '1',
      company: 'PT Teknologi Indonesia',
      position: 'Backend Engineer',
      start_date: '2022-07',
      end_date: null,
      description: 'Develop dan maintain REST APIs untuk platform e-commerce',
      is_current: true,
    },
  ],
  skills: [
    { id: '1', name: 'Node.js', level: 'advanced', category: 'hard_skill' },
    { id: '2', name: 'TypeScript', level: 'advanced', category: 'hard_skill' },
    { id: '3', name: 'PostgreSQL', level: 'intermediate', category: 'hard_skill' },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockCVs: CV[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    user_id: mockUser.id,
    title: 'Backend Engineer CV - Generated',
    type: 'generated',
    status: 'finalized',
    content: {
      header: {
        full_name: 'Budi Santoso',
        email: 'user@example.com',
        phone: '+62812345678',
        location: 'Jakarta, Indonesia',
        linkedin_url: 'https://linkedin.com/in/budisantoso',
      },
      professional_summary:
        'Passionate backend engineer dengan 2+ tahun pengalaman membangun scalable APIs dan microservices.',
      experiences: [
        {
          company: 'PT Teknologi Indonesia',
          position: 'Backend Engineer',
          start_date: '2022-07',
          end_date: null,
          description: 'Develop dan maintain REST APIs untuk platform e-commerce',
        },
      ],
      education: [
        {
          institution: 'Institut Teknologi Bandung',
          degree: 'S1',
          field_of_study: 'Teknik Informatika',
          start_date: '2018-08',
          end_date: '2022-06',
          gpa: '3.8',
        },
      ],
      skills: [
        { name: 'Node.js', level: 'Advanced' },
        { name: 'TypeScript', level: 'Advanced' },
        { name: 'PostgreSQL', level: 'Intermediate' },
      ],
    },
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockATSResult: ATSAnalysisResult = {
  id: '550e8400-e29b-41d4-a716-446655440003',
  cv_id: mockCVs[0].id,
  job_description:
    'Looking for a Backend Engineer with Node.js expertise to build scalable microservices...',
  ats_score: 78,
  matched_keywords: ['Node.js', 'Backend', 'APIs', 'PostgreSQL', 'TypeScript'],
  missing_keywords: ['Redis', 'Docker', 'Kubernetes', 'AWS', 'Microservices'],
  suggestions: [
    'Add more details about microservices architecture experience',
    'Mention specific frameworks like Express or NestJS',
    'Include cloud deployment experience (AWS, GCP, Azure)',
  ],
  analyzed_at: new Date().toISOString(),
};

// MSW Handlers
export const handlers = [
  // 🔌 API-TODO: Remove this mock when backend /api/auth/register is ready.
  http.post('/api/auth/register', async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;
    return HttpResponse.json(
      {
        success: true,
        data: {
          access_token: 'mock-access-token-' + Date.now(),
          user: { ...mockUser, full_name: body.full_name, email: body.email },
        },
      },
      { status: 201 }
    );
  }),

  // 🔌 API-TODO: Remove this mock when backend /api/auth/login is ready.
  http.post('/api/auth/login', () => {
    return HttpResponse.json(
      {
        success: true,
        data: {
          access_token: 'mock-access-token-' + Date.now(),
          user: mockUser,
        },
      },
      { status: 200 }
    );
  }),

  // 🔌 API-TODO: Remove this mock when backend /api/auth/refresh is ready.
  http.post('/api/auth/refresh', () => {
    return HttpResponse.json(
      {
        success: true,
        data: {
          access_token: 'mock-access-token-' + Date.now(),
        },
      },
      { status: 200 }
    );
  }),

  http.get('/api/users/me', () => {
    return HttpResponse.json({
      success: true,
      data: mockUser,
    });
  }),

  // 🔌 API-TODO: Remove this mock when backend /api/profile GET is ready.
  http.get('/api/profile', () => {
    return HttpResponse.json({
      success: true,
      data: mockProfile,
    });
  }),

  // 🔌 API-TODO: Remove this mock when backend /api/profile PUT is ready.
  http.put('/api/profile', async ({ request }) => {
    const body = (await request.json()) as Partial<Profile>;
    return HttpResponse.json({
      success: true,
      data: { ...mockProfile, ...body },
    });
  }),

  // 🔌 API-TODO: Remove this mock when backend /api/cv GET is ready.
  http.get('/api/cv', () => {
    return HttpResponse.json({
      success: true,
      data: mockCVs,
    });
  }),

  // 🔌 API-TODO: Remove this mock when backend /api/cv/generate is ready.
  http.post('/api/cv/generate', () => {
    const newCV: CV = {
      ...mockCVs[0],
      id: 'mock-cv-' + Date.now(),
      title: 'New Generated CV',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json(
      {
        success: true,
        data: newCV,
      },
      { status: 201 }
    );
  }),

  // 🔌 API-TODO: Remove this mock when backend /api/cv/:id GET is ready.
  http.get('/api/cv/:id', () => {
    return HttpResponse.json({
      success: true,
      data: mockCVs[0],
    });
  }),

  // 🔌 API-TODO: Remove this mock when backend /api/cv/:id DELETE is ready.
  http.delete('/api/cv/:id', () => {
    return HttpResponse.json({
      success: true,
      data: { message: 'CV deleted successfully' },
    });
  }),

  // 🔌 API-TODO: Remove this mock when backend /api/ats/analyze is ready.
  http.post('/api/ats/analyze', async () => {
    return HttpResponse.json(
      {
        success: true,
        data: mockATSResult,
      },
      { status: 201 }
    );
  }),
];
