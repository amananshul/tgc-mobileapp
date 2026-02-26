# TGC Express API

## Setup Instructions

### 1. Start PostgreSQL
```bash
docker compose -f infra/docker-compose.yml up -d
docker ps
```

### 2. Install Dependencies
```bash
cd api
npm install express cors dotenv bcrypt jsonwebtoken
npm install -D nodemon
npm install prisma @prisma/client
```

### 3. Run Prisma Migration
```bash
npm run prisma:migrate -- --name init
```

### 4. Start the API
```bash
npm run dev
```

The API will run on http://localhost:3000

### 5. Test the API

Health check:
```bash
curl http://localhost:3000/health
```

Users/me (use Supabase access token from OTP/Google sign-in):
```bash
curl http://localhost:3000/users/me \
  -H "Authorization: Bearer SUPABASE_ACCESS_TOKEN"
```

Update profile (use Supabase access token):
```bash
curl -X PATCH http://localhost:3000/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUPABASE_ACCESS_TOKEN" \
  -d '{"fullName":"Aman","city":"Bhopal","interests":["music","sports"],"skills":["event hosting"],"onboardingStep":5,"isOnboarded":true}'
```

Get dashboard:
```bash
curl http://localhost:3000/dashboard \
  -H "Authorization: Bearer SUPABASE_ACCESS_TOKEN"
```

## Optional: Prisma Studio
```bash
npm run prisma:studio
```
