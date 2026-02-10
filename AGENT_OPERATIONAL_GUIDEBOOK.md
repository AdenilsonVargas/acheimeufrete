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
  
  // Login method
  login: async (email, password) => {
    try {
      const response = await apiClient.auth.login({ email, password });
      const { token, user } = response;
      
      // Store token and user
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token, error: null });
      console.log('✅ Login successful:', { email: user?.email, userType: user?.userType });
      return { success: true };
    } catch (error) {
      console.error('❌ Login failed:', error);
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },
  
  // Logout method
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    set({ user: null, token: null, error: null });
    console.log('✅ Logout successful');
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
      <Header isAuthenticated={!!user} userType={user?.userType} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

// 3. IN PROTECTED ROUTE
function ProtectedRoute({ children }) {
  const { user, token } = useAuth();
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user?.email || !user?.userType) {
    console.error('❌ Invalid user data:', user);
    return <Navigate to="/login" replace />;
  }
  
  return children;
}
```

**Key Requirements:**
- ✅ User loaded from localStorage on init
- ✅ checkAuth() never clears localStorage on error
- ✅ Always validate `user?.email AND user?.userType`
- ✅ Never use mock/default users
- ✅ Use `user?.userType` not `user?.role`

---

### ✅ Header Pattern

**The Header MUST be rendered ONCE in the main App component:**

```javascript
// ✅ CORRECT: App.jsx
function App() {
  const { user } = useAuth();
  
  return (
    <>
      <Header 
        isAuthenticated={!!user} 
        userType={user?.userType}
        userName={user?.name}
      />
      <main className="min-h-screen">
        <Routes>
          {/* Routes here */}
        </Routes>
      </main>
    </>
  );
}

// ✅ CORRECT: Header.jsx
function Header({ isAuthenticated, userType, userName }) {
  return (
    <header className="fixed top-0 left-0 right-0 h-20 z-50 bg-white dark:bg-slate-800">
      {/* Header content */}
    </header>
  );
}
```

**Key Requirements:**
- ✅ Header rendered ONCE in App.jsx
- ✅ Header receives `isAuthenticated` and `userType` as props
- ✅ Header is fixed with `top-0` and `h-20` (80px)
- ✅ Never import Header in individual pages

---

### ✅ Dashboard Layout Pattern

**Dashboard layout with sidebar:**

```javascript
// ✅ CORRECT: Dashboard.jsx
function Dashboard() {
  return <DashboardLayout />;
}

