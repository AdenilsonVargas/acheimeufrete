# 🚀 AGENT OPERATIONAL GUIDEBOOK v1.0
## Achei Meu Frete - Agent Instructions & Best Practices

**Document Purpose:** This is the MASTER REFERENCE for all AI agents working on this platform.  
**Read First:** Before making ANY changes, the agent MUST read sections 1-3 completely.  
**Updated:** 2025-02-09  
**Version:** 1.0 - Stable & Production Ready

---

## 📑 QUICK INDEX

### 🔴 CRITICAL READING (Required - 10 min)
- [1. FORBIDDEN OPERATIONS](#1-forbidden-operations) - What NEVER to do
- [2. MANDATORY PATTERNS](#2-mandatory-patterns) - What ALWAYS to do  
- [3. ARCHITECTURE GUARANTEES](#3-architecture-guarantees) - What the system GUARANTEES

### � AUTO SKILL DETECTOR (NEW!)
- **[AUTO_SKILL_DETECTOR.md](AUTO_SKILL_DETECTOR.md)** - Automatic skill routing by keywords
  - Identify task keywords
  - Auto-map to SKILL (A-H)
  - Access correct documentation
  - **This activates automatically when you read sections 1-3!**

### �🟡 OPERATIONAL SKILLS (Essential - 20 min)
- [4. AUTHENTICATION & SECURITY](#4-authentication--security)
- [5. COMPONENTS & STRUCTURE](#5-components--structure)
- [6. TESTING & VALIDATION](#6-testing--validation)
- [7. OPERATIONS & DEPLOYMENT](#7-operations--deployment)

### 🟢 REFERENCE (As Needed - Look Up)
- [8. FILE LOCATIONS & STRUCTURE](#8-file-locations--structure)
- [9. COMMAND QUICK REFERENCE](#9-command-quick-reference)
- [10. DECISION TREES](#10-decision-trees)

---

## ⚠️ READING PROTOCOL FOR AGENTS

**EVERY TIME you receive a task:**

```
1. READ sections 1-3 of THIS DOCUMENT first (10 min)

2. 🔍 ACTIVATE AUTO SKILL DETECTOR (NEW!)
   ├─ Go to: AUTO_SKILL_DETECTOR.md
   ├─ Find keywords in your task description
   ├─ Cross-reference with "MAPEAMENTO AUTOMÁTICO" table
   ├─ Identify which SKILL (A-H) you need
   └─ Auto-link to correct SKILL document
   
   Examples:
   ├─ Quotation/frete/proposta? → SKILL A
   ├─ Payment/Stripe/pagamento? → SKILL B
   ├─ Form/validação/campo? → SKILL C
   ├─ Table/lista/relatório? → SKILL D
   ├─ Toast/modal/notificação? → SKILL E
   ├─ Chat/real-time/websocket? → SKILL F
   ├─ Admin/audit/moderação? → SKILL G
   └─ Produto/cliente/cadastro? → SKILL H

3. READ relevant documentation:
   ├─ Authentication task? → POLITICA_AUTENTICACAO.md + GUIA_BOAS_PRATICAS.md
   ├─ UI/Header task? → HEADER_LOGICA_ATUALIZADA.md
   ├─ Security issue? → CORRECAO_SESSION_F5_CRITICAL.md
   └─ Testing task? → VALIDACAO_FINAL_SISTEMA.md
   
   PLUS: Read the SKILL document identified in step 2!

4. IDENTIFY the category of work:
   ├─ Authentication/Security? → Section 4
   ├─ UI/Components? → Section 5
   ├─ Testing? → Section 6
   ├─ Deployment? → Section 7
   └─ Other? → Sections 8-10

5. CHECK decision trees (section 10)
6. VALIDATE against forbidden operations (section 1)
7. IMPLEMENT following mandatory patterns (section 2)
8. TEST per validation rules (section 6)
9. REPORT what you found + what you'll do BEFORE implementing
```

**Token savings:** Reading this first + using AUTO_SKILL_DETECTOR = prevents 100s of tokens in rework!

---

### 🔍 AUTO SKILL DETECTOR (AUTOMATIC SKILL ROUTING)

**What is it?** A mapping system that automatically identifies which SKILL (A-H) you need based on task keywords.

**How does it work?**
1. You receive a task
2. You read this guidebook (sections 1-3)
3. You automatically scan for keywords
4. AUTO_SKILL_DETECTOR maps keywords → SKILL
5. You access correct SKILL + implement

**Example Flow:**
```
Task: "Create payment checkout for quotation"

Keywords found:
├─ "payment" ✓
├─ "quotation" ✓
└─ "checkout" ✓

Auto-mapping:
├─ "payment" + "checkout" → SKILL B (Payment Stripe)
├─ "quotation" → SKILL A (Quotation Flow)
└─ Primary: SKILL B, Secondary: SKILL A

Result:
→ Read SKILLS_B_PAYMENT_STRIPE.md (main)
→ Read SKILLS_A_QUOTATION_FLOW.md Section 4 (context)
→ Implement payment checkout
```

**Full mapping:** [AUTO_SKILL_DETECTOR.md](AUTO_SKILL_DETECTOR.md)

---

# 1. FORBIDDEN OPERATIONS

**These cause security vulnerabilities, data loss, or system crashes. CRITICAL to avoid.**

### ❌ Authentication & Storage

| Don't Do | Why | What To Do Instead |
|----------|-----|-------------------|
| Create mock users in `useAuthStore.js` | Bypasses security; exposes fake users to production | Use backend only; fail if no backend connection |
| Store passwords in localStorage | Passwords must never be accessible to frontend | Ask backend to handle; frontend only stores tokens after login |
| Auto-login with hardcoded email | No user was authenticated; fake login | Only login via valid credentials from backend |
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
| Import Header in multiple pages | Renders duplicated; breaks styling | Render Header ONCE in `App.jsx` |
| Create TopBar/Navbar in components | Duplicates header; creates visual mess | Use Header from `App.jsx` with props |
| Hardcode menu items in components | Changes require touching 10+ files | Use Header component with `isAuthenticated` prop |
| Place Header inside Dashboard | Overlaps with sidebar; sidebar hidden | Header in App.jsx, Dashboard contains only DashboardLayout |
| Render sidebar without `top-20` class | Overlaps with 80px header | Sidebar MUST start at `top-20` (calc: 100vh-80px) |

**Code Examples - DON'T DO:**
```javascript
// ❌ FORBIDDEN: pages/Perfil.jsx
import Header from '@/components/Header'  // NO! Header goes in App.jsx only

// ❌ FORBIDDEN: components/Layout.jsx
<Header />
<Sidebar />  // Sidebar must be in DashboardLayout

// ❌ FORBIDDEN: DashboardLayout.jsx
<aside className="fixed left-0 top-0">  {/* WRONG! Must be top-20 */}
```

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

**Code Examples - DON'T DO:**
```javascript
// ❌ FORBIDDEN: All these are wrong
const userType = user?.role;  // DB field is userType, not role
const userType = user?.tipo;  // Wrong field name
<DashboardLayout userType="embarcador">  // Hardcoded - EVIL!
const userType = user?.userType || 'embarcador'  // Falls back to embarcador silently
```

---

# 2. MANDATORY PATTERNS

**These MUST be done this way. No exceptions.**

### ✅ Authentication Pattern

**The ONLY way to handle authentication in this system:**

```javascript
// 1. IN ZUSTAND STORE (src/hooks/useAuthStore.js)
export const useAuthStore = create((set) => ({
  // Load from localStorage on init (CRITICAL for F5 persistence)
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

// 2. IN APP.JSX
function InnerApp() {
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
const isPublicPage = ['/','/', '/sobre', '/faq', '/contato', '/login', '/cadastro']
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
        <DashboardButton userType={user?.userType} />
        <ThemeToggle />
        <LogoutButton />
      </div>
    )}
    
    {/* SCENARIO 3: Authenticated on dashboard (no menu) */}
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

**Sidebar must ALWAYS do this:**

```javascript
// src/components/DashboardLayout.jsx

export default function DashboardLayout({ children, userType }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-20">
      {/* Sidebar: MUST start at top-20 (80px), NOT top-0 */}
      <aside className={`
        fixed left-0 top-20 
        h-[calc(100vh-80px)]  /* Important: leaves space for header */
        w-64 
        bg-slate-900 text-white
        overflow-y-auto
      `}>
        <SidebarMenu userType={userType} />
      </aside>
      
      {/* Main content: respects sidebar width */}
      <main className="flex-1 md:ml-64 p-6">
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

**These are GUARANTEED by the system. Build on them.**

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

### 🔐 Security Checklist (Before Any Auth Change)

**BEFORE modifying authentication:**

- [ ] Read [POLITICA_AUTENTICACAO.md](POLITICA_AUTENTICACAO.md)
- [ ] Read [GUIA_BOAS_PRATICAS.md](GUIA_BOAS_PRATICAS.md)
- [ ] Read [CORRECAO_SESSION_F5_CRITICAL.md](CORRECAO_SESSION_F5_CRITICAL.md)
- [ ] Verify: Are you touching `useAuthStore.js`? YES → READ SECTION 1 of this doc
- [ ] Test: After change, does F5 refresh keep user logged in? (CRITICAL!)

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
  - User stays offline-authenticated locally
  - Next sync will handle logout properly
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
  │       └─ Other protected pages (with/without sidebar as needed)
  │
  └─ Footer (if exists)
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
└── .env                             (Configuration)
```

---

# 6. TESTING & VALIDATION

### ✅ Test Checklist (Before Commit)

**Every change MUST pass:**

```bash
# 1. BUILD TEST (Always first!)
npm run build
# ✅ PASS: "✓ built in 5.38s"
# ❌ FAIL: Any error means broken code

# 2. AUTH TEST (if touching authentication)
bash test-security-complete.sh
# ✅ PASS: "6/6 TESTES PASSARAM"
# ❌ FAIL: Fix before committing

# 3. F5 REFRESH TEST (if touching auth/session)
bash test-f5-advanced.sh
# ✅ PASS: "userType mantém 'transportador' após F5"
# ❌ FAIL: Your change broke session persistence!

# 4. MANUAL TEST (UI changes)
# - Open http://localhost:3000
# - Login as transportador@test.com / 123456
# - Press F5
# - Check console (F12) for logs
# - Test in light + dark mode
```

---

### 📊 Test Files Location

| Test | File | What It Tests |
|------|------|---------------|
| Security (6 scenarios) | [test-security-complete.sh](test-security-complete.sh) | Auth, F5, multi-user |
| F5 Advanced | [test-f5-advanced.sh](test-f5-advanced.sh) | Session persistence |
| F5 Basic | [test-f5-session.sh](test-f5-session.sh) | Simple login → F5 |

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

## � SECTION 11: SEGURANÇA DE STARTUP & PREVENÇÃO DE ERROS

### 📋 ARQUIVOS CRÍTICOS QUE INFLUENCIAM STARTUP

Qualquer alteração nestes arquivos pode impactar a inicialização do sistema:

| Arquivo | Propósito | Risco de Erro | Proteção |
|---------|----------|---------------|----------|
| `START.sh` | Orquestra inicialização (ports 3000, 5000, 5432) | Detecção de ports falha | ✅ Usa curl + lsof |
| `STOP.sh` | Parada ordenada de serviços | Containers não param | ✅ docker-compose down |
| `docker-compose.yml` | Define containers + health checks | Serviços não iniciam | ✅ Healthcheck + depends_on |
| `backend/src/server.js` | Express + health endpoint | Backend não responde | ✅ `/health` endpoint |
| `frontend/src/main.jsx` | Vite dev server | Frontend não carrega | ✅ Vite config validado |
| `package.json` | Scripts e dependências | Build falha silenciosamente | ✅ Versões fixas |

### 🛡️ PROTOCOLO DE PROTEÇÃO DE PORTAS

**NUNCA modifique portas sem seguir este protocolo:**

```bash
# 1. Verificar portas ocupadas ANTES de alteração
lsof -i :3000 :5000 :5432

# 2. Se ocupadas, liberar:
pkill -f "npm run dev"           # Frontend (3000)
docker-compose down              # Backend + DB (5000, 5432)
sleep 2                           # Wait for TIME-WAIT cleanup

# 3. Se mudar porta em código:
#  a) Update docker-compose.yml (ports: "NEW:5000")  
#  b) Update START.sh (BACKEND_PORT=NEW)
#  c) Update .env files
#  d) Testar com: curl http://localhost:NEW/api

# 4. NUNCA mude sem testar init:
./START.sh 2>&1 | grep -E "Backend|Frontend|PostgreSQL"
```

### 🔧 FUNÇÃO ROBUSTA: wait_for_service()

**Em START.sh (linhas 62-95):**

```bash
wait_for_service() {
    local PORT=$1
    local SERVICE=$2
    local URL="http://localhost:${PORT}"
    local MAX_ATTEMPTS=120
    local ATTEMPT=0
    
    echo -e "${YELLOW}  Aguardando ${SERVICE} na porta ${PORT}...${NC}"
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        # Tentar uma requisição simples ao serviço (PRIORIDADE 1)
        if timeout 2 curl -s -f "${URL}" > /dev/null 2>&1 || \
           timeout 2 curl -s "${URL}" | grep -q "." 2>/dev/null; then
            echo -e "${GREEN}  ✓ ${SERVICE} está respondendo na porta ${PORT}!${NC}"
            return 0
        fi
        
        # Fallback: verificar se a porta está aberta com lsof (PRIORIDADE 2)
        if lsof -i:${PORT} >/dev/null 2>&1; then
            echo -e "${GREEN}  ✓ ${SERVICE} está rodando na porta ${PORT}!${NC}"
            return 0
        fi
        
        ATTEMPT=$((ATTEMPT + 1))
        if [ $((ATTEMPT % 10)) -eq 0 ]; then
            echo -e "${YELLOW}  ⏳ ${ATTEMPT}s aguardando ${SERVICE}...${NC}"
        fi
        sleep 1
    done
    
    echo -e "${RED}  ✗ Timeout: ${SERVICE} não respondeu após ${MAX_ATTEMPTS}s${NC}"
    return 1
}
```

**Por que funciona:**
- ✅ Tenta HTTP primeiro (mais confiável que lsof)
- ✅ Fallback para lsof se HTTP falhar
- ✅ Testa a port ANTES de testar conectividade
- ✅ Retry por 120 segundos (2 min full timeout)
- ✅ Progresso a cada 10s

### ✅ VALIDAÇÃO: Health Check do Backend

**Em docker-compose.yml (backend service):**

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
  interval: 10s        # Check a cada 10s
  timeout: 5s          # Fail se não responder em 5s
  retries: 5           # Falha após 5 falhas = 50s total
  start_period: 30s    # Espera 30s ANTES de primeiro check
```

**Backend health endpoint em backend/src/server.js:**

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

**Validar:** `curl -s http://localhost:5000/health | jq .`

### 🧪 TESTES OBRIGATÓRIOS POS-STARTUP

Após qualquer mudança em START.sh, docker-compose.yml ou backend config:

```bash
# 1. Startup limpo
bash STOP.sh
sleep 2
bash START.sh 2>&1 | tail -50

# 2. Validar conectividade
echo "🔍 VALIDAÇÃO DE CONECTIVIDADE"
curl -s http://localhost:5000/health | jq .
curl -s http://localhost:3000 | grep -q "<html>" && echo "✅ Frontend OK"
pg_isready -h localhost -p 5432 -U postgres && echo "✅ Database OK"

# 3. Validar localStorage F5
bash test-f5-advanced.sh

# 4. Validar security
bash test-security-complete.sh
```

### 🚨 TROUBLESHOOTING RÁPIDO

| Erro | Causa | Solução |
|------|-------|----------|
| `Timeout: Backend não respondeu` | Container roda mas port não escuta | Aumentar start_period em healthcheck |
| `Port 5000 already in use` | Processo anterior não parou | `pkill -9 -f "node.*5000"` |
| `PostgreSQL não respondendo` | Versão incompatível | `docker-compose down -v`; restart |
| `Frontend não carrega` | Vite server travou | `pkill -f "npm run dev"`; restart |
| `curl: (7) Failed to connect` | Port existe mas serviço morreu | Checar `docker logs acheimeufrete-backend-1` |

### 📊 FLUXO GARANTIDO DE STARTUP

```
START.sh executa (ordem crítica):
│
├─ Step 1: Libera portas
│   ├─ Mata processos anteriores
│   ├─ docker-compose down (with sleep 2)
│   └─ Verifica portas livres
│
├─ Step 2: Inicia PostgreSQL
│   ├─ docker-compose up -d postgres
│   ├─ wait_for_service 5432 "PostgreSQL"
│   └─ Valida pg_isready (30s timeout + healthcheck)
│
├─ Step 3: Inicia Backend
│   ├─ docker-compose up -d backend (waits for postgres healthy)
│   ├─ wait_for_service 5000 "Backend" 
│   │   ├─ Tenta curl 120 vezes (cada 1s)
│   │   └─ Fallback lsof se curl falhar
│   └─ test_http "http://localhost:5000/api"
│
├─ Step 4: Inicia Frontend
│   ├─ npm run dev (background PID)
│   ├─ wait_for_service 3000 "Frontend"
│   └─ test_http "http://localhost:3000"
│
└─ Step 5: Validação final
    ├─ Verifica docker ps (3 containers)
    ├─ Testa http responses (3 endpoints)
    └─ SUCCESS ✅
```

### 🔐 GARANTIAS DE SEGURANÇA

**GARANTIDO por design:**

✅ **Port Binding Security**
- Detecta ports via HTTP ANTES de usar lsof
- Prioriza connectivity test sobre port enumeration
- 120s timeout = 2 min para inicialização completa

✅ **Service Isolation** 
- Docker containers isolados por rede
- healthcheck interno garante apenas serviços saudáveis
- depends_on garante ordem de inicialização

✅ **Session Persistence (F5 Refresh)**
- localStorage NUNCA deletado em erro
- useAuthStore.js preserva estado offline
- test-f5-advanced.sh valida funcionamento

✅ **Error Recovery**
- START.sh com set -e (falha rápido)
- STOP.sh sem set -e (sempre limpa)
- Retry loops em test_http (até 10 tentativas)

✅ **Healthcheck Continuous**
- docker-compose healthcheck a cada 10s
- Falha após 5 falhas = 50s
- start_period 30s garante init time

### 📝 CHECKLIST: Antes de qualquer ALTER em STARTUP

- [ ] Leu esta seção completamente (SECTION 11)
- [ ] Verificou arquivo atual em START.sh
- [ ] Verificou docker-compose.yml healthcheck
- [ ] Verificou /health endpoint no backend
- [ ] Testou mudança com: `bash STOP.sh && bash START.sh`
- [ ] Executou: `./TEST_STARTUP.sh` (deve passar 100%)
- [ ] Executou: `test-security-complete.sh` (6/6 testes)
- [ ] Não modificou porta sem atualizar 3+ arquivos
- [ ] Documentou mudança neste arquivo (SECTION 11)

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

---

**Last updated:** 2025-02-09  
**Status:** Production Ready  
**Questions?** Check Section 10 (Decision Trees) or documentation links in Section 8
