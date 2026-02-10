# 🤖 AGENT OPERATIONAL SYSTEM

## Quick Start for Agents

This document explains how the agent system ensures code quality and security in this project.

### ⚡ 30-Second Summary

1. **Read first:** [AGENT_OPERATIONAL_GUIDEBOOK.md](AGENT_OPERATIONAL_GUIDEBOOK.md) sections 1-3
2. **Auto-detect skill:** Use [AUTO_SKILL_DETECTOR.md](AUTO_SKILL_DETECTOR.md) (keywords → SKILL A-H)
3. **Read your skill:** Access correct SKILL document based on task
4. **Validate code:** `bash agent-rules-validator.sh`
5. **Initialize:** `npm run agent:init`
6. **Commit:** Git pre-commit hook validates automatically

---

## 🔍 NEW: AUTO SKILL DETECTOR

**Automatic skill identification system now active!**

When you receive a task:
1. Read AGENT_OPERATIONAL_GUIDEBOOK (sections 1-3)
2. Look at [AUTO_SKILL_DETECTOR.md](AUTO_SKILL_DETECTOR.md)
3. Find keywords in your task (quotation, payment, form, etc.)
4. Cross-reference with the mapping table
5. Auto-route to correct SKILL (A-H)
6. Read that SKILL and implement

**Example:**
```
Task: "Create payment checkout"

Keywords found: payment, checkout
→ AUTO_SKILL_DETECTOR maps to: SKILL B (Payment Stripe)
→ Read: SKILLS_B_PAYMENT_STRIPE.md
→ Implement checkout following SKILL B checklist
```

**All 8 Skills Available:**
- SKILL A: Quotation Flow
- SKILL B: Payment Stripe
- SKILL C: Forms & Validation
- SKILL D: Data Display
- SKILL E: Notifications & Feedback
- SKILL F: Real-Time Features
- SKILL G: Admin & Moderation
- SKILL H: Product & Customer

---

## 🚀 Getting Started

### Step 1: Initialize the Agent System

```bash
npm run agent:init
```

Output shows:
- ✅ All critical files exist
- 📖 Sections to read from guidebook
- 🧪 Available test commands
- ⚠️ Dangerous operations to avoid
- ✅ Mandatory patterns to follow

### Step 2: Read the Guidebook

```bash
cat AGENT_OPERATIONAL_GUIDEBOOK.md
```

**CRITICAL SECTIONS (Must read completely):**
- Section 1: FORBIDDEN OPERATIONS (12 rules)
- Section 2: MANDATORY PATTERNS (how to code)
- Section 3: ARCHITECTURE GUARANTEES (what system promises)

**Then read your skill area:**
- Section 4: Authentication & Security
- Section 5: Components & Structure
- Section 6: Testing & Validation
- Section 7: Operations & Deployment

### Step 3: Understand the Configuration

File: [.agent-config.json](.agent-config.json)

Contains:
- Rules by category (authentication, components, testing, security)
- Critical files to know
- Documentation references
- Validation checklist

---

## 📋 Before Your First Code Change

### Mandatory Checklist

```
Before making ANY code changes, verify:

[ ] Read AGENT_OPERATIONAL_GUIDEBOOK.md sections 1-3
[ ] Read .agent-config.json completely
[ ] Understand 12 FORBIDDEN OPERATIONS
[ ] Know MANDATORY PATTERNS by heart
[ ] Know why F5 refresh must keep session
[ ] Know why Header renders ONCE only
[ ] Know why localStorage.clear() kills sessions
[ ] Know why sidebar starts at top-20
[ ] Will run npm run build before commit
[ ] Will run bash agent-rules-validator.sh
```

If you can't check all boxes: **STOP AND READ MORE**

---

## 🧪 Available Commands

### For Agents

```bash
# Initialize and learn rules (first time setup)
npm run agent:init

# Validate your code before commit
npm run agent:validate

# Full check: build + validate + test
npm run agent:check
```

### For Developers