// ✅ CORRECT: DashboardLayout.jsx
function DashboardLayout() {
  const { user } = useAuth();
  
  return (
    <div className="flex min-h-screen pt-20"> {/* pt-20 = 80px header height */}
      {/* Sidebar */}
      <aside className="fixed left-0 top-20 w-64 h-[calc(100vh-5rem)] bg-slate-100 dark:bg-slate-900">
        <nav>
          {/* Navigation items based on user?.userType */}
        </nav>
      </aside>
      
      {/* Main content */}
      <main className="ml-64 flex-1 p-6">
        {/* Dashboard content */}
      </main>
    </div>
  );
}
```

**Key Requirements:**
- ✅ Sidebar starts at `top-20` (below 80px header)
- ✅ Sidebar height is `h-[calc(100vh-5rem)]`
- ✅ Main content has `ml-64` (sidebar width)
- ✅ Container has `pt-20` for header spacing

---

### ✅ Dark Mode Pattern

**All components must support dark mode:**

```javascript
// ✅ CORRECT: Component with dark mode
function MyComponent() {
  return (
    <div className="bg-white dark:bg-slate-800">
      <h1 className="text-slate-900 dark:text-white">Title</h1>
      <p className="text-slate-600 dark:text-slate-300">Content</p>
      <button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
        Click me
      </button>
    </div>
  );
}
```

**Key Requirements:**
- ✅ Always use `dark:` prefix for dark mode styles
- ✅ Text: `text-slate-900 dark:text-white`
- ✅ Backgrounds: `bg-white dark:bg-slate-800`
- ✅ Never use JavaScript for color switching

---

# 3. ARCHITECTURE GUARANTEES

**What the system GUARANTEES you can rely on:**

### 🏗️ The 3 Scenarios of Header

**The header has exactly 3 states:**

1. **Not Authenticated** - Public pages (/, /login, /register)
   - Shows: Logo + Login/Register buttons
   - No user menu
   
2. **Authenticated as Embarcador** - Shipper dashboard
   - Shows: Logo + Dashboard + Cargas + Cotações + User menu
   - User menu shows: Perfil, Configurações, Sair
   
3. **Authenticated as Transportador** - Carrier dashboard
   - Shows: Logo + Dashboard + Cotações + Frota + User menu
   - User menu shows: Perfil, Configurações, Sair

**Implementation:**
```javascript
{isAuthenticated ? (
  userType === 'transportador' ? (
    // Transportador menu
  ) : (
    // Embarcador menu (default)
  )
) : (
  // Public menu
)}
```

---

### 🗄️ Master Storage Pattern

**localStorage MUST contain:**
- `auth_token` - JWT token (required for API calls)
- `user` - JSON string with: `{ email, userType, name, id }`

**Rules:**
- ✅ Both set on successful login
- ✅ Both read on app init
- ✅ Both cleared ONLY on explicit logout
- ❌ Never clear on error/network failure

---

### 🔐 Authentication Guarantee

**The system GUARANTEES:**
- User is EITHER authenticated OR not (no partial states)
- If `user` exists, it MUST have `email` AND `userType`
- If `token` exists, it MUST be in localStorage
- checkAuth() NEVER removes valid localStorage data

---

### 📱 Responsive Guarantee

**The system GUARANTEES:**
- Mobile: < 640px (sidebar collapses to hamburger menu)
- Tablet: 640px - 1024px (sidebar visible)
- Desktop: > 1024px (full layout)

**Use Tailwind breakpoints:**
- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px
- `xl:` - 1280px

---

### 🌓 Dark Mode Guarantee

**The system GUARANTEES:**
- Dark mode controlled by Tailwind's `dark:` class
- Uses `prefers-color-scheme` media query
- All components use semantic Tailwind classes
- No JavaScript color switching needed

---

# 4. AUTHENTICATION & SECURITY

### 🔐 Security Checklist (Before Any Auth Change)

**MUST verify:**
- [ ] No passwords stored in frontend
- [ ] No mock/hardcoded users
- [ ] checkAuth() preserves localStorage on error
- [ ] Token validated on every protected route
- [ ] user?.email AND user?.userType both validated
- [ ] No auto-login without credentials

---

### 🎯 Auth Implementation Rules

**Rule 1: Single Source of Truth**
- Auth state lives in `useAuthStore`
- All components read from store
- Never duplicate auth logic

**Rule 2: Token Validation**
```javascript
// On app init
useEffect(() => {
  checkAuth();
}, []);

// On protected route
if (!token || !user?.email || !user?.userType) {
  return <Navigate to="/login" />;
}
```

**Rule 3: Error Handling**
```javascript
// ✅ CORRECT
catch (error) {
  console.error('Auth error:', error);
  set({ error: error.message });
  // Keep localStorage!
}

// ❌ WRONG
catch (error) {
  localStorage.clear();  // NO!
}
```

---

### 🛡️ Vulnerability Checklist

**Common vulnerabilities to avoid:**
- [ ] XSS - Never use `dangerouslySetInnerHTML` without sanitization
- [ ] CSRF - Include CSRF token in API requests
- [ ] Session fixation - Regenerate token on login
- [ ] Clickjacking - Use X-Frame-Options header
- [ ] Insecure storage - Never store sensitive data in localStorage

---

# 5. COMPONENTS & STRUCTURE

### 📁 Component Organization

```
src/
├── components/
│   ├── Header.jsx           # Main header (rendered once in App)
│   ├── DashboardLayout.jsx  # Dashboard with sidebar
│   ├── ProtectedRoute.jsx   # Auth guard
│   └── ui/                  # Reusable UI components
│       ├── Button.jsx
│       ├── Card.jsx
│       └── Modal.jsx
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   └── ...
├── stores/
│   └── useAuthStore.js      # Auth state management
├── services/
│   └── apiClient.js         # API communication
└── App.jsx                  # Main app component
```

---

### 🎨 Component Best Practices

**DO:**
- ✅ Use functional components with hooks
- ✅ Extract reusable logic into custom hooks
- ✅ Use Tailwind classes for styling
- ✅ Implement proper prop-types or TypeScript
- ✅ Handle loading and error states

**DON'T:**
- ❌ Create duplicate components
- ❌ Mix business logic with presentation
- ❌ Use inline styles (use Tailwind)
- ❌ Ignore accessibility (use ARIA labels)

---

### 🧩 UI Component Standards

**All UI components must:**
- Support dark mode with `dark:` prefix
- Be responsive (mobile-first)
- Have proper ARIA labels
- Handle loading states
- Show error messages clearly

**Example:**
```javascript
function Button({ children, onClick, loading, disabled, variant = 'primary' }) {
  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors";
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white",
    secondary: "bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white"
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} disabled:opacity-50 disabled:cursor-not-allowed`}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
```

