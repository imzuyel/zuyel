<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Panchagarh Government Technical School & College (PTSC) ERP

Comprehensive Institutional Management System for Technical Education Directorate & Bangladesh Technical Education Board (BTEB).

## Run Locally

**Prerequisites:** Node.js (v18, v20, or v22)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
A `.env.local` file has been prepared with defaults:
```bash
# Set your Gemini API key in .env.local if you wish to use AI generation features
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Hybrid Database Resilience:** 
> If `DATABASE_URL` is omitted, the application automatically runs using the built-in resilient institutional in-memory data store. If connecting to a production MySQL database, configure `DATABASE_URL=mysql://user:password@localhost:3306/ptsc_db` and run `npm run db:push`.

### 3. Generate Prisma Client
```bash
npm run db:generate
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build & Run
```bash
npm run build
npm run start
```