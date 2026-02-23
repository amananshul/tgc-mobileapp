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

Register:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@tgc.com","password":"pass1234"}'
```

Login:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@tgc.com","password":"pass1234"}'
```

Update profile (use token from register/login):
```bash
curl -X PATCH http://localhost:3000/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"fullName":"Aman","city":"Bhopal","interests":["music","sports"],"skills":["event hosting"],"onboardingStep":5,"isOnboarded":true}'
```

Get dashboard:
```bash
curl http://localhost:3000/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Optional: Prisma Studio
```bash
npm run prisma:studio
```