```bash
# Development
npm run dev           # Start Vite dev server
npm run build         # Production build
npm run preview       # Preview production build
npm run lint          # Run linter

# System
./START.sh            # Start backend + frontend
./STOP.sh             # Stop all services

# Testing
bash test-security-complete.sh   # 6 security tests
bash test-f5-advanced.sh         # F5 persistence test
bash test-f5-session.sh          # Quick test
```

---

## ⚙️ How the Agent System Works

### Phase 1: Agent Initialization

When agent starts:
1. Runs `npm run agent:init`
2. Verifies all critical files exist
3. Shows sections to read from guidebook
4. Displays mandatory patterns
5. Shows dangerous operations to avoid

### Phase 2: Pre-Commit Validation

Before each commit:
1. **Automatically** runs `.git/hooks/pre-commit`
2. Validates code against 10 agent rules:
   - Rule 1: Header not imported in pages/
   - Rule 2: No hardcoded userType
   - Rule 3: localStorage.clear() only on logout
   - Rule 4: Using user?.userType (not user?.role)
   - Rule 5: Sidebar positioned at top-20
   - Rule 6: Dark mode colors present
   - Rule 7: useAuthStore.js has checkAuth()
   - Rule 8: Header.jsx exists
   - Rule 9: App.jsx renders Header once
   - Rule 10: Build passes

If validation FAILS: **Commit is blocked**

### Phase 3: Manual Validation

Before committing manually:

```bash
# Check your code
bash agent-rules-validator.sh

# If it passes, commit is safe:
git add .
git commit -m "Your message"
```

If validation fails:
```bash
# Read the errors
# Fix them
# Read AGENT_OPERATIONAL_GUIDEBOOK.md Section 1
# Try again
bash agent-rules-validator.sh
```

---

## 🚨 What Gets Blocked by Validation

The pre-commit hook will **BLOCK** commits if:

| Rule | What Gets Blocked | How to Fix |
|------|------------------|-----------|
| Header in pages/ | Importing Header in any page | Remove import, Header goes in App.jsx |
| Hardcoded userType | `userType="embarcador"` hardcoded | Use actual `user?.userType` |
| localStorage.clear() | Clearing storage on error | Keep storage, only clear on logout |
| user?.role | Using wrong field name | Use `user?.userType` instead |
| Sidebar top-0 | Sidebar positioned at top-0 | Position at top-20 (80px offset) |
| Missing dark: | Colors without dark: prefix | Add dark: variants |
| No checkAuth() | Missing checkAuth function | Implement checkAuth() in useAuthStore |
| Build errors | TypeScript/Vite errors | Fix TypeScript errors |

---

## 📁 Critical Files to Know

| File | Purpose | Edit If... |
|------|---------|-----------|
| [AGENT_OPERATIONAL_GUIDEBOOK.md](AGENT_OPERATIONAL_GUIDEBOOK.md) | Master reference for agents | Never (read-only) |
| [.agent-config.json](.agent-config.json) | Agent configuration | Only to update rules |
| [INIT_AGENT.sh](INIT_AGENT.sh) | Agent initialization | Never (read-only) |
| [agent-rules-validator.sh](agent-rules-validator.sh) | Code validator | Only to add new rules |
| [.git/hooks/pre-commit](.git/hooks/pre-commit) | Git hook | Only to modify validation |
| [src/App.jsx](src/App.jsx) | Master app component (Header here!) | Code changes only |
| [src/hooks/useAuthStore.js](src/hooks/useAuthStore.js) | Auth state (CRITICAL!) | Auth changes only ⚠️ |
| [src/components/Header.jsx](src/components/Header.jsx) | Header (3 scenarios) | Header changes only |
| [src/components/DashboardLayout.jsx](src/components/DashboardLayout.jsx) | Sidebar container (top-20!) | Layout changes only |

---

## 🎓 The 4 Critical Skills

All agents must master these:

### SKILL 1: Authentication & Security ⭐⭐⭐⭐⭐
**Must know:**
- F5 refresh keeps session persistent
- localStorage survives temporary errors
- User never defaulted to embarcador
- Tokens validated on app init
- Sessions preserve across navigation

**How to test:** Run `bash test-security-complete.sh` (6/6 must pass)