---

# 6. TESTING & VALIDATION

### 🧪 Testing Strategy

**Test Levels:**
1. **Unit Tests** - Individual functions and components
2. **Integration Tests** - Component interactions
3. **E2E Tests** - Full user flows

**Minimum Coverage:**
- Auth logic: 90%+
- Business logic: 80%+
- UI components: 70%+

---

### ✅ Validation Checklist

**Before committing:**
- [ ] All tests pass
- [ ] No console errors
- [ ] Dark mode works
- [ ] Responsive on mobile/tablet/desktop
- [ ] Auth flows work correctly
- [ ] No security vulnerabilities

---

### 🔍 Manual Testing Steps

**Auth Testing:**
1. Login with valid credentials ✓
2. Login with invalid credentials ✗
3. Refresh page (F5) - session persists ✓
4. Logout - clears session ✓
5. Access protected route without auth - redirects to login ✓

**UI Testing:**
1. Toggle dark mode ✓
2. Resize window (mobile, tablet, desktop) ✓
3. Navigate between pages ✓
4. Check header shows correct menu for userType ✓

---

# 7. OPERATIONS & DEPLOYMENT

### 🚀 Deployment Process

**Steps:**
1. Run tests: `npm test`
2. Build: `npm run build`
3. Review build output
4. Deploy to staging
5. Run smoke tests
6. Deploy to production
7. Monitor logs

---

### 📊 Monitoring

**What to monitor:**
- API response times
- Error rates
- User sessions
- Auth failures
- Page load times

**Tools:**
- Logs: Check application logs
- Metrics: Monitor performance
- Alerts: Set up error alerts

---

### 🐛 Debugging

**Common issues:**

**Issue: User loses session on refresh**
- Check: Is localStorage being cleared?
- Fix: Ensure checkAuth() preserves localStorage

**Issue: Wrong menu shows for user**
- Check: Is `userType` correct?
- Fix: Verify `user?.userType` not `user?.role`

**Issue: Dark mode not working**
- Check: Are `dark:` prefixes used?
- Fix: Add `dark:` prefix to all color classes

---

# 8. FILE LOCATIONS & STRUCTURE

### 📂 Key Files

**Authentication:**
- `/src/stores/useAuthStore.js` - Auth state management
- `/src/services/apiClient.js` - API communication
- `/src/components/ProtectedRoute.jsx` - Route guard

**UI:**
- `/src/components/Header.jsx` - Main header
- `/src/components/DashboardLayout.jsx` - Dashboard layout
- `/src/App.jsx` - Main app component

**Configuration:**
- `.env` - Environment variables
- `tailwind.config.js` - Tailwind configuration
- `package.json` - Dependencies

**Documentation:**
- `/docs/PROJECT_STRUCTURE.md` - Project structure
- `/docs/technical/` - Technical documentation
- `README.md` - Project overview

---

### 🗂️ Folder Structure

```
/
├── src/
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── stores/          # State management
│   ├── services/        # API services
│   ├── utils/           # Utility functions
│   └── App.jsx          # Main app
├── docs/
│   ├── technical/       # Technical docs
│   ├── api/             # API docs
│   └── architecture/    # Architecture docs
├── tests/               # Test files
└── public/              # Static assets
```

---

# 9. COMMAND QUICK REFERENCE

### 💻 Development Commands

```bash
# ===== INSTALLATION =====
npm install              # Install dependencies
npm ci                   # Clean install (CI/CD)

# ===== DEVELOPMENT =====
npm run dev              # Start dev server
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only

# ===== BUILDING =====
npm run build            # Build for production
npm run build:check      # Build and check output

# ===== TESTING =====
npm test                 # Run all tests
npm run test:unit        # Run unit tests
npm run test:e2e         # Run E2E tests

# ===== DATABASE =====
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:reset         # Reset database

# ===== LOGS =====
npm run logs             # View logs
npm run logs:error       # View error logs
```

---

# 10. DECISION TREES

### 🌳 "I need to add a new feature"

