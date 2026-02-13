# 🚀 AGENT OPERATIONAL GUIDEBOOK v1.0
## Achei Meu Frete - Agent Instructions & Best Practices

**Document Purpose:** This is the MASTER REFERENCE for all AI agents working on this platform.  
**Read First:** Before making ANY changes, the agent MUST read sections 1-3 completely.  
**Updated:** 2025-02-10  
**Version:** 1.1 - Stable & Production Ready

---

## 📑 QUICK INDEX

### 🔴 CRITICAL READING (Required - 10 min)
- [1. FORBIDDEN OPERATIONS](#1-forbidden-operations) - What NEVER to do
- [2. MANDATORY PATTERNS](#2-mandatory-patterns) - What ALWAYS to do  
- [3. ARCHITECTURE GUARANTEES](#3-architecture-guarantees) - What the system GUARANTEES

### 🟡 OPERATIONAL SKILLS (Essential - 20 min)
- [4. AUTHENTICATION & SECURITY](#4-authentication--security)
- [5. COMPONENTS & STRUCTURE](#5-components--structure)
- [6. TESTING & VALIDATION](#6-testing--validation)
- [7. OPERATIONS & DEPLOYMENT](#7-operations--deployment)

### 🟢 REFERENCE (As Needed - Look Up)
- [8. FILE LOCATIONS & STRUCTURE](#8-file-locations--structure)
- [9. COMMAND QUICK REFERENCE](#9-command-quick-reference)
- [10. DECISION TREES](#10-decision-trees)
- [11. STARTUP SECURITY & ERROR PREVENTION](#11-startup-security--error-prevention)

---

## ⚠️ READING PROTOCOL FOR AGENTS

**EVERY TIME you receive a task:**

```
1. READ sections 1-3 of THIS DOCUMENT first (10 min)

2. IDENTIFY the category of work:
   ├─ Authentication/Security? → Section 4
   ├─ UI/Components? → Section 5
   ├─ Testing? → Section 6
   ├─ Deployment? → Section 7
   ├─ Startup/Infrastructure? → Section 11
   └─ Other? → Sections 8-10

3. READ relevant documentation in docs/:
   ├─ Technical docs? → docs/technical/
   ├─ API changes? → docs/api/
   ├─ Architecture? → docs/architecture/
   └─ Project structure? → docs/PROJECT_STRUCTURE.md

4. CHECK decision trees (section 10)
5. VALIDATE against forbidden operations (section 1)
6. IMPLEMENT following mandatory patterns (section 2)
7. TEST per validation rules (section 6)
8. REPORT what you found + what you'll do BEFORE implementing
```

**Token savings:** Reading this first = prevents 100s of tokens in rework!

---

# 1. FORBIDDEN OPERATIONS

**These cause security vulnerabilities, data loss, or system crashes. CRITICAL to avoid.**

### ❌ Authentication & Storage

| Don't Do | Why | What To Do Instead |
|----------|-----|-------------------|
| Create mock users in auth store | Bypasses security; exposes fake users to production | Use backend only; fail if no backend connection |
| Store passwords in localStorage | Passwords must never be accessible to frontend | Ask backend to handle; frontend only stores tokens after login |
| Auto-login with hardcoded credentials | No user was authenticated; fake login | Only login via valid credentials from backend |
| Clear localStorage on every error | User loses session on temporary network issues | Keep localStorage on error; only clear on explicit logout |
| Accept undefined/null as valid user | Creates cascading failures downstream | Check `user.email AND user.userType` both exist |
| Hardcode `user?.role` instead of `user?.userType` | Database field is `userType` not `role` | Use `user?.userType` only |

**Code Examples - DON'T DO:**
```javascript
// ❌ FORBIDDEN: useAuthStore.js
user: { email: 'USUÁRIO', userType: 'embarcador' }  // NO!
user: JSON.parse(localStorage.getItem('user')) || defaultUser  // NO!

// ❌ FORBIDDEN: Login.jsx
if (!token) { setUser({ email: 'Guest' }) }  // NO!

// ❌ FORBIDDEN: checkAuth()
catch (error) { 
  localStorage.clear()  // NO! User loses session on network hiccup
}

// ❌ FORBIDDEN: Dashboard.jsx
if (user?.role === 'transportador') { ... }  // NO! Field is userType
```

---

### ❌ Header & Layout

| Don't Do | Why | What To Do Instead |
|----------|-----|-------------------|
| Import Header in multiple pages | Renders duplicated; breaks styling | Render Header ONCE in main app component |
| Create TopBar/Navbar in components | Duplicates header; creates visual mess | Use Header from main app with props |
| Hardcode menu items in components | Changes require touching 10+ files | Use Header component with `isAuthenticated` prop |
| Place Header inside Dashboard | Overlaps with sidebar; sidebar hidden | Header in main app, Dashboard contains only layout |
| Render sidebar without proper spacing | Overlaps with header | Sidebar MUST respect header height |

---

### ❌ Dark Mode

| Don't Do | Why | What To Do Instead |
|----------|-----|-------------------|
| Use `text-white` without `dark:` | Invisible in light mode | Use `text-slate-900 dark:text-white` |
| Hardcode color values | Breaks in dark mode | Use Tailwind dark: prefix |
| Color checks in JavaScript | Dynamic themes can't respond | Use Tailwind CSS classes only |

---

### ❌ User Types & userType Handling

| Don't Do | Why | What To Do Instead |
|----------|-----|-------------------|
| Hardcode `userType="embarcador"` | Always shows embarcador menu even for transportador | Use `user?.userType === 'transportador' ? 'transportador' : 'embarcador'` |
| Default to embarcador silently | If we default, we silently give wrong permissions | Return null/error, let UI handle it |
| Check `user?.role` | Database field is `userType` not `role` | Check `user?.userType` only |

---

# 2. MANDATORY PATTERNS

**These MUST be done this way. No exceptions.**

### ✅ Authentication Pattern

**The ONLY way to handle authentication in this system:**

```javascript
// 1. IN AUTH STORE
export const useAuthStore = create((set) => ({
  // Load from localStorage on init (CRITICAL for persistence)
  user: (() => {
    try {
      const saved = localStorage.getItem('user');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('💾 INIT: User loaded:', { 
          email: parsed?.email, 
          userType: parsed?.userType 
        });
        return parsed;
      }
      return null;
    } catch (e) {
      console.error('Error loading user:', e);
      return null;
    }
  })(),
  
  token: localStorage.getItem('auth_token') || null,
  
  // CRITICAL: checkAuth() must preserve localStorage on error
  checkAuth: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    
    try {
      const response = await apiClient.auth.me();
      const user = response?.user || response;
      if (!user?.userType) {
        console.warn('⚠️ userType missing in response!', user);
      }
      set({ user, token });
      console.log('✅ checkAuth: User restored:', { 
        email: user?.email, 
        userType: user?.userType 
      });
    } catch (error) {
      // DON'T CLEAR STORAGE! User has valid offline permissions
      console.error('❌ checkAuth failed:', error?.message);
      set({ error: error.message });
      console.warn('⚠️ Keeping localStorage session despite error');
    }
  },
}));

// 2. IN MAIN APP
function App() {
  const { checkAuth } = useAuth();
  useEffect(() => {
    checkAuth();  // Validate token on app init
  }, [checkAuth]);
  
  return (
    <>
      <Header />  {/* Rendered ONCE globally */}
      <Routes>{/* All routes here */}</Routes>
    </>
  );
}

// 3. IN PROTECTED ROUTES
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
}

// 4. IN LOGIN
async handleSubmit() {
  const response = await login(email, password);
  // Backend returns: { token, user: { id, email, userType, nomeCompleto, ... } }
  localStorage.setItem('auth_token', response.token);
  localStorage.setItem('user', JSON.stringify(response.user));
  // Zustand picks it up automatically
}
```

---

### ✅ Header Pattern - The 3 Scenarios

**The Header MUST follow this logic:**

```javascript
// src/components/Header.jsx

const { isAuthenticated } = useAuth();
const location = useLocation();

// Determine page type
const isPublicPage = ['/', '/sobre', '/faq', '/contato', '/login', '/cadastro']
  .some(path => location.pathname === path);

const isDashboard = location.pathname.startsWith('/dashboard');

// CRITICAL: This determines what renders
const isProtectedPage = isAuthenticated && !isPublicPage;

return (
  <header className="fixed top-0 z-50 w-full bg-white dark:bg-slate-900 border-b">
    
    {/* SCENARIO 1: Not authenticated on public page */}
    {!isAuthenticated && isPublicPage && (
      <div className="flex items-center justify-between px-4 py-4">
        <Logo /> 
        <Nav items={['Home', 'Sobre', 'FAQ', 'Contato']} />
        <Clock /> 
        <div className="flex gap-2">
          <LoginButton />
          <SignupButton />
          <ThemeToggle />
        </div>
      </div>
    )}

    {/* SCENARIO 2: Authenticated on public page */}
    {isAuthenticated && isPublicPage && (
      <div className="flex items-center justify-between px-4 py-4">
        <Logo />
        <Nav items={['Home', 'Sobre', 'FAQ', 'Contato']} />
        <Clock />
        <NotificationBell />
        <Greeting user={user} />
        <DashboardButton />
        <ThemeToggle />
        <LogoutButton />
      </div>
    )}

    {/* SCENARIO 3: Authenticated on dashboard */}
    {isAuthenticated && isDashboard && (
      <div className="flex items-center justify-between px-4 py-4">
        <Logo />
        <Clock />
        <NotificationBell />
        <Greeting user={user} />
        <ThemeToggle />
        <LogoutButton />
      </div>
    )}
  </header>
);
```

---

### ✅ DashboardLayout Pattern

**Every protected dashboard page uses this:**

```javascript
// pages/Dashboard.jsx

import DashboardLayout from '@/components/DashboardLayout';

export default function Dashboard() {
  const { user } = useAuth();
  
  // CRITICAL: Determine actual userType, never hardcode
  const userType = user?.userType === 'transportador' 
    ? 'transportador' 
    : 'embarcador';
  
  return (
    <DashboardLayout userType={userType}>
      {/* Page content here */}
    </DashboardLayout>
  );
}

// components/DashboardLayout.jsx
export default function DashboardLayout({ children, userType }) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* CRITICAL: Sidebar starts at top-20 (80px header) */}
      <aside className="fixed left-0 top-20 h-[calc(100vh-5rem)] w-64">
        {/* Sidebar content */}
      </aside>
      
      <main className="ml-64 mt-20 flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
```

---

### ✅ Dark Mode Pattern

**Every page MUST use this structure:**

```javascript
// Example: pages/Dashboard.jsx

export default function Dashboard() {
  const { user } = useAuth();
  const userType = user?.userType === 'transportador' ? 'transportador' : 'embarcador';
  
  return (
    <DashboardLayout userType={userType}>
      <div className="space-y-8">
        {/* PATTERN: text-slate-900 dark:text-white */}
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Welcome, {user?.nomeCompleto}!
        </h1>
        
        {/* PATTERN: text-slate-600 dark:text-slate-300 */}
        <p className="text-slate-600 dark:text-slate-300">
          Manage your quotes
        </p>
        
        {/* PATTERN: bg-white dark:bg-slate-800 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
          {/* Content here */}
        </div>
      </div>
    </DashboardLayout>
  );
}
```

---

# 3. ARCHITECTURE GUARANTEES

**These are PROMISES the system makes. They MUST always be true.**

### 🗄️ Master Storage Pattern

- **localStorage.auth_token:** JWT token (validated on each load)
- **localStorage.user:** User object `{ id, email, userType, nomeCompleto, ... }`
- **Zustand state:** Mirrors localStorage; in-memory copy
- **Backend JWT:** Source of truth for validation

**Critical:** localStorage SURVIVES errors; only cleared on explicit logout.

---

### 🔐 Authentication Guarantee

1. User can ONLY be authenticated if BOTH exist:
   - `localStorage.auth_token` (valid JWT)
   - `localStorage.user` (user object with email + userType)
2. User type NEVER changes unless explicitly logged out
3. Page refresh restores session via `checkAuth()`
4. If token invalid, user is logged out and sent to `/login`
5. **F5 refresh MUST keep user logged in with SAME userType**

---

### 🏗️ The 3 Scenarios of Header

Always renders in one of these states:

```
┌─────────────────────────────────────────────────────────┐
│ SCENARIO 1: NOT AUTH + PUBLIC PAGE                      │
├─────────────────────────────────────────────────────────┤
│ SHOW:  Logo, Nav, Clock, Login, Signup, ThemeToggle    │
│ HIDE:  Bell, Greeting, Dashboard, Logout               │
├─────────────────────────────────────────────────────────┤
│ SCENARIO 2: AUTH + PUBLIC PAGE                          │
├─────────────────────────────────────────────────────────┤
│ SHOW:  Logo, Nav, Clock, Bell, Greeting, Dashboard,    │
│        ThemeToggle, Logout                              │
│ HIDE:  Login, Signup                                    │
├─────────────────────────────────────────────────────────┤
│ SCENARIO 3: AUTH + DASHBOARD                            │
├─────────────────────────────────────────────────────────┤
│ SHOW:  Logo, Clock, Bell, Greeting, ThemeToggle, Logout│
│ HIDE:  Nav, Dashboard, Login, Signup                    │
└─────────────────────────────────────────────────────────┘
```

---

### 📱 Responsive Guarantee

- **Mobile (<768px):** No sidebar; hamburger menu
- **Tablet (768-1024px):** Collapsible sidebar
- **Desktop (>1024px):** Always-visible sidebar

---

### 🌓 Dark Mode Guarantee

- Every `.text-`, `.bg-`, `.border-` color class has a `dark:` variant
- Theme persists in `localStorage.theme = 'dark' | 'light'`
- Changes apply instantly via `ThemeContext`

---

# 4. AUTHENTICATION & SECURITY

### 🎯 Auth Implementation Rules

**Rule 1: Backend-Only Authentication**
```
User can NEVER be created by frontend alone.
Every login REQUIRES:
  1. Email exists in database
  2. Password matches hash in database
  3. Backend returns JWT token
  4. Frontend stores token + user object only
```

**Rule 2: Session Persistence on F5**
```
After F5 refresh, the user MUST:
  1. Still be logged in (if token valid)
  2. Still have same userType (no switching to embarcador)
  3. Still have access to protected routes

Test this EVERY time you touch auth:
  1. Login as transportador@test.com
  2. Press F5
  3. VERIFY: Still transportador (check console: "💾 INIT: User loaded")
  4. VERIFY: Same pages accessible
```

**Rule 3: Error Recovery**
```
If checkAuth() fails (network error, token expired):
  - DO NOT clear localStorage immediately
  - Log error for debugging
  - Keep user session intact
  - Only logout if token is truly invalid (401)
```

---

### 🛡️ Vulnerability Checklist

| Vulnerability | How It Manifests | How We Prevent It |
|---|---|---|
| Session Hijacking | Attacker uses stolen token | JWT has expiration; token in auth_token only |
| CSRF | Request made without consent | Backend validates JWT in Auth header |
| XSS | Script injection stores token | Token never used in HTML; only requests |
| Privilege Escalation | User switches to different type | userType only changes on logout+login |
| Weak Session | User data survives logout | logout() clears localStorage AND Zustand |

---

# 5. COMPONENTS & STRUCTURE

### 🎨 Component Hierarchy Guarantee

```
App.jsx (MASTER)
  ├─ Header (rendered ONCE, globally) ← KEY!
  │   ├─ Logo
  │   ├─ Navigation (if not dashboard)
  │   ├─ Clock
  │   ├─ NotificationBell (if authenticated)
  │   ├─ Greeting (if authenticated)
  │   ├─ DashboardButton (if authenticated + public)
  │   ├─ LoginButton (if not authenticated)
  │   ├─ ThemeToggle
  │   └─ LogoutButton (if authenticated)
  │
  ├─ Routes
  │   ├─ Public Routes: /, /sobre, /faq, /contato, /login
  │   │
  │   └─ Protected Routes (wrapped in ProtectedRoute)
  │       ├─ /dashboard (Embarcador - with sidebar)
  │       ├─ /dashboard-transportadora (Transportador - with sidebar)
  │       ├─ /perfil (Both - with sidebar)
  │       └─ [Other protected routes]
  │
  └─ ThemeProvider (wraps everything)
```

---

### ✅ Component Checklist

**For ANY new page/component:**

- [ ] Does it import/render Header? **NO** (Header renders in App.jsx only)
- [ ] Does it need a sidebar? **YES** → Wrap in `<DashboardLayout userType={userType}>`
- [ ] Is it a protected route? **YES** → Wrap route in `<ProtectedRoute>`
- [ ] Does it have colors? **Check** - ALL color classes have `dark:` prefix
- [ ] Does it show user data? **Use** `user?.email`, `user?.userType` with null checks
- [ ] Does it hardcode user type? **NO** → Use actual `user?.userType`

---

### 📋 File Structure

```
src/
├── App.jsx                          (Master: routes + Header ONE TIME)
├── components/
│   ├── Header.jsx                   (Header - rendered ONCE in App)
│   ├── DashboardLayout.jsx          (Sidebar container - top-20!)
│   ├── ProtectedRoute.jsx           (Auth wrapper)
│   ├── ThemeToggle.jsx              (Dark/Light mode)
│   ├── NotificationBell.jsx         (Notifications)
│   └── [Other components]
│
├── pages/
│   ├── Home.jsx                     (Public, no layout)
│   ├── Login.jsx                    (Public, no layout)
│   ├── Dashboard.jsx                (Embarcador - uses DashboardLayout)
│   ├── DashboardTransportadora.jsx  (Transportador - uses DashboardLayout)
│   ├── Perfil.jsx                   (Protected - uses DashboardLayout)
│   └── [Other pages]
│
├── hooks/
│   ├── useAuth.js                   (Auth state getter)
│   ├── useAuthStore.js              (Zustand store - READ SECTION 1!)
│   └── [Other hooks]
│
├── contexts/
│   └── ThemeContext.jsx             (Dark/Light mode context)
│
├── api/
│   └── client.js                    (API calls + interceptors)
│
└── utils/
    └── [Helper functions]

backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js        (Login, register, me, logout)
│   │   └── [Other controllers]
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── [Other routes]
│   └── server.js                    (Express app)
│
├── prisma/
│   └── schema.prisma                (Database models)
│
└── [Other backend files]
```

---

# 6. TESTING & VALIDATION

### 🧪 Test Requirements

**Before ANY code commit:**

1. **Build must pass:**
   ```bash
   npm run build
   # Must complete without errors
   ```

2. **Security tests must pass:**
   ```bash
   bash test-security-complete.sh
   # Must show 6/6 tests passing
   ```

3. **F5 persistence must work:**
   ```bash
   bash test-f5-advanced.sh
   # Must keep session after refresh
   ```

4. **Browser console must be clean:**
   - Open F12 → Console
   - Must show "💾 INIT: User loaded" on refresh
   - No red errors

---

### 📊 Test Scripts

| Test Type | Command | What It Tests |
|-----------|---------|---------------|
| Build | npm run build | TypeScript, Vite |
| Security (6 scenarios) | test-security-complete.sh | Auth, F5, multi-user |
| F5 Advanced | test-f5-advanced.sh | Session persistence |
| F5 Basic | test-f5-session.sh | Simple login → F5 |

---

### 🔍 How to Debug

**If test fails:**

```bash
# 1. Check logs
tail -f logs/backend.log
tail -f logs/frontend.log

# 2. Check browser console (F12)
// Look for:
// 💾 INIT: User loaded
// 🔍 checkAuth: Validating
// ❌ Errors in red

# 3. Check localStorage
// F12 → Application → Local Storage
// Should have: auth_token + user JSON

# 4. Test API
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/auth/me
```

---

# 7. OPERATIONS & DEPLOYMENT

### 🚀 Deployment Checklist

**Before deploying to production:**

- [ ] All code is committed
- [ ] All tests pass (`npm run build`, `test-security-complete.sh`)
- [ ] No console errors in browser (F12)
- [ ] No console errors in terminal
- [ ] All documentation is updated
- [ ] README.md reflects current state

### 📜 Initialization Commands

```bash
# START THE SYSTEM
./START.sh
# Does everything:
# 1. Stops existing containers
# 2. Starts PostgreSQL
# 3. Starts Backend (5000)
# 4. Starts Frontend (3000)
# 5. Shows credentials

# STOP THE SYSTEM
./STOP.sh
# Stops all services cleanly

# BUILD FOR PRODUCTION
npm run build
# Creates optimized /dist folder
```

---

### 📍 Service URLs

| Service | URL | Check With |
|---------|-----|-----------|
| Frontend | http://localhost:3000 | Browser (loads Home) |
| Backend API | http://localhost:5000/api | curl to /auth/me |
| PostgreSQL | localhost:5432 | psql -U postgres |

---

### 🔧 Common Issues & Fixes

| Problem | Cause | Solution |
|---------|-------|----------|
| Port 3000 in use | Another process using port | `lsof -i :3000 && kill PID` |
| Port 5000 in use | Backend not shut down | `./STOP.sh` then `./START.sh` |
| PostgreSQL not responding | Docker not started | `docker-compose up -d` |
| Build errors | Stale modules | `rm -rf node_modules && npm install` |
| Login fails | Build cache stale | `npm run build && ./START.sh` |

---

# 8. FILE LOCATIONS & STRUCTURE

### 📂 Critical Files to Know

| File | Purpose | Edit If... |
|------|---------|-----------|
| [src/App.jsx](src/App.jsx) | Master app, renders Header ONCE | Adding routes, changing layout |
| [src/components/Header.jsx](src/components/Header.jsx) | Header 3-scenario logic | Changing header appearance |
| [src/hooks/useAuthStore.js](src/hooks/useAuthStore.js) | Auth State machine | Changing auth ⚠️ CRITICAL |
| [src/components/DashboardLayout.jsx](src/components/DashboardLayout.jsx) | Sidebar container `top-20` | Changing sidebar layout |
| [src/contexts/ThemeContext.jsx](src/contexts/ThemeContext.jsx) | Dark/Light mode | Changing theme logic |
| [backend/src/controllers/authController.js](backend/src/controllers/authController.js) | Login API | Changing auth endpoints |

---

### 📚 Documentation Files to Read

| File | Read If You're... |
|------|-----------------|
| [GUIA_BOAS_PRATICAS.md](GUIA_BOAS_PRATICAS.md) | Modifying ANY code |
| [POLITICA_AUTENTICACAO.md](POLITICA_AUTENTICACAO.md) | Touching auth |
| [CORRECAO_SESSION_F5_CRITICAL.md](CORRECAO_SESSION_F5_CRITICAL.md) | Fixing session issues |
| [HEADER_LOGICA_ATUALIZADA.md](HEADER_LOGICA_ATUALIZADA.md) | Changing header behavior |
| [VALIDACAO_FINAL_SISTEMA.md](VALIDACAO_FINAL_SISTEMA.md) | Validating changes |

---

# 9. COMMAND QUICK REFERENCE

```bash
# ===== SYSTEM MANAGEMENT =====
./START.sh                    # Start everything
./STOP.sh                     # Stop everything

# ===== BUILDING =====
npm run build                 # Build for production
npm run preview               # Preview production locally

# ===== TESTING =====
bash test-security-complete.sh  # 6 security scenarios
bash test-f5-advanced.sh        # F5 persistence
bash test-f5-session.sh         # Quick test

# ===== DATABASE =====
npm run prisma:migrate        # Run migrations
npm run prisma:studio         # Visual editor
node criar-usuarios-teste.js  # Create test users

# ===== LOGS =====
tail -f logs/backend.log      # Backend logs
tail -f logs/frontend.log     # Frontend logs
tail -f logs/*.log            # All logs
```

---

# 10. DECISION TREES

### 🌳 "I need to add a new feature"

```
1. What type of feature?
   ├─ Authentication/Security?
   │   └─ READ: Section 4 + FORBIDDEN OPERATIONS (Section 1)
   │
   ├─ New Page?
   │   ├─ is it protected?
   │   │   ├─ YES → Use DashboardLayout + ProtectedRoute
   │   │   └─ NO → Just create page, render in App.jsx
   │   └─ Dark mode? → Check every color has dark:
   │
   ├─ Header/Nav change?
   │   └─ Go to src/components/Header.jsx, READ MANDATORY PATTERNS
   │
   ├─ Sidebar/Layout?
   │   └─ Go to DashboardLayout.jsx
   │
   ├─ Database model?
   │   └─ Edit backend/prisma/schema.prisma, then migrate
   │
   └─ API endpoint?
       └─ Edit backend/src/routes/, add auth middleware if needed

2. After creating:
   └─ Run: npm run build
   └─ Run: test-security-complete.sh
   └─ Test in browser (F12 console)
   └─ Test in light + dark mode
```

---

### 🌳 "A test is failing"

```
1. Which test?
   ├─ npm run build → TypeScript error
   │   └─ Check error message, fix code, run again
   │
   ├─ test-security-complete.sh → Auth failed
   │   └─ Check: Did you touch useAuthStore.js?
   │   └─ Run: bash test-f5-session.sh for details
   │   └─ Check: localStorage has auth_token + user?
   │
   ├─ test-f5-advanced.sh → F5 broke
   │   └─ CHECK: localStorage persists? (F12 Application)
   │   └─ CHECK: console shows "💾 INIT: User loaded"?
   │   └─ CHECK: userType still correct after F5?
   │
   └─ Browser won't load
       └─ Backend crashed? → tail -f logs/backend.log
       └─ Frontend error? → F12 Console
       └─ Port conflict? → ./STOP.sh && ./START.sh

2. If still failing:
   └─ READ error message carefully
   └─ Search documentation (Ctrl+F)
   └─ CHECK FORBIDDEN OPERATIONS (Section 1)
   └─ VERIFY MANDATORY PATTERNS (Section 2)
```

---

### 🌳 "I need to fix a security issue"

```
1. What's the issue?
   ├─ User accessing others' data?
   │   └─ Check middleware (authenticateToken)
   │   └─ Check WHERE filters in Prisma
   │
   ├─ Session not persisting on F5?
   │   └─ READ: CORRECAO_SESSION_F5_CRITICAL.md
   │   └─ Check: useAuthStore.js lines 85-140
   │   └─ Run: test-f5-advanced.sh
   │
   ├─ User switching types?
   │   └─ Are you clearing localStorage on error? NO!
   │   └─ Are you defaulting to embarcador? NO!
   │
   └─ Password exposure?
       └─ Passwords in localStorage? NEVER!
       └─ Tokens set HttpOnly? CHECK!
       └─ Passwords in logs? NEVER!

2. AFTER security fix:
   └─ Run: npm run build
   └─ Run: bash test-security-complete.sh
   └─ READ: GUIA_BOAS_PRATICAS.md again
```

---

## 📞 SUPPORT & ESCALATION

### If something breaks:

1. **Read sections 1-3 of this guidebook** (10 min)
2. **Check relevant decision tree** (5 min)
3. **Run appropriate test** (2 min)
4. **If still broken:** Check documentation links below

### Key Documents by Situation:

| Situation | Read This |
|-----------|-----------|
| "I don't know where to start" | Sections 1-3 of THIS document |
| "F5 refresh breaks session" | [CORRECAO_SESSION_F5_CRITICAL.md](CORRECAO_SESSION_F5_CRITICAL.md) |
| "User switching types" | [CORRECOES_SEGURANCA_v3.md](CORRECOES_SEGURANCA_v3.md) |
| "Header layout is wrong" | [HEADER_LOGICA_ATUALIZADA.md](HEADER_LOGICA_ATUALIZADA.md) |
| "Don't know if change works" | [VALIDACAO_FINAL_SISTEMA.md](VALIDACAO_FINAL_SISTEMA.md) |

---

## 🎓 FOUR CRITICAL SKILLS FOR AGENTS

### SKILL 1: Authentication & Security ⭐⭐⭐⭐⭐

**Proficiency:** Must be EXPERT  

**What you MUST know:**
- ❌ Never create mock users
- ❌ Never clear localStorage on error
- ✅ F5 refresh MUST keep session
- ✅ localStorage must survive errors
- ✅ Use `user?.userType`, not `user?.role`
- ✅ Backend is source of truth

**How to verify:**
- [ ] Can explain why `localStorage.clear()` on F5 is forbidden
- [ ] Can run `test-security-complete.sh` and pass all 6 tests
- [ ] Can identify a mock user vulnerability in code

---

### SKILL 2: Component Structure ⭐⭐⭐⭐⭐

**Proficiency:** Must be EXPERT  

**What you MUST know:**
- ❌ Header renders ONCE in App.jsx (NEVER duplicate)
- ❌ Sidebar never starts at `top-0` (ALWAYS `top-20`)
- ❌ Never hardcode `userType="embarcador"`
- ✅ Every color needs `dark:` variant
- ✅ DashboardLayout wraps protected pages
- ✅ ProtectedRoute guards access

**How to verify:**
- [ ] Can create a new page without duplicating Header
- [ ] Can fix "text invisible in light mode" bug
- [ ] Can identify hardcoded `userType="embarcador"`

---

### SKILL 3: Testing & Validation ⭐⭐⭐⭐

**Proficiency:** Must be COMPETENT  

**What you MUST know:**
- ✅ Build must pass: `npm run build`
- ✅ Security tests: `test-security-complete.sh` (6/6)
- ✅ F5 persistence: `test-f5-advanced.sh`
- ✅ Browser console: must be clean
- ✅ localStorage: must have `auth_token` + `user`

**How to verify:**
- [ ] Can run all 3 tests and understand output
- [ ] Can debug failing test via logs
- [ ] Can verify change worked in browser

---

### SKILL 4: Operations & Deployment ⭐⭐⭐⭐

**Proficiency:** Must be COMPETENT  

**What you MUST know:**
- ✅ `./START.sh` starts everything
- ✅ `./STOP.sh` stops everything
- ✅ `npm run build` creates prod build
- ✅ Logs in `logs/` directory
- ✅ Database commands in Section 9

**How to verify:**
- [ ] Can start/stop system cleanly
- [ ] Can read logs to diagnose issues
- [ ] Can build for production

---

# 11. STARTUP SECURITY & ERROR PREVENTION

### 📋 CRITICAL FILES AFFECTING STARTUP

Any changes to these files can impact system initialization:

| File | Purpose | Error Risk | Protection |
|------|---------|-----------|-----------|
| `START.sh` | Orchestrates startup (ports 3000, 5000, 5432) | Port detection fails | ✅ Uses curl + lsof |
| `STOP.sh` | Ordered service shutdown | Containers don't stop | ✅ docker-compose down |
| `docker-compose.yml` | Defines containers + health checks | Services don't start | ✅ Healthcheck + depends_on |
| `backend/src/server.js` | Express + health endpoint | Backend doesn't respond | ✅ `/health` endpoint |
| `frontend/src/main.jsx` | Vite dev server | Frontend doesn't load | ✅ Vite config validated |
| `package.json` | Scripts and dependencies | Build fails silently | ✅ Fixed versions |

### 🛡️ PORT PROTECTION PROTOCOL

**NEVER modify ports without following this protocol:**

```bash
# 1. Check occupied ports BEFORE changing
lsof -i :3000 :5000 :5432

# 2. If occupied, free them:
pkill -f "npm run dev"           # Frontend (3000)
docker-compose down              # Backend + DB (5000, 5432)
sleep 2                           # Wait for TIME-WAIT cleanup

# 3. If changing port in code:
#  a) Update docker-compose.yml (ports: "NEW:5000")  
#  b) Update START.sh (BACKEND_PORT=NEW)
#  c) Update .env files
#  d) Test with: curl http://localhost:NEW/api

# 4. NEVER change without testing init:
./START.sh 2>&1 | grep -E "Backend|Frontend|PostgreSQL"
```

### 🔧 ROBUST FUNCTION: wait_for_service()

**In START.sh (lines 62-95):**

```bash
wait_for_service() {
    local PORT=$1
    local SERVICE=$2
    local URL="http://localhost:${PORT}"
    local MAX_ATTEMPTS=120
    local ATTEMPT=0
    
    echo -e "${YELLOW}  Awaiting ${SERVICE} on port ${PORT}...${NC}"
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        # Try simple request to service (PRIORITY 1)
        if timeout 2 curl -s -f "${URL}" > /dev/null 2>&1 || \
           timeout 2 curl -s "${URL}" | grep -q "." 2>/dev/null; then
            echo -e "${GREEN}  ✓ ${SERVICE} responding on port ${PORT}!${NC}"
            return 0
        fi
        
        # Fallback: check if port is open with lsof (PRIORITY 2)
        if lsof -i:${PORT} >/dev/null 2>&1; then
            echo -e "${GREEN}  ✓ ${SERVICE} running on port ${PORT}!${NC}"
            return 0
        fi
        
        ATTEMPT=$((ATTEMPT + 1))
        if [ $((ATTEMPT % 10)) -eq 0 ]; then
            echo -e "${YELLOW}  ⏳ ${ATTEMPT}s waiting ${SERVICE}...${NC}"
        fi
        sleep 1
    done
    
    echo -e "${RED}  ✗ Timeout: ${SERVICE} did not respond after ${MAX_ATTEMPTS}s${NC}"
    return 1
}
```

**Why it works:**
- ✅ Tries HTTP first (more reliable than lsof)
- ✅ Fallback to lsof if HTTP fails
- ✅ Tests port BEFORE testing connectivity
- ✅ Retry for 120 seconds (2 min full timeout)
- ✅ Progress every 10s

### ✅ VALIDATION: Backend Health Check

**In docker-compose.yml (backend service):**

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
  interval: 10s        # Check every 10s
  timeout: 5s          # Fail if no response in 5s
  retries: 5           # Fail after 5 failures = 50s total
  start_period: 30s    # Wait 30s BEFORE first check
```

**Backend health endpoint in backend/src/server.js:**

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

**Validate:** `curl -s http://localhost:5000/health | jq .`

### 🧪 MANDATORY POST-STARTUP TESTS

After any changes to START.sh, docker-compose.yml or backend config:

```bash
# 1. Clean startup
bash STOP.sh
sleep 2
bash START.sh 2>&1 | tail -50

# 2. Validate connectivity
echo "🔍 CONNECTIVITY VALIDATION"
curl -s http://localhost:5000/health | jq .
curl -s http://localhost:3000 | grep -q "<html>" && echo "✅ Frontend OK"
pg_isready -h localhost -p 5432 -U postgres && echo "✅ Database OK"

# 3. Validate localStorage F5
bash test-f5-advanced.sh

# 4. Validate security
bash test-security-complete.sh
```

### 🚨 QUICK TROUBLESHOOTING

| Error | Cause | Solution |
|-------|-------|----------|
| `Timeout: Backend did not respond` | Container runs but port not listening | Increase start_period in healthcheck |
| `Port 5000 already in use` | Previous process didn't stop | `pkill -9 -f "node.*5000"` |
| `PostgreSQL not responding` | Incompatible version | `docker-compose down -v`; restart |
| `Frontend doesn't load` | Vite server stuck | `pkill -f "npm run dev"`; restart |
| `curl: (7) Failed to connect` | Port exists but service died | Check `docker logs acheimeufrete-backend-1` |

### 📊 GUARANTEED STARTUP FLOW

```
START.sh executes (critical order):
│
├─ Step 1: Free ports
│   ├─ Kill previous processes
│   ├─ docker-compose down (with sleep 2)
│   └─ Verify ports free
│
├─ Step 2: Start PostgreSQL
│   ├─ docker-compose up -d postgres
│   ├─ wait_for_service 5432 "PostgreSQL"
│   └─ Validate pg_isready (30s timeout + healthcheck)
│
├─ Step 3: Start Backend
│   ├─ docker-compose up -d backend (waits for postgres healthy)
│   ├─ wait_for_service 5000 "Backend" 
│   │   ├─ Try curl 120 times (each 1s)
│   │   └─ Fallback lsof if curl fails
│   └─ test_http "http://localhost:5000/api"
│
├─ Step 4: Start Frontend
│   ├─ npm run dev (background PID)
│   ├─ wait_for_service 3000 "Frontend"
│   └─ test_http "http://localhost:3000"
│
└─ Step 5: Final validation
    ├─ Verify docker ps (3 containers)
    ├─ Test http responses (3 endpoints)
    └─ SUCCESS ✅
```

### 🔐 SECURITY GUARANTEES

**GUARANTEED by design:**

✅ **Port Binding Security**
- Detects ports via HTTP BEFORE using lsof
- Prioritizes connectivity test over port enumeration
- 120s timeout = 2 min for complete initialization

✅ **Service Isolation** 
- Docker containers isolated by network
- Internal healthcheck ensures only healthy services
- depends_on guarantees initialization order

✅ **Session Persistence (F5 Refresh)**
- localStorage NEVER deleted on error
- useAuthStore.js preserves offline state
- test-f5-advanced.sh validates functionality

✅ **Error Recovery**
- START.sh with set -e (fail fast)
- STOP.sh without set -e (always cleans up)
- Retry loops in test_http (up to 10 attempts)

✅ **Continuous Healthcheck**
- docker-compose healthcheck every 10s
- Fails after 5 failures = 50s
- start_period 30s guarantees init time

### 📝 CHECKLIST: Before ANY STARTUP ALTER

- [ ] Read this section completely (SECTION 11)
- [ ] Verified current file in START.sh
- [ ] Verified docker-compose.yml healthcheck
- [ ] Verified /health endpoint in backend
- [ ] Tested change with: `bash STOP.sh && bash START.sh`
- [ ] Executed: `./TEST_STARTUP.sh` (must pass 100%)
- [ ] Executed: `test-security-complete.sh` (6/6 tests)
- [ ] Did not modify port without updating 3+ files
- [ ] Documented change in this file (SECTION 11)

---

## 📝 VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2025-02-10 | Added SECTION 11: Startup Security & Port Protection |
| 1.0 | 2025-02-09 | Initial release: All 4 skills documented, Security specs |

---

## ✅ AGENT FINAL CHECKLIST

**Before saying "I'm ready to work on this codebase":**

- [ ] I have read sections 1-3 of this guidebook (FORBIDDEN, MANDATORY, GUARANTEES)
- [ ] I have read GUIA_BOAS_PRATICAS.md completely
- [ ] I can explain the 3 Header scenarios from memory
- [ ] I know why F5 refresh must keep session (and how to test it)
- [ ] I know what `top-20` means and why it matters
- [ ] I can run `test-security-complete.sh` and understand all 6 tests
- [ ] I have never seen a forbidden operation in Section 1
- [ ] I have never hardcoded `userType="embarcador"`
- [ ] I understand why `localStorage.clear()` mid-session is catastrophic
- [ ] I can build + test before committing

**If you can check all boxes: YOU ARE READY TO CONTRIBUTE** 🚀
