# 🔐 Google OAuth Integration - Backend Implementation Guide

**Project:** CVOptimizer  
**Status:** Required, Priority: Low  
**Date:** 16 April 2026

---

## 📋 Overview

Frontend sudah implement Google OAuth button. Backend perlu membuat **callback endpoint** untuk menerima & verify Google token, kemudian return JWT token ke frontend.

---

## 🔄 Flow Diagram

```
┌─────────────┐              ┌──────────┐              ┌─────────────┐
│  FRONTEND   │              │  GOOGLE  │              │   BACKEND   │
│ (Port 3000) │              │          │              │  (Port 4000)│
└─────────────┘              └──────────┘              └─────────────┘
      │                           │                            │
      │ 1. Click "Login w/ Google │                           │
      │    pakai CLIENT_ID        │                           │
      ├──────────────────────────>│                           │
      │                           │ 2. User approve          │
      │                           │    & grant permission    │
      │ 3. Google redirect ke:                               │
      │    http://localhost:4000/auth/callback               │
      │    + credential ID token                             │
      │ ◄──────────────────────────────────────────────────┤ │
      │ (Browser auto-follow redirect)                       │ │
      │                                                       │
      │                    4. Backend receive:               │
      │                       - Google ID Token              │
      │                       - Verify with GOOGLE_SECRET    │
      │                       - Extract user data            │
      │                       - Auto-create/find user        │
      │                                                       │
      │                    5. Generate JWT                   │
      │                       - Set secure cookie OR         │
      │                       - Return JWT in response       │
      │                                                       │
      │ 6a. If cookie set:                                   │
      │     Browser automatically attach cookie              │
      │     Redirect to /dashboard                           │
      │ ◄──────────────────────────────────────────────────┤ │
      │                                                       │
      │ 6b. If JWT in response:                              │
      │     Frontend store JWT in localStorage               │
      │     Redirect to /dashboard                           │
      │                                                       │
      │ ✅ User logged in!                                   │
```

---

## 🛠️ Backend Implementation Details

### Endpoint: `POST /auth/callback` 
**or** `GET /auth/callback` (depending on Google flow)

### Request

Backend akan menerima satu dari dua format:

**Option A: Query Parameter (GET)**
```
GET http://localhost:4000/auth/callback?code=AUTHORIZATION_CODE
```

**Option B: Form Body (POST)**
```
POST http://localhost:4000/auth/callback
Content-Type: application/json

{
  "code": "AUTHORIZATION_CODE"
  // or
  "id_token": "JWT_FROM_GOOGLE"
}
```

> **Note:** Frontend akan kirim request sesuai flow yang backend support.

---

### Backend Logic Steps

#### 1️⃣ **Terima Google Token/Code**
```typescript
// Pseudocode
const token = req.body.id_token; // atau dari query param
// atau
const code = req.query.code;
```

#### 2️⃣ **Verify Google Token**
Gunakan `google-auth-library` untuk verify:

```typescript
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:4000/auth/callback'
);

// Verify token
const ticket = await client.verifyIdToken({
  idToken: token,
  audience: process.env.GOOGLE_CLIENT_ID,
});

const payload = ticket.getPayload();
// payload contains: {
//   sub: "google_user_id",
//   email: "user@gmail.com", 
//   name: "User Name",
//   picture: "url_to_avatar",
//   ...
// }
```

#### 3️⃣ **Find or Create User**
```typescript
// Pseudo:
let user = await User.findByEmail(payload.email);

if (!user) {
  // Auto-create user from Google data
  user = await User.create({
    email: payload.email,
    full_name: payload.name,
    // Set random password atau null jika using OAuth only
    password: null, 
    plan: 'free'
  });
}
```

#### 4️⃣ **Generate JWT Token**
```typescript
const accessToken = jwt.sign(
  { sub: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

const refreshToken = jwt.sign(
  { sub: user.id },
  process.env.REFRESH_TOKEN_SECRET,
  { expiresIn: '7d' }
);
```

#### 5️⃣ **Return Response**

**Option A: Set HTTP-Only Cookie (RECOMMENDED for security)**
```typescript
// Set refresh token di HTTP-only cookie
res.cookie('refresh_token', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

// Redirect ke frontend dashboard
res.redirect('http://localhost:3000/dashboard');

// Response body (optional):
// {
//   "success": true,
//   "data": {
//     "access_token": "JWT_TOKEN",
//     "user": { id, email, full_name, plan }
//   }
// }
```

**Option B: Return JWT in Response Body**
```typescript
res.json({
  "success": true,
  "data": {
    "access_token": accessToken,
    "refresh_token": refreshToken, // berisi refresh token
    "user": {
      "id": user.id,
      "email": user.email,
      "full_name": user.full_name,
      "plan": user.plan,
      "created_at": user.created_at,
      "updated_at": user.updated_at
    }
  }
});
```

---

## 🔑 Environment Variables Backend Perlu

```env
# .env atau .env.production
GOOGLE_CLIENT_ID=abc123xyz...          # Dari Google Cloud Console
GOOGLE_CLIENT_SECRET=secret456...      # Dari Google Cloud Console
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/callback

# JWT secrets
JWT_SECRET=your_jwt_secret_key
REFRESH_TOKEN_SECRET=your_refresh_token_secret
```

---

## 📍 Google Cloud Console Setup

Backend **TIDAK perlu setup** di Google Cloud Console. Frontend sudah setup dengan:

```
Authorized JavaScript origins:
  - http://localhost:3000
  - https://cvoptimizer.com

Authorized redirect URIs:
  - http://localhost:4000/auth/callback
  - https://cvoptimizer.com/auth/callback
```

Backend hanya perlu credentials locally untuk verify token.

---

## 🧪 Testing Flow Locally

1. Frontend: User click "Login with Google"
2. Google popup appear
3. User select account & approve
4. Google redirect to: `http://localhost:4000/auth/callback`
5. Backend verify & create/find user
6. Backend return JWT atau set cookie
7. User should be logged in di `/dashboard`

---

## 📌 Important Notes

- ⚠️ **GOOGLE_CLIENT_SECRET** harus di-keep secret (backend only)
- ✅ **GOOGLE_CLIENT_ID** aman di expose ke frontend (pakai NEXT_PUBLIC_)
- 🔒 Gunakan HTTPS di production (Google enforce)
- 🍪 Refresh token sebaiknya di HTTP-only cookie untuk security
- ⏱️ Access token: short-lived (1 hour)
- ⏱️ Refresh token: long-lived (7 days)

---

## 💬 Questions for Frontend Team

Setelah backend implement, frontend perlu tahu:

1. Endpoint exact path? (`/auth/callback` atau berbeda?)
2. Support `GET` atau `POST` atau both?
3. Return JWT di body atau cookie?
4. Bagaimana handle redirect setelah login? (auto-redirect to /dashboard atau frontend handle?)
5. Error handling? (invalid token, user tidak bisa di-create, etc)

---

## 📚 Reference Links

- Google OAuth: https://developers.google.com/identity/protocols/oauth2
- Node.js Google Auth Library: https://github.com/googleapis/google-auth-library-nodejs
- JWT Best Practices: https://tools.ietf.org/html/rfc8725

---

## ✅ IMPLEMENTATION COMPLETED

### Backend Implementation (NestJS)

**Endpoint Implemented:** `POST /auth/google`

**File Changes:**
1. `backend/src/modules/auth/auth.service.ts`
   - Added `googleLogin(idToken: string)` method
   - Verifies Google ID token using `google-auth-library`
   - Auto-creates user if not exists
   - Returns JWT access_token + refresh_token

2. `backend/src/modules/auth/auth.controller.ts`
   - Added `@Post('google')` endpoint
   - Receives `{ token: string }` from frontend
   - Sets HTTP-only refresh_token cookie
   - Returns `{ access_token, user }` in response body

