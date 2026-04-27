import { z } from 'zod';

// Register Schema
export const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(2, 'Nama minimal 2 karakter')
      .max(255, 'Nama maksimal 255 karakter'),
    email: z
      .string()
      .email('Format email tidak valid')
      .max(255, 'Email maksimal 255 karakter'),
    password: z
      .string()
      .min(8, 'Password minimal 8 karakter')
      .regex(/[a-zA-Z]/, 'Password harus mengandung huruf')
      .regex(/[0-9]/, 'Password harus mengandung angka'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Password tidak sama',
    path: ['confirm_password'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
export type RegisterPayload = Omit<RegisterFormData, 'confirm_password'>;

// Login Schema
export const loginSchema = z.object({
  email: z
    .string()
    .email('Format email tidak valid')
    .min(1, 'Email wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
