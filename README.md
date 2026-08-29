# Dynamic MERN Portfolio Builder

A full-stack MERN app where users build a portfolio from a guided form (or
by uploading a résumé), publish it once an admin approves it, and manage
private contact requests. Admins handle Articles & Roadmaps and user
accounts — they never see anyone's portfolio content or private messages.

A few things worth calling out:
- Every section (experience, projects, skills, education, certifications,
  achievements) is optional — a portfolio only shows sections that actually
  have content, so a student with two projects and no work history looks
  just as complete as someone with a decade of experience.
- Résumé upload (PDF or DOCX) pre-fills the whole builder — experience,
  education, skills, projects, certifications, achievements — not just
  contact info. Nothing here overwrites what a user's already added by hand;
  it's a starting point they keep editing from.
- Public portfolio pages use a dark hero (glow, gradients, the 3D avatar)
  over a lighter glassmorphic body — built to read well for both a
  recruiter skimming quickly and a student building their first one.
- The avatar is a draggable 3D "coin" you can spin — uses your real photo,
  not a generated one. We don't fabricate AI faces for real people.
- Profiles stay invisible on the public landing page until an admin
  approves them.

## Layout

```
backend/     Node + Express + MongoDB (Mongoose) API
frontend/    Vite + React + Tailwind + Framer Motion SPA
```

## Running it

### Backend

```bash
cd backend
cp .env.example .env      # fill in MONGO_URI, JWT secrets, etc.
npm install
npm run seed               # default admin + a demo portfolio + a sample roadmap
npm run dev                 # http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

### Logging in

- Demo user: `rahul971801@gmail.com` / `TrainerLife@2026`
- Admin: whatever you set as `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env`
  (defaults to `admin@portfoliobuilder.dev` / `ChangeMe123!` — change it).

`/p/rahul-prajapati` shows the seeded portfolio live. `/admin` is the
moderation dashboard. `/dashboard` (once logged in as the user) is the
builder — résumé import, editable sections, publish button.

## Where things live

| Feature | Files |
|---|---|
| Auth (JWT + bcrypt) | `controllers/authController.js`, `models/User.js` |
| Portfolio builder + résumé import | `pages/PortfolioBuilder.jsx`, `utils/resumeParser.js` |
| Dynamic/optional sections | `pages/PortfolioView.jsx` — each section only renders if it has content |
| Achievements | `Portfolio.achievements`, `Achievements` tab in the builder |
| Public landing page, search/filter | `pages/Landing.jsx`, `controllers/portfolioController.js` |
| Admin dashboard | `pages/AdminDashboard.jsx`, `controllers/adminController.js` |
| Portfolio approval gate | `Portfolio.approvalStatus`, `PATCH /api/admin/portfolios/:id/approve` |
| Articles & Roadmaps | `models/Article.js`, `controllers/articleController.js` |
| Private feedback/contact | `models/Feedback.js`, `controllers/feedbackController.js` |
| Email-based one-click approval | `GET /api/feedback/:id/decide` — hashed, single-use, 48h expiry |
| Themes | `Portfolio.theme` — add palettes in `tailwind.config.js` |
| View/click analytics | `Portfolio.viewCount`, `clickCounts` |
| Rate limiting, helmet, CORS | `middleware/rateLimiters.js`, `server.js` |

## Not wired up yet

- **PDF export** of a portfolio — add `puppeteer` or `html2pdf.js` if you need this.
- **Cloudinary / SMTP** read their config from `.env`, but if those vars are
  missing the app falls back to local disk storage and console-logged emails
  so local dev still works without accounts for either service.
- **Google OAuth** — the `User` schema has a `googleId` field ready for it,
  but the actual OAuth flow isn't implemented. Add `passport-google-oauth20`
  if you want it.
- Résumé parsing is regex/heuristics, not NLP. It gets you most of the way
  there but every field is editable afterward for a reason.
- None of the fields inside `experience`, `projects`, `education`, etc. are
  marked `required` in the Mongoose schema, on purpose — a résumé parse can
  legitimately produce a blank field, and a hard validation error there
  would fail the whole save. Every save handler in the builder also has a
  real `try/catch`, so a failed request shows an actual error instead of
  leaving a button stuck on "Saving…" forever.

## Deploying

Frontend → Vercel, backend → Railway or Render, database → MongoDB Atlas.
Set `CLIENT_URL` on the backend and `VITE_API_URL` on the frontend to
whatever your deployed URLs end up being.

`multer-storage-cloudinary` (the original package) only works with
Cloudinary's v1 SDK. This uses v2, so it depends on the community fork
`multer-storage-cloudinary-v2` instead — there's a `.npmrc` in `backend/`
with `legacy-peer-deps=true` so `npm install` doesn't choke on the peer
dependency mismatch.
