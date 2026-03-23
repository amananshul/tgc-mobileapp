# TGC Mobile App — Developer Setup Guide

A community-driven mobile app built with React Native (frontend) and Express + PostgreSQL (backend).

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Environment Setup](#environment-setup)
5. [Running Locally](#running-locally)
6. [Database Schema](#database-schema)
7. [API Documentation](#api-documentation)
8. [Auth Architecture](#auth-architecture)

---

## Tech Stack

### Backend (`tgc-express/`)

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | ≥ 22.11.0 |
| Framework | Express.js | ^4.18.2 |
| Language | TypeScript | ^5.9.3 |
| ORM | Prisma | ^5.8.0 |
| Database | PostgreSQL | 16 (Docker) |
| Auth | Supabase (server-side JWT validation) | ^2.57.4 |
| File Storage | Supabase Storage | — |
| Validation | Zod | ^4.3.6 |
| Security | Helmet, CORS, express-rate-limit | — |
| Logging | Morgan | ^1.10.1 |
| Tokens | jsonwebtoken | ^9.0.2 |
| ID generation | nanoid | ^3.3.11 |
| Password hashing | bcrypt | ^5.1.1 |

### Frontend (`tgc-frontend/`)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React Native CLI | 0.84.0 |
| Language | TypeScript | ^5.8.3 |
| React | React | 19.2.3 |
| Navigation | React Navigation v7 | ^7.1.28 |
| State (UI/Auth) | Redux Toolkit + React Redux | ^2.11.2 / ^9.2.0 |
| State (Server) | TanStack React Query | ^5.90.21 |
| Forms | react-hook-form + Zod | ^7.71.1 / ^4.3.6 |
| HTTP | Axios | ^1.13.5 |
| Secure Storage | react-native-keychain | ^10.0.0 |
| Auth | Supabase JS | ^2.97.0 |
| Icons | lucide-react-native | ^0.575.0 |
| Toast | react-native-toast-message | ^2.3.3 |
| Image Picker | react-native-image-picker | ^8.2.1 |

---

## Project Structure

```
tgc-mobileapp/
├── tgc-express/                  # Backend
│   ├── infra/
│   │   └── docker-compose.yml    # PostgreSQL 16 container
│   └── api/
│       ├── prisma/
│       │   └── schema.prisma     # Database schema
│       ├── src/
│       │   ├── index.ts          # Entry point
│       │   ├── app.ts            # Express app setup
│       │   ├── config/env.ts     # Env vars
│       │   ├── types/express.d.ts # Request type augmentation
│       │   ├── middlewares/      # auth, error, validate, rateLimit, requireRole
│       │   ├── utils/            # tokens, password, otp, safeTransform
│       │   └── modules/
│       │       ├── auth/         # register, login, otp, refresh, logout
│       │       ├── users/        # /users/me
│       │       ├── profile/      # onboarding, update profile
│       │       ├── dashboard/    # home dashboard data
│       │       ├── events/       # CRUD events, register/unregister
│       │       ├── tribes/       # CRUD tribes, join/leave, posts
│       │       ├── host/         # enable HOST role
│       │       └── uploads/      # Supabase presigned URLs
│       ├── package.json
│       └── tsconfig.json
│
└── tgc-frontend/                 # React Native App
    ├── src/
    │   ├── app/
    │   │   ├── navigation/       # RootNavigator, AuthStack, AppStack, OnboardingStack
    │   │   └── providers/        # StoreProvider, QueryProvider
    │   ├── features/
    │   │   ├── auth/             # Login, Register screens
    │   │   ├── otp/              # OTP verification screen
    │   │   ├── onboarding/       # Onboarding flow
    │   │   ├── profile/          # Profile screen
    │   │   ├── dashboard/        # Home dashboard screen
    │   │   ├── events/           # Explore, Detail, Create, MyPass screens
    │   │   ├── tribes/           # Tribe list, detail, posts screens
    │   │   └── host/             # Host mode
    │   ├── components/ui/        # Button, Input, Loader, SurfaceCard, etc.
    │   ├── services/             # Axios client (auto token attach, 401 refresh)
    │   ├── store/                # Redux store
    │   └── theme/                # Color palette
    ├── android/
    ├── ios/
    ├── App.tsx
    └── package.json
```

---

## Prerequisites

Install the following before proceeding:

- **Node.js** ≥ 22.11.0 — [nodejs.org](https://nodejs.org)
- **npm** ≥ 10 (comes with Node)
- **Docker Desktop** — [docker.com](https://www.docker.com/products/docker-desktop) (for PostgreSQL)
- **React Native CLI environment** — follow the [official guide](https://reactnative.dev/docs/set-up-your-environment)
  - For iOS: Xcode + CocoaPods
  - For Android: Android Studio + Android SDK + emulator or device
- **Supabase account** — [supabase.com](https://supabase.com) (for auth + file storage)

---

## Environment Setup

### 1. Backend — `tgc-express/api/.env`

Create the file `tgc-express/api/.env` with the following:

```env
PORT=3000
NODE_ENV=development

# PostgreSQL (matches docker-compose.yml)
DATABASE_URL="postgresql://tgc:tgcpass@localhost:5432/tgc_dev?schema=public"

# JWT (change secrets in production)
JWT_SECRET="change_this_in_real_apps"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="30d"
JWT_REFRESH_SECRET="change_this_refresh_secret_too"

# Supabase (get from your Supabase project → Settings → API)
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_MEDIA_BUCKET=tgc-media
```

### 2. Frontend — `tgc-frontend/.env`

Create the file `tgc-frontend/.env` with the following:

```env
# Supabase (get from your Supabase project → Settings → API)
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>

# Google OAuth (get from Google Cloud Console)
GOOGLE_WEB_CLIENT_ID=<your-web-client-id>.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=<your-ios-client-id>.apps.googleusercontent.com
```

---

## Running Locally

### Step 1 — Start the Database

```bash
cd tgc-express
docker compose -f infra/docker-compose.yml up -d

# Verify it's running
docker ps
```

Database credentials:
- Host: `localhost`
- Port: `5432`
- User: `tgc`
- Password: `tgcpass`
- DB name: `tgc_dev`

---

### Step 2 — Set Up and Start the Backend

```bash
cd tgc-express/api

# Install dependencies
npm install

# Push schema to database (safe, non-interactive)
npx prisma db push

# Generate Prisma client
npx prisma generate

# Start dev server
npm run dev
```

The API will be available at `http://localhost:3000`.

Health check:
```bash
curl http://localhost:3000/health
```

> **Note:** Use `npx prisma db push` (not `prisma migrate dev`) in local/CLI sessions — `migrate dev` requires an interactive terminal.

Optional — Open Prisma Studio (DB GUI):
```bash
npx prisma studio
```

---

### Step 3 — Set Up and Start the Frontend

```bash
cd tgc-frontend

# Install JS dependencies
npm install
```

#### iOS

```bash
# Install CocoaPods (first time or after adding native packages)
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install --project-directory=ios

# Run on iOS simulator
npx react-native run-ios
```

#### Android

```bash
# Forward backend port to Android emulator
adb reverse tcp:3000 tcp:3000

# Run on Android emulator
npx react-native run-android
```

> The frontend uses `localhost:3000` for iOS and `10.0.2.2:3000` for Android to reach the backend — this is handled automatically in `src/config/`.

Start Metro bundler separately (optional):
```bash
npx react-native start
```

---

## Database Schema

Below is the full Prisma schema. All tables use PostgreSQL via Prisma ORM.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ─────────────────────────────────────────────────────────────────

enum ProfileIntent {
  LEARN
  EARN
  ENTERTAIN
}

enum EventCategory {
  WORKSHOP
  OPEN_MIC
  FITNESS
  MUSIC
  ART
  TECH
  SOCIAL
  VOLUNTEER
  OTHER
}

enum EventVisibility {
  PUBLIC
  TRIBE_ONLY
  PRIVATE
}

enum ProfileMode {
  USER
  HOST
}

enum UserRole {
  USER
  HOST
  ADMIN
}

enum TribeVisibility {
  PUBLIC
  PRIVATE
}

enum TribeMemberRole {
  MEMBER
  MODERATOR
  OWNER
}

// ─── Models ────────────────────────────────────────────────────────────────

model User {
  id                   String    @id @default(uuid())
  email                String    @unique
  supabaseId           String?   @unique
  passwordHash         String
  phone                String?   @unique
  phoneVerified        Boolean   @default(false)
  otpCode              String?
  otpExpiry            DateTime?
  role                 UserRole  @default(USER)
  onboardingCompleted  Boolean   @default(false)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  profile              Profile?
  refreshTokens        RefreshToken[]
  tribes               UserTribe[]
  createdTribes        Tribe[]              @relation("TribeCreator")
  tribePosts           TribePost[]
  createdEvents        Event[]              @relation("EventCreator")
  deletedEvents        Event[]              @relation("EventDeleter")
  eventCollaborations  EventCollaborator[]
  eventRegistrations   EventRegistration[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  tokenHash String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model Profile {
  id             String         @id @default(uuid())
  userId         String         @unique
  intent         ProfileIntent?
  growthIntent   String[]       @default([])
  avatarPath     String?
  username       String?        @unique
  fullName       String?
  city           String?
  bio            String?        @db.VarChar(120)
  shortBio       String?        @db.VarChar(140)
  interests      String[]       @default([])
  skills         String[]       @default([])
  activeMode     ProfileMode    @default(USER)
  onboardingStep Int            @default(0)
  isOnboarded    Boolean        @default(false)
  karmaPoints    Int            @default(0)
  updatedAt      DateTime       @updatedAt

  user           User           @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Tribe {
  id              String          @id @default(uuid())
  name            String          @unique
  slug            String          @unique
  description     String?         @db.VarChar(300)
  coverImagePath  String?
  category        String          @default("general")
  visibility      TribeVisibility @default(PUBLIC)
  memberCount     Int             @default(0)
  createdById     String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  createdBy       User?           @relation("TribeCreator", fields: [createdById], references: [id])
  members         UserTribe[]
  posts           TribePost[]
  events          Event[]

  @@index([category])
  @@index([slug])
}

model UserTribe {
  id       String          @id @default(uuid())
  userId   String
  tribeId  String
  role     TribeMemberRole @default(MEMBER)
  joinedAt DateTime        @default(now())

  user     User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  tribe    Tribe           @relation(fields: [tribeId], references: [id], onDelete: Cascade)

  @@unique([userId, tribeId])
  @@index([tribeId])
  @@index([userId])
}

model TribePost {
  id        String   @id @default(uuid())
  tribeId   String
  userId    String
  content   String   @db.VarChar(2000)
  imagePath String?
  createdAt DateTime @default(now())

  tribe     Tribe    @relation(fields: [tribeId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tribeId])
  @@index([userId])
  @@index([tribeId, createdAt])
}

model Event {
  id                String          @id @default(uuid())
  title             String
  slug              String          @unique
  description       String?         @db.VarChar(2000)
  category          EventCategory   @default(OTHER)
  city              String
  venueName         String?
  addressText       String?
  startAt           DateTime
  endAt             DateTime?
  coverImageUrl     String?
  visibility        EventVisibility @default(PUBLIC)
  capacity          Int?
  registrationCount Int             @default(0)
  tribeId           String?
  createdById       String
  isDeleted         Boolean         @default(false)
  deletedAt         DateTime?
  deletedById       String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  tribe             Tribe?              @relation(fields: [tribeId], references: [id])
  createdBy         User                @relation("EventCreator", fields: [createdById], references: [id])
  deletedBy         User?               @relation("EventDeleter", fields: [deletedById], references: [id])
  collaborators     EventCollaborator[]
  registrations     EventRegistration[]

  @@index([startAt])
  @@index([city])
  @@index([tribeId])
  @@index([createdById])
  @@index([isDeleted])
}

model EventCollaborator {
  id      String @id @default(uuid())
  eventId String
  userId  String
  role    String @default("COHOST")

  event   Event  @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([eventId, userId])
  @@index([eventId])
  @@index([userId])
}

model EventRegistration {
  id        String   @id @default(uuid())
  eventId   String
  userId    String
  status    String   @default("REGISTERED")
  passCode  String   @unique
  createdAt DateTime @default(now())

  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([eventId, userId])
  @@index([eventId])
  @@index([userId])
}
```

### Entity Relationship Summary

```
User ──── Profile          (1:1)
User ──── RefreshToken     (1:many)
User ──── UserTribe        (many:many via UserTribe)
Tribe ─── UserTribe
User ──── TribePost        (1:many)
Tribe ─── TribePost        (1:many)
User ──── Event            (1:many, as creator)
Tribe ─── Event            (1:many, optional)
Event ─── EventCollaborator (1:many)
Event ─── EventRegistration (1:many)
User ──── EventRegistration (1:many)
```

---

## API Documentation

**Base URL:** `http://localhost:3000`

All protected routes require the header:
```
Authorization: Bearer <supabase-access-token>
```

---

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Server health check |

---

### Auth — `/users`

| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|-----------|-------------|
| POST | `/users/register` | No | 10/min | Register with email + password |
| POST | `/users/login` | No | 10/min | Login, returns access + refresh tokens |
| POST | `/users/verify-otp` | No | — | Verify OTP (MVP: always `123456`) |
| POST | `/users/resend-otp` | No | — | Resend OTP to email/phone |
| POST | `/users/refresh` | No | — | Get new access token via refresh token |
| POST | `/users/logout` | Yes | — | Invalidate refresh token |

**Register body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "phone": "+911234567890"   // optional
}
```

**Login body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Login response:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": "...", "email": "...", "role": "USER" }
}
```

**Verify OTP body:**
```json
{
  "userId": "uuid",
  "otp": "123456"
}
```

**Refresh body:**
```json
{
  "refreshToken": "eyJ..."
}
```

---

### Users — `/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/me` | Yes | Get current user with profile data |

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "USER",
  "onboardingCompleted": false,
  "profile": {
    "username": null,
    "fullName": null,
    "city": null,
    "bio": null,
    "interests": [],
    "skills": [],
    "karmaPoints": 0,
    "activeMode": "USER",
    "isOnboarded": false
  }
}
```

---

### Profile — `/profile`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PATCH | `/profile/onboarding` | Yes | Update onboarding step progress |
| PATCH | `/profile/` | Yes | Update user profile fields |

**Update profile body (all fields optional):**
```json
{
  "fullName": "Jane Doe",
  "username": "janedoe",
  "city": "Mumbai",
  "bio": "Building cool things.",
  "shortBio": "Builder.",
  "interests": ["music", "tech"],
  "skills": ["event hosting", "design"],
  "intent": "EARN",
  "growthIntent": ["network", "learn"],
  "avatarPath": "tgc-media/avatars/user-id.jpg",
  "activeMode": "HOST"
}
```

**Onboarding body:**
```json
{
  "onboardingStep": 3,
  "isOnboarded": false
}
```

---

### Dashboard — `/dashboard`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard/` | Yes | Get dashboard data |

**Response shape:**
```json
{
  "user": { ... },
  "profile": { ... },
  "upcomingEventsPreview": [ /* 3 upcoming events */ ],
  "tribesPreview": [ /* user's joined tribes */ ],
  "hostStats": {
    "totalEventsCreated": 0
  },
  "nextActions": [
    { "type": "attend_event", "label": "Find an event to attend" }
  ],
  "profileCompleteness": 40
}
```

---

### Events — `/events`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/events/` | Yes | Any | List events (filterable) |
| GET | `/events/my` | Yes | Any | Events user created or registered for |
| GET | `/events/:slug` | Yes | Any | Get event by slug |
| POST | `/events/` | Yes | HOST/ADMIN | Create event |
| PATCH | `/events/:eventId` | Yes | HOST/ADMIN | Update event |
| DELETE | `/events/:eventId` | Yes | HOST/ADMIN | Soft-delete event |
| POST | `/events/:eventId/register` | Yes | Any | Register for event |
| DELETE | `/events/:eventId/register` | Yes | Any | Unregister from event |

**List events query params:**
```
GET /events?city=Mumbai&keyword=music&category=MUSIC&date=upcoming&page=1&limit=20
```

**Create event body:**
```json
{
  "title": "Open Mic Night",
  "description": "A fun open mic event.",
  "category": "OPEN_MIC",
  "city": "Mumbai",
  "venueName": "The Stage",
  "addressText": "123 Main St",
  "startAt": "2026-04-10T18:00:00Z",
  "endAt": "2026-04-10T21:00:00Z",
  "visibility": "PUBLIC",
  "capacity": 100,
  "tribeId": "uuid-optional",
  "coverImageUrl": "https://..."
}
```

**Register response includes passCode:**
```json
{
  "passCode": "ABC123",
  "eventTitle": "Open Mic Night",
  "eventStartAt": "2026-04-10T18:00:00Z",
  "eventCity": "Mumbai"
}
```

---

### Tribes — `/tribes`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/tribes/` | Yes | HOST/ADMIN | Create tribe |
| GET | `/tribes/` | Yes | Any | List tribes |
| GET | `/tribes/my` | Yes | Any | Tribes user has joined |
| GET | `/tribes/:slug` | Yes | Any | Get tribe by slug |
| PATCH | `/tribes/:tribeId` | Yes | OWNER/MODERATOR | Update tribe |
| POST | `/tribes/:tribeId/join` | Yes | Any | Join tribe |
| DELETE | `/tribes/:tribeId/leave` | Yes | Any | Leave tribe |
| GET | `/tribes/:tribeId/posts` | Yes | Any | Get tribe posts (paginated) |
| POST | `/tribes/:tribeId/posts` | Yes | Any | Create post in tribe |

**Create tribe body:**
```json
{
  "name": "Mumbai Makers",
  "slug": "mumbai-makers",
  "description": "A tribe for makers in Mumbai.",
  "category": "tech",
  "visibility": "PUBLIC",
  "coverImagePath": "tgc-media/tribes/cover.jpg"
}
```

---

### Host — `/host`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/host/enable` | Yes | Upgrade current user role to HOST |

---

### Uploads — `/uploads`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/uploads/presign` | Yes | Get presigned URL for Supabase Storage upload |
| GET | `/uploads/view-url` | Yes | Get public/signed view URL for a stored file |

**Presign body:**
```json
{
  "bucket": "tgc-media",
  "path": "avatars/user-id.jpg",
  "contentType": "image/jpeg"
}
```

**Response:**
```json
{
  "uploadUrl": "https://...",
  "path": "avatars/user-id.jpg"
}
```

---

## Auth Architecture

This app uses **Supabase as the identity provider**. The Express backend validates Supabase JWT tokens and syncs users into its own PostgreSQL database.

### Flow

```
Mobile App
  │
  ├── Sign in via Supabase (OTP / Google OAuth)
  │     → Supabase returns access token
  │
  └── Call Express API with: Authorization: Bearer <supabase-token>
        │
        ├── auth.middleware.ts validates token with Supabase Admin SDK
        ├── Finds or creates User record in PostgreSQL
        ├── Attaches req.user = { userId, email, role, ... }
        └── Route handler executes
```

### Token Roles

| Role | Permissions |
|------|------------|
| `USER` | Default role. Can browse events, join tribes, register for events. |
| `HOST` | Can create events and tribes. Enabled via `POST /host/enable`. |
| `ADMIN` | Full access. Must be set manually in the database. |

### Karma Points

| Action | Points |
|--------|--------|
| Create event | +10 |
| Register for event | +5 |

---

## Quick Reference — All Commands

```bash
# ── Database ──────────────────────────────────────────
cd tgc-express
docker compose -f infra/docker-compose.yml up -d      # start DB
docker compose -f infra/docker-compose.yml down       # stop DB
docker compose -f infra/docker-compose.yml down -v    # stop + wipe data

# ── Backend ───────────────────────────────────────────
cd tgc-express/api
npm install                                            # install deps
npx prisma db push                                     # sync schema to DB
npx prisma generate                                    # regenerate Prisma client
npm run dev                                            # start dev server (port 3000)
npm run build                                          # compile TypeScript
npm start                                              # run compiled JS
npx prisma studio                                      # open DB GUI at localhost:5555
tsc --noEmit                                           # type-check without building

# ── Frontend ──────────────────────────────────────────
cd tgc-frontend
npm install                                            # install JS deps

# iOS
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install --project-directory=ios
npx react-native run-ios

# Android
adb reverse tcp:3000 tcp:3000
npx react-native run-android

# Metro bundler (separate terminal)
npx react-native start
```
