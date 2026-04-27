import { z } from 'zod';

// Step 1: Personal Info
export const personalInfoSchema = z.object({
  target_role: z
    .string()
    .min(2, 'Target role minimal 2 karakter')
    .max(255, 'Target role maksimal 255 karakter'),
  phone: z
    .string()
    .regex(/^[0-9\-\+\s()]*$/, 'Format nomor telepon tidak valid')
    .optional()
    .or(z.literal('')),
  location: z
    .string()
    .min(2, 'Lokasi minimal 2 karakter')
    .max(255, 'Lokasi maksimal 255 karakter')
    .optional()
    .or(z.literal('')),
  linkedin_url: z
    .string()
    .url('URL LinkedIn tidak valid')
    .optional()
    .or(z.literal('')),
  professional_summary: z
    .string()
    .max(500, 'Summary maksimal 500 karakter')
    .optional()
    .or(z.literal('')),
});

export type PersonalInfoData = z.infer<typeof personalInfoSchema>;

// Step 2: Education
export const educationSchema = z.object({
  institution: z
    .string()
    .min(2, 'Nama institusi minimal 2 karakter')
    .max(255, 'Nama institusi maksimal 255 karakter'),
  degree: z
    .string()
    .min(1, 'Jenjang pendidikan wajib diisi'),
  field_of_study: z
    .string()
    .min(2, 'Jurusan minimal 2 karakter')
    .max(255, 'Jurusan maksimal 255 karakter'),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Format tanggal tidak valid',
  }),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Format tanggal tidak valid',
  }),
  gpa: z
    .string()
    .optional()
    .or(z.literal('')),
});

export const educationsSchema = z.array(educationSchema).min(1, 'Minimal ada 1 pendidikan');

export type EducationData = z.infer<typeof educationSchema>;

// Step 3: Experience
export const experienceSchema = z.object({
  company: z
    .string()
    .min(2, 'Nama perusahaan minimal 2 karakter')
    .max(255, 'Nama perusahaan maksimal 255 karakter'),
  position: z
    .string()
    .min(2, 'Posisi minimal 2 karakter')
    .max(255, 'Posisi maksimal 255 karakter'),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Format tanggal tidak valid',
  }),
  end_date: z.string().optional().or(z.literal('')),
  is_current: z.boolean().optional(),
  description: z
    .string()
    .max(2000, 'Deskripsi maksimal 2000 karakter')
    .optional()
    .or(z.literal('')),
});

export const experiencesSchema = z.array(experienceSchema).min(1, 'Minimal ada 1 pengalaman');

export type ExperienceData = z.infer<typeof experienceSchema>;

// Step 4: Skills
export const skillSchema = z.object({
  name: z
    .string()
    .min(1, 'Nama skill wajib diisi')
    .max(100, 'Nama skill maksimal 100 karakter'),
  category: z.enum(['hard_skill', 'soft_skill', 'tool']),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
});

export const skillsSchema = z.array(skillSchema).min(1, 'Minimal ada 1 skill');

export type SkillData = z.infer<typeof skillSchema>;

// Full Profile Schema
export const profileSchema = z.object({
  target_role: personalInfoSchema.shape.target_role,
  phone: personalInfoSchema.shape.phone,
  location: personalInfoSchema.shape.location,
  linkedin_url: personalInfoSchema.shape.linkedin_url,
  professional_summary: personalInfoSchema.shape.professional_summary,
  education: educationsSchema,
  experiences: experiencesSchema,
  skills: skillsSchema,
});

export type ProfileFormData = z.infer<typeof profileSchema>;