### SKILL 2: Components & Structure ⭐⭐⭐⭐⭐
**Must know:**
- Header renders ONCE in App.jsx
- 3 Header scenarios (not-auth, auth-public, auth-dashboard)
- Sidebar starts at top-20 (not top-0)
- Every color has dark: variant
- DashboardLayout wraps protected pages

**How to test:** Run `npm run build` (0 errors)

### SKILL 3: Testing & Validation ⭐⭐⭐⭐
**Must know:**
- Build must pass
- Security tests must pass (6/6)
- F5 persistence must work
- Browser console must be clean
- localStorage must have auth_token + user

**How to test:** Run `npm run agent:check`

### SKILL 4: Operations & Deployment ⭐⭐⭐⭐
**Must know:**
- ./START.sh starts everything
- ./STOP.sh stops cleanly
- npm run build creates prod js
- Logs in logs/ directory
- Database migrations with Prisma

---

## 📖 Documentation Map

### For Agent Learning

| Read This | When You're... | Time |
|-----------|---|---|
| [AGENT_OPERATIONAL_GUIDEBOOK.md](AGENT_OPERATIONAL_GUIDEBOOK.md) | Starting ANY work | 30 min |
| [GUIA_BOAS_PRATICAS.md](GUIA_BOAS_PRATICAS.md) | Writing code | 20 min |
| [POLITICA_AUTENTICACAO.md](POLITICA_AUTENTICACAO.md) | Fixing auth | 15 min |
| [CORRECAO_SESSION_F5_CRITICAL.md](CORRECAO_SESSION_F5_CRITICAL.md) | F5 session broken | 20 min |
| [HEADER_LOGICA_ATUALIZADA.md](HEADER_LOGICA_ATUALIZADA.md) | Changing header | 10 min |
| [VALIDACAO_FINAL_SISTEMA.md](VALIDACAO_FINAL_SISTEMA.md) | Validating changes | 15 min |

---

## 🔧 Troubleshooting

### "Pre-commit hook blocked my commit!"

```bash
# Read the validation errors
bash agent-rules-validator.sh

# For each error:
# 1. Read guide
# 2. Fix code
# 3. Try again
bash agent-rules-validator.sh

# When validation passes:
git add .
git commit -m "message"
```

### "What does this validation error mean?"

Check [AGENT_OPERATIONAL_GUIDEBOOK.md](AGENT_OPERATIONAL_GUIDEBOOK.md) Section 1 (FORBIDDEN OPERATIONS).

Each forbidden operation explains:
- Why it breaks the system
- What to do instead
- Code examples

### "Can I bypass the pre-commit hook?"

**NOT RECOMMENDED.** But if you must:

```bash
git commit --no-verify
```

Then:
1. Read why your code failed validation
2. Fix it properly
3. Make a follow-up commit without --no-verify

### "Build fails but validator passes?"

```bash
npm run build
# Shows TypeScript errors

# Fix them, then:
npm run agent:validate
```

---

## 📞 Support

**If you're stuck:**

1. Check [AGENT_OPERATIONAL_GUIDEBOOK.md](AGENT_OPERATIONAL_GUIDEBOOK.md) Section 10 (Decision Trees)
2. Look up your situation in [.agent-config.json](.agent-config.json)
3. Read relevant documentation from map above
4. Run appropriate test command
5. Check filesystem (F12 → Application → LocalStorage)

---

## ✅ Success Criteria

You're ready to contribute if:

- [ ] You can explain why F5 must keep session
- [ ] You know the 3 Header scenarios
- [ ] You can spot hardcoded userType
- [ ] You understand why localhost.clear() kills F5
- [ ] You know sidebar must be top-20
- [ ] You can run all tests and pass
- [ ] You can validate code with agent-rules-validator.sh
- [ ] You understand 12 FORBIDDEN OPERATIONS
- [ ] You follow all MANDATORY PATTERNS
- [ ] You respect ARCHITECTURE GUARANTEES

**If all checked: YOU ARE READY** 🚀

---

**Last Updated:** 2025-02-09  
**Version:** 1.0 - Production Ready  
**Status:** All agents must follow this system
