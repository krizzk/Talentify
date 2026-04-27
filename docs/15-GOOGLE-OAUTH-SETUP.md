# 🔐 Google OAuth Setup Guide

## Fitur yang Sudah Diimplementasi

✅ **Login dengan Google** - 1-click login tanpa perlu ketik email
✅ **Register dengan Google** - Daftar langsung pake akun Google
✅ **Otomatis User Creation** - Backend auto buat user dari data Google
✅ **Token Management** - Secure token handling dengan localStorage persistence
✅ **Error Handling** - Error messages yang user-friendly

---

## Setup Steps

### 1. Dapatin Google OAuth Credentials

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau select existing project
3. Navigate ke **APIs & Services** → **Credentials**
4. Click **+ Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Isi Authorized JavaScript origins:
   ```
   http://localhost:3000
   http://172.24.0.187:3001
   https://yourdomain.com
   ```
7. Jika frontend diakses lewat IP/port lain, origin itu juga wajib ditambahkan.
   Contoh error `Error 400: origin_mismatch` berarti origin browser Anda belum terdaftar.
8. Isi Authorized redirect URIs hanya jika Anda memakai redirect flow.
   Untuk implementasi saat ini (`@react-oauth/google` + credential POST ke backend),
   yang paling penting adalah **Authorized JavaScript origins**.
8. Copy **Client ID** dan save

### 2. Setup Environment Variables

Buat atau update `.env.local` di folder `frontend/`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_GOOGLE_ALLOWED_ORIGINS=http://localhost:3000,http://172.24.0.187:3001
NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true
```

**Important:** Prefix `NEXT_PUBLIC_` ngomong ke Next.js bahwa ini public variable

### 3. Backend OAuth Endpoint

Backend harus implement endpoint baru:

```
POST /auth/google
Content-Type: application/json

{
  "token": "google_id_token_here"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "jwt_token",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "full_name": "User Name",
      "plan": "free",
      "created_at": "2026-04-15T...",
      "updated_at": "2026-04-15T..."
    }
  }
}
```

### 4. Backend Implementation Example (NestJS)

```typescript
// auth.controller.ts
@Post('google')
async googleAuth(@Body() { token }: { token: string }) {
  return await this.authService.googleAuth(token);
}

// auth.service.ts
async googleAuth(token: string) {
  // 1. Verify token dengan Google
  const payload = await verifyGoogleToken(token);
  
  // 2. Cari atau buat user
  let user = await this.usersService.findByEmail(payload.email);
  if (!user) {
    user = await this.usersService.create({
      email: payload.email,
      full_name: payload.name,
      plan: 'free'
    });
  }
  
  // 3. Generate JWT
  const jwtToken = this.jwtService.sign({
    sub: user.id,
    email: user.email
  });
  
  return {
    access_token: jwtToken,
    user: user
  };
}
```

---

## Frontend Architecture

### Components Structure

```
src/components/auth/
├── GoogleOAuthProvider.tsx      # Wrapper component
├── GoogleLoginButton.tsx         # Reusable button
├── LoginForm.tsx               # Updated with Google button
└── RegisterForm.tsx            # Updated with Google button
```

### Flow Diagram

```
User clicks "Sign in with Google"
        ↓
GoogleLoginButton component
        ↓
Google OAuth popup
        ↓
User selects Google account & approves
        ↓
credentialResponse.credential (JWT)
        ↓
POST /api/auth/google (frontend route)
        ↓
POST /auth/google (backend endpoint)
        ↓
Backend verifies token & creates/finds user
        ↓
Returns access_token & user data
        ↓
Store in Zustand + localStorage
        ↓
Redirect to /dashboard
```

---

## Files Diubah/Dibuat

### Created Files
- `src/components/auth/GoogleOAuthProvider.tsx` - OAuth provider wrapper
- `src/components/auth/GoogleLoginButton.tsx` - Button component
- `src/app/api/auth/google/route.ts` - Frontend API route

### Updated Files
- `src/components/auth/LoginForm.tsx` - Added Google button
- `src/components/auth/RegisterForm.tsx` - Added Google button  
- `src/app/providers.tsx` - Wrapped with GoogleOAuthProvider

---

## Testing Locally

1. **Setup env vars:**
   ```bash
   cd frontend
   echo "NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id" > .env.local
   ```

2. **Run frontend:**
   ```bash
   npm run dev
   ```

3. **Run backend:**
   ```bash
   cd ../backend
   npm run start:dev
   ```

4. **Test di browser:**
   - Buka http://localhost:3000/auth/login
   - Click tombol Google
   - Pilih akun Google Anda
   - Should redirect ke /dashboard

---

## Security Considerations

✅ **Token Verification** - Backend HARUS verify Google token signature
✅ **HTTPS Only** - Google OAuth credentials hanya boleh via HTTPS (except localhost)
✅ **CORS** - Frontend domain harus di whitelist di Google Console
✅ **Environment Variables** - Credentials disimpan di env vars, bukan hardcoded
✅ **HTTP-Only Cookies** - Refresh token disimpan di HTTP-only cookies

---

## Troubleshooting

### "401 Unauthorized" saat Google login
→ Check di backend bahwa token verification working

### Google popup blocked oleh browser
→ User perlu allow popups untuk domain Anda

### "Client ID not set" warning
→ Pastikan `NEXT_PUBLIC_GOOGLE_CLIENT_ID` ada di `.env.local`

### CORS Error
→ Pastikan frontend URL ada di Google Console authorized origins

### Error 400: `origin_mismatch`
→ Tambahkan origin aktif browser Anda ke Google Cloud Console.
Jika Anda membuka app dari `http://172.24.0.187:3001`, origin itu harus masuk ke:
`APIs & Services > Credentials > OAuth 2.0 Client ID > Authorized JavaScript origins`

---

## Next Steps

1. ✅ Frontend Google OAuth UI sudah ready
2. ⏳ Implement `/auth/google` endpoint di backend
3. ⏳ Test integration end-to-end
4. ⏳ Setup Google Project credentials
5. ⏳ Deploy ke production dengan HTTPS
