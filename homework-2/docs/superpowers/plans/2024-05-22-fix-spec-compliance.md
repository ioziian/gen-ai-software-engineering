# Fix Spec Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix spec compliance issues identified in Homework 2 Task 1.

**Architecture:** Convert default exports to named exports, update imports, update documentation titles, and ensure correct branching and file tracking.

**Tech Stack:** TypeScript, Node.js, Git.

---

### Task 1: Branching Setup

**Files:**
- N/A

- [ ] **Step 1: Switch to main and create homework-2-submission branch**

Run: `git checkout main && git checkout -b homework-2-submission`
Expected: Switched to a new branch 'homework-2-submission'

- [ ] **Step 2: Commit**

N/A (no changes yet)

### Task 2: Fix Named Export in app.ts

**Files:**
- Modify: `homework-2/src/app.ts`

- [ ] **Step 1: Replace default export with named export**

```typescript
// Replace:
// export default app;
// With:
export { app };
```

- [ ] **Step 2: Commit**

```bash
git add homework-2/src/app.ts
git commit -m "refactor: use named export for app"
```

### Task 3: Update import in index.ts

**Files:**
- Modify: `homework-2/src/index.ts`

- [ ] **Step 1: Update import to use named export**

```typescript
// Replace:
// import app from './app';
// With:
import { app } from './app';
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit` (if tsconfig.json is present in homework-2)
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add homework-2/src/index.ts
git commit -m "fix: update app import to use named export"
```

### Task 4: Update README.md Title

**Files:**
- Modify: `homework-2/README.md`

- [ ] **Step 1: Update title to "Homework 2: Intelligent Customer Support System"**

```markdown
# 🤖 Homework 2: Intelligent Customer Support System
```

- [ ] **Step 2: Commit**

```bash
git add homework-2/README.md
git commit -m "docs: update README title for homework-2"
```

### Task 5: Finalize and Track Files

**Files:**
- Track: `homework-2/package-lock.json`
- Track: other untracked files in `homework-2`

- [ ] **Step 1: Add package-lock.json and other files**

Run: `git add homework-2/package-lock.json`
Expected: File staged.

- [ ] **Step 2: Final commit**

```bash
git add .
git commit -m "chore: track initialization files for homework-2"
```