```
START: New feature request
│
├─ Does it require authentication?
│  ├─ YES → Read Section 4 (Authentication & Security)
│  │       └─ Implement using ✅ Authentication Pattern
│  │
│  └─ NO → Continue
│
├─ Does it involve UI components?
│  ├─ YES → Read Section 5 (Components & Structure)
│  │       ├─ Is it a new page?
│  │       │  └─ Create in /src/pages/
│  │       └─ Is it a reusable component?
│  │          └─ Create in /src/components/ui/
│  │
│  └─ NO → Continue
│
├─ Does it modify the header/layout?
│  ├─ YES → ⚠️ STOP! Read Section 1 (Forbidden Operations)
│  │       └─ Follow ✅ Header Pattern
│  │
│  └─ NO → Continue
│
├─ Implement feature
├─ Write tests (Section 6)
├─ Test manually
└─ Commit and deploy (Section 7)
```

---

### 🌳 "A test is failing"

```
START: Test failure
│
├─ Is it an auth test?
│  ├─ YES → Check:
│  │       ├─ Is user being loaded from localStorage?
│  │       ├─ Is checkAuth() preserving localStorage?
│  │       ├─ Are you checking user?.userType not user?.role?
│  │       └─ Review Section 2 (Mandatory Patterns)
│  │
│  └─ NO → Continue
│
├─ Is it a UI test?
│  ├─ YES → Check:
│  │       ├─ Is Header rendered only once?
│  │       ├─ Are dark mode classes present?
│  │       ├─ Is component responsive?
│  │       └─ Review Section 5 (Components)
│  │
│  └─ NO → Continue
│
├─ Is it an integration test?
│  ├─ YES → Check:
│  │       ├─ Are all dependencies mocked correctly?
│  │       ├─ Is API returning expected data?
│  │       └─ Are async operations handled?
│  │
│  └─ NO → Debug specific test
│
└─ Fix and re-run tests
```

---

### 🌳 "I need to fix a security issue"

```
START: Security issue identified
│
├─ Is it authentication-related?
│  ├─ YES → ⚠️ CRITICAL!
│  │       ├─ Read Section 1 (Forbidden Operations)
│  │       ├─ Read Section 4 (Authentication & Security)
│  │       ├─ Check: Are passwords stored in frontend? ❌
│  │       ├─ Check: Are mock users present? ❌
│  │       ├─ Check: Is localStorage cleared on error? ❌
│  │       └─ Follow ✅ Authentication Pattern
│  │
│  └─ NO → Continue
│
├─ Is it data exposure?
│  ├─ YES → ⚠️ HIGH PRIORITY!
│  │       ├─ Remove sensitive data from frontend
│  │       ├─ Implement proper access controls
│  │       └─ Validate on backend
│  │
│  └─ NO → Continue
│
├─ Is it XSS/injection?
│  ├─ YES → ⚠️ HIGH PRIORITY!
│  │       ├─ Sanitize all user inputs
│  │       ├─ Use parameterized queries
│  │       └─ Escape output
│  │
│  └─ NO → Continue
│
├─ Fix vulnerability
├─ Test thoroughly
├─ Review with team
└─ Deploy immediately
```

---

# 11. STARTUP SECURITY & ERROR PREVENTION

### 📋 Critical Files That Influence Startup

**Files that affect app initialization:**
- `/src/App.jsx` - Main app component
- `/src/stores/useAuthStore.js` - Auth initialization
- `/src/main.jsx` - App entry point
- `.env` - Environment variables
- `vite.config.js` - Build configuration

**What to check:**
- [ ] checkAuth() called on app mount
- [ ] localStorage read on auth store init
- [ ] Error boundaries implemented
- [ ] API base URL configured correctly

---

### 🛡️ Port Protection Protocol

**Before changing ports:**
```bash
# 1. Check occupied ports
lsof -i :3000
lsof -i :5000

# 2. If occupied, free them:
kill -9 <PID>

# 3. If changing port in code:
#    a) Update .env (VITE_PORT=NEW)
#    b) Update vite.config.js
#    c) Update API base URL
#    d) Test with: curl http://localhost:NEW

# 4. NEVER change without testing
```

---

### 🔧 Robust Service Waiting

**Wait for backend before frontend starts:**
```javascript
// In App.jsx or main.jsx
async function waitForBackend() {
  const maxRetries = 10;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        console.log('✅ Backend is ready');
        return true;
      }
    } catch (error) {
      console.log(`⏳ Waiting for backend... (${retries + 1}/${maxRetries})`);
    }
    
    retries++;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.error('❌ Backend not available');
  return false;
}

// Use before rendering app
waitForBackend().then(ready => {
  if (ready) {
    ReactDOM.render(<App />, document.getElementById('root'));
  } else {
    ReactDOM.render(<ErrorPage />, document.getElementById('root'));
  }
});
```

---

### ✅ Backend Health Check