3. `backend/package.json`
   - Added `google-auth-library` dependency

**Backend Implementation Code:**
```typescript
// auth.service.ts - googleLogin method
async googleLogin(idToken: string) {
  try {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    // Verify Google token
    const client = new OAuth2Client(googleClientId, googleClientSecret);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Find or create user
    let user = await this.usersService.findByEmail(email);
    if (!user) {
      user = await this.usersService.create({
        email,
        passwordHash: null, // OAuth user
        fullName: name || email.split('@')[0],
        plan: UserPlan.FREE,
      });
    }

    // Generate tokens
    const accessToken = this.signAccessToken(user.id, user.email);
    const refreshToken = await this.createRefreshToken(user);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: { id: user.id, email: user.email, full_name: user.fullName, plan: user.plan },
    };
  } catch (error) {
    throw new UnauthorizedException(`Google authentication failed: ${error.message}`);
  }
}
```

### Frontend Implementation (Next.js)

**Current State:** ✅ Ready & Functional

**Data Flow:**
```
1. User clicks "Sign in with Google"
2. GoogleLoginButton captures credential token
3. POST /api/auth/google (frontend route) with { token }
4. Frontend route forwards to backend: POST /api/auth/google
5. Backend verifies & returns { access_token, user }
6. Frontend stores in Zustand via setAuth(access_token, user)
7. HTTPOnly cookie automatically set by browser
8. Redirects to /dashboard
```

**Frontend Components:**
- `src/components/auth/GoogleLoginButton.tsx` - Google login button
- `src/app/api/auth/google/route.ts` - API bridge route
- `src/store/auth.store.ts` - Zustand auth state
- `src/app/auth/login/page.tsx` - Professional login page with Google OAuth
- `src/app/auth/register/page.tsx` - Professional register page

**Expected Response Format:**
```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "user-uuid",
    "email": "user@gmail.com",
    "full_name": "John Doe",
    "plan": "free"
  }
}
```

### Environment Variables Required

**Frontend (.env.local):**
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

**Backend (.env):**
```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
NODE_ENV=development
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
```

###  Data Integration Summary

| Component | Purpose | Status |
|---|---|---|
| Google OAuth Token | User identity from Google | ✅ Captured by GoogleLoginButton |
| Verification | Backend verifies token with Google API | ✅ Implemented via google-auth-library |
| User Lookup | Find existing user by email | ✅ Uses UsersService.findByEmail |
| Auto-Create | Create new user from Google data | ✅ Implemented with null password |
| JWT Token | Authentication token for API calls | ✅ Generated via signAccessToken |
| Refresh Token | Long-lived token for re-auth | ✅ Stored in HTTPOnly cookie |
| Frontend Storage | Store JWT in client state | ✅ Zustand auth store |
| Cookie | Store refresh token securely | ✅ HTTPOnly + Secure flags |

### Security Implementation

✅ **Google Client Secret** - Backend only (not exposed in frontend)  
✅ **Google Client ID** - Public to frontend (NEXT_PUBLIC_ prefix)  
✅ **Refresh Token** - HTTPOnly cookie (no JS access)  
✅ **Access Token** - localStorage (short-lived)  
✅ **Token Verification** - Google signature validation  
✅ **CORS** - Handled by frontend proxy route  

### Testing Checklist

- [ ] Add `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` to backend `.env`
- [ ] Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to frontend `.env.local`
- [ ] Start backend: `npm run start:dev`
- [ ] Start frontend: `npm run dev`
- [ ] Click "Sign in with Google" button
- [ ] Approve Google permissions
- [ ] Verify redirect to `/dashboard`
- [ ] Check localStorage contains `access_token`
- [ ] Check cookie contains `refresh_token`

---

**Status:** ✅ FULLY IMPLEMENTED & READY FOR TESTING
**Priority:** Low (Nice-to-have for MVP, but required)  
**Estimated Timeline:** 1-2 days for implementation + testing