**Backend must expose health endpoint:**
```javascript
// Backend: /api/health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: db.isConnected(),
      cache: cache.isConnected()
    }
  });
});

// Frontend: Check health
async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    if (data.status === 'ok') {
      console.log('✅ Backend healthy:', data);
      return true;
    }
    
    console.warn('⚠️ Backend degraded:', data);
    return false;
  } catch (error) {
    console.error('❌ Backend unreachable:', error);
    return false;
  }
}
```

---

### 🧪 Mandatory Post-Startup Tests

**After every startup, verify:**
```bash
# 1. Clean startup
npm run dev
# Expected: No errors, both frontend and backend start

# 2. Validate connectivity
curl http://localhost:5000/api/health
# Expected: {"status":"ok"}

curl http://localhost:3000
# Expected: HTML page loads

# 3. Validate localStorage persistence (F5 test)
# - Login to app
# - Press F5
# - Verify: User still logged in
# Expected: Session persists

# 4. Validate security
# - Try accessing /dashboard without login
# Expected: Redirects to /login
```

---

### 🚨 Quick Troubleshooting

**Problem: "Cannot connect to backend"**
```bash
# Check if backend is running
lsof -i :5000

# Check backend logs
npm run logs

# Restart backend
npm run dev:backend
```

**Problem: "localStorage cleared on refresh"**
```javascript
// Check useAuthStore.js
// Ensure checkAuth() doesn't clear localStorage on error
catch (error) {
  console.error('Auth error:', error);
  // DON'T clear localStorage here!
}
```

**Problem: "Wrong user type displayed"**
```javascript
// Check components
// Use user?.userType NOT user?.role
{user?.userType === 'transportador' ? (
  // Transportador menu
) : (
  // Embarcador menu
)}
```

---

### 📊 Guaranteed Startup Flow

**The system guarantees this startup sequence:**

```
1. App.jsx mounts
   ↓
2. useAuthStore initializes
   ├─ Read localStorage('user')
   ├─ Read localStorage('auth_token')
   └─ Set initial state
   ↓
3. useEffect in App calls checkAuth()
   ├─ If token exists:
   │  ├─ Call API /auth/me
   │  ├─ Update store with user data
   │  └─ Log success
   └─ If token missing:
      └─ User stays logged out
   ↓
4. Header renders
   ├─ Shows correct menu for userType
   └─ Shows login/register if not authenticated
   ↓
5. Routes render
   ├─ Protected routes check auth
   └─ Redirect to /login if not authenticated
   ↓
6. App ready! ✅
```

---

### 🔐 Security Guarantees

**The system GUARANTEES:**

1. **No data loss on error**
   - checkAuth() NEVER clears localStorage on failure
   - User can work offline with cached credentials
   
2. **No unauthorized access**
   - All protected routes validate token
   - Invalid users redirected to login
   
3. **No session hijacking**
   - Tokens validated on every request
   - Expired tokens rejected by backend
   
4. **No XSS vulnerabilities**
   - All user input sanitized
   - No `dangerouslySetInnerHTML` without sanitization
   
5. **No CSRF attacks**
   - CSRF tokens included in API requests
   - Backend validates CSRF tokens

---

### 📝 Checklist: Before Any Startup Change

**MUST verify before modifying startup:**
- [ ] Read this section completely
- [ ] Understand current startup flow
- [ ] Identify what will change
- [ ] Plan rollback strategy
- [ ] Test in local environment first
- [ ] Verify health checks pass
- [ ] Verify auth persists on F5
- [ ] Check for console errors
- [ ] Validate with team
- [ ] Document the change

---

## 📝 VERSION HISTORY

**v1.1 (2025-02-10)**
- Updated date to 2025-02-10
- Clarified version number
- Enhanced startup security section

**v1.0 (2025-02-09)**
- Initial release
- Complete operational guidelines
- All critical sections included

---

## ✅ AGENT FINAL CHECKLIST

**Before completing any task:**
- [ ] Read sections 1-3 of this document
- [ ] Identified category of work
- [ ] Read relevant documentation
- [ ] Validated against forbidden operations
- [ ] Implemented following mandatory patterns
- [ ] Added/updated tests
- [ ] Tested manually
- [ ] No console errors
- [ ] Dark mode works
- [ ] Responsive design works
- [ ] Auth flows work correctly
- [ ] No security vulnerabilities introduced
- [ ] Documented significant changes
- [ ] Ready for code review

---

**END OF AGENT OPERATIONAL GUIDEBOOK v1.0**

For questions or clarifications, refer to:
- `/docs/technical/` - Technical documentation
- `/docs/PROJECT_STRUCTURE.md` - Project structure
- `README.md` - Project overview
