# 🧪 CodeForge Complete End-to-End Manual Testing Guide

This document provides a comprehensive, step-by-step Quality Assurance (QA) and manual verification guide for **CodeForge**. By completing every test scenario in this guide, you can be 100% confident that all roles, modules, workspace flows, GitHub integration pipelines, and Cloud IDE features are fully functional.

---

## 📋 Table of Contents
1. [Environment & Setup Verification](#1-environment--setup-verification)
2. [Phase 1: Public & Unauthenticated Module](#2-phase-1-public--unauthenticated-module)
3. [Phase 2: Super Admin Module (`superadmin`)](#3-phase-2-super-admin-module-superadmin)
4. [Phase 3: Manager Module (`manager`)](#4-phase-3-manager-module-manager)
5. [Phase 4: Intern Module (`intern`)](#5-phase-4-intern-module-intern)
6. [Phase 5: Cloud IDE & GitHub Git Flow Integration](#6-phase-5-cloud-ide--github-git-flow-integration)
7. [Phase 6: End-to-End Collaborative Lifecycle Test](#7-phase-6-end-to-end-collaborative-lifecycle-test)
8. [Phase 7: UI Aesthetics & Stacking Verification](#8-phase-7-ui-aesthetics--stacking-verification)

---

## 1. Environment & Setup Verification

### 1.1 Server Status Check
1. Open terminal 1 and start the backend server:
   ```bash
   cd backend
   npm run dev
   ```
   * **Expected Result:** Server logs show `Server is running in development mode on port 5000` and `MongoDB Connected`.

2. Open terminal 2 and start the frontend application:
   ```bash
   cd frontend
   npm run dev
   ```
   * **Expected Result:** Vite dev server starts at `http://localhost:5173`.

---

## 2. Phase 1: Public & Unauthenticated Module

### Test 1.1: Public Landing Page (`/`)
1. Open browser and navigate to `http://localhost:5173/`.
2. **Verify:**
   * Modern dark-mode Hero section displays with gradient typography (*"Collaborative Internship Coding, Fully Automated"*).
   * Feature highlight cards (Zero-Setup Cloud IDE, Automated Git Sync, Direct Portal Merges) render cleanly.
   * "How it Works" workflow timeline displays.
   * FAQ section items are visible.
   * Click the **"Sign In"** button in the header or **"Enter Console"** in the Hero section.
   * **Expected Result:** Redirects to `http://localhost:5173/login`.

### Test 1.2: Unauthenticated Route Guards
1. While logged out, attempt to navigate directly to restricted paths in the browser address bar:
   * `http://localhost:5173/intern/dashboard`
   * `http://localhost:5173/intern/ide`
   * `http://localhost:5173/manager/dashboard`
   * `http://localhost:5173/admin/dashboard`
2. **Expected Result:** All restricted routes immediately intercept the request and redirect back to `/login`.

### Test 1.3: Superadmin Login
1. On `http://localhost:5173/login`:
   * Enter email: `admin@gmail.com`
   * Enter password: `password123`
   * Click **Sign In**.
2. **Expected Result:** Login succeeds, JWT token stores in `localStorage`, and user redirects automatically to `/admin/dashboard`.

---

## 3. Phase 2: Super Admin Module (`superadmin`)

### Test 2.1: Admin Dashboard Overview (`/admin/dashboard`)
1. View metrics cards at the top of the dashboard.
2. **Verify:** Total Users, Active Projects, Active Tasks, and System Activity charts render accurately.

### Test 2.2: User Management (`/admin/users`)
1. Navigate to **Manage Users** (`/admin/users`).
2. **Create Manager User:**
   * Click **Invite / Add User**.
   * Name: `Manager 1`
   * Email: `manager1@gmail.com`
   * Password: `password123`
   * Role: `manager`
   * Click **Create User**.
   * **Verify:** Manager 1 appears in the user table with active badge.
3. **Create Intern 1 User:**
   * Name: `Intern 1`
   * Email: `intern1@gmail.com`
   * Password: `password123`
   * Role: `intern`
   * Click **Create User**.
4. **Create Intern 2 User:**
   * Name: `Intern 2`
   * Email: `intern2@gmail.com`
   * Password: `password123`
   * Role: `intern`
   * Click **Create User**.
5. **Verify List Filters & Actions:**
   * Test filtering users by role (`intern`, `manager`).
   * Toggle active/inactive switch on a user.

### Test 2.3: Project & Workspace Configuration (`/admin/projects`)
1. Navigate to **Manage Projects** (`/admin/projects`).
2. Click **Create Project**.
   * Project Name: `Project 1`
   * Description: `First collaborative internship workspace`
   * Select Manager: `Manager 1` (`manager1@gmail.com`)
   * Select Interns: Check `Intern 1` and `Intern 2`
   * GitHub Repository URL (COMPULSORY *): `https://github.com/realcodeforge-netizen/Project1`
   * Click **Save Project**.
3. **Verify:**
   * `Project 1` card appears in the project list.
   * Assigned Manager displays as `Manager 1`.
   * Assigned Interns count displays as `2 Interns`.

---

## 4. Phase 3: Manager Module (`manager`)

### Test 3.1: Manager Dashboard (`/manager/dashboard`)
1. Log out as Admin and log in as Manager 1 (`manager1@gmail.com` / `password123`).
2. **Verify:**
   * Supervised Intern Cohort section displays `Project 1`.
   * Click `Project 1` to expand the accordion view.
   * **Verify:** Table lists `Intern 1` (`intern1@gmail.com`) and `Intern 2` (`intern2@gmail.com`).
   * **Verify:** Each row has a **`🔌 View Git Activity`** action button.

### Test 3.2: Task Assignment (`/manager/assign-task`)
1. Navigate to **Assign Tasks** (`/manager/assign-task`).
2. Click **Create Task**.
   * Title: `Build Feature A`
   * Description: `Implement core logic in index.js and test changes.`
   * Select Project: `Project 1`
   * Select Intern: `Intern 1`
   * Priority: `High`
   * Deadline: Select a future date
   * Click **Assign Task**.
3. **Verify:** Task appears in the task overview list.

### Test 3.3: Review Reports (`/manager/review-reports`)
1. Navigate to **Review Reports** (`/manager/review-reports`).
2. **Verify:** Displays list of daily reports submitted by interns under supervised projects once submitted.

---

## 5. Phase 4: Intern Module (`intern`)

### Test 4.1: Intern Dashboard (`/intern/dashboard`)
1. Log out as Manager and log in as Intern 1 (`intern1@gmail.com` / `password123`).
2. **Verify:**
   * Workspace Selector dropdown defaults to `Project 1` (persists choice in `localStorage`).
   * Assigned Tasks widget lists `Build Feature A`.
   * GitHub Activity card shows `Commits`, `Branches`, and `PRs` tabs.

### Test 4.2: My Tasks (`/intern/tasks`)
1. Navigate to **My Tasks** (`/intern/tasks`).
2. Locate `Build Feature A`.
3. Change status dropdown from `Pending` -> `In Progress`.
4. Change status dropdown from `In Progress` -> `Completed`.
5. **Verify:** Status badge updates immediately.

### Test 4.3: Daily Reports (`/intern/reports`)
1. Navigate to **My Reports** (`/intern/reports`).
2. Click **Submit Daily Report**.
   * Select Workspace: `Project 1`
   * Work Summary: `Completed setup and initial code logic for Feature A.`
   * Hours Worked: `6`
   * Blockers / Notes: `None`
   * Click **Submit Report**.
3. **Verify:** Report appears in the submitted reports timeline.

---

## 6. Phase 5: Cloud IDE & GitHub Git Flow Integration

### Test 5.1: Workspace Bootstrapping & Selection (`/intern/ide`)
1. Navigate to **Cloud IDE** (`/intern/ide`).
2. **Verify:**
   * Workspace dropdown lists `Project 1`.
   * Action controls row renders: `💾 Save Draft`, `🐙 Commit & Push`, `🔄 Sync from Main`, `🚀 Submit PR`.
   * StackBlitz WebContainer initializes inside the container pane loading workspace files.

### Test 5.2: Local Draft Save (`💾 Save Draft`)
1. In the file explorer inside StackBlitz, open `index.js`.
2. Add a line of code: `console.log("Draft version 1.0");`.
3. Click **`💾 Save Draft`**.
4. **Verify:**
   * Action bar shows `⚡ Saving...`.
   * Green success banner appears: `Workspace draft saved to MongoDB successfully!`.
   * Banner auto-dismisses after 5 seconds.
5. Refresh the browser page (`F5`).
6. **Verify:** `index.js` reloads containing `console.log("Draft version 1.0");`.

### Test 5.3: Commit & Push (`🐙 Commit & Push`)
1. Click **`🐙 Commit & Push`**.
2. **Verify:**
   * Modern modal opens: `🐙 Commit & Push to GitHub`.
   * Prompt: *"Enter a commit message to save and push your current workspace files to branch codeforge/intern-intern-1."*
3. Enter Commit Message: `Implemented Feature A core logic`.
4. Click **Push to Branch**.
5. **Verify:**
   * Button changes to `Pushing...`.
   * Modal closes automatically.
   * Status text displays `Pushing tree to GitHub...`.
   * Green success banner displays: `Code committed and pushed to GitHub successfully!`.
   * Navigating to GitHub repo `https://github.com/realcodeforge-netizen/Project1/tree/codeforge/intern-intern-1` shows the pushed files.

### Test 5.4: Submit Pull Request (`🚀 Submit PR`)
1. Click **`🚀 Submit PR`**.
2. **Verify:**
   * Full-screen React Portal modal opens: `🚀 Submit Pull Request`.
3. Enter PR Title: `Intern 1: Feature A Implementation`.
4. Click **Submit PR**.
5. **Verify:**
   * Modal closes automatically.
   * Green success banner displays: `Pull Request created successfully on GitHub!`.
6. Click **`🚀 Submit PR`** a second time without making new commits.
7. Enter PR Title: `Duplicate PR attempt`.
8. Click **Submit PR**.
9. **Verify:**
   * Modal closes automatically.
   * Red validation banner displays: `❌ A pull request already exists for your workspace branch. You do not need to create another one until your manager merges it.`

---

## 7. Phase 6: End-to-End Collaborative Lifecycle Test

### Test 6.1: Manager Review & Merge Approval
1. Log out as Intern 1 and log in as Manager 1 (`manager1@gmail.com` / `password123`).
2. On Manager Dashboard (`/manager/dashboard`), expand `Project 1` accordion.
3. Click **`🔌 View Git Activity`** next to Intern 1 (`intern1@gmail.com`).
4. **Verify:**
   * GitHub Activity panel expands directly underneath the intern table.
   * **Commits tab:** Displays `Implemented Feature A core logic` (verifying system `"initial commit: create README.md"` is filtered out).
   * **Branches tab:** Displays `codeforge/intern-intern-1`.
   * Select **PRs tab:** Displays `#1 Intern 1: Feature A Implementation` with an `OPEN` badge and green **`Approve & Merge`** button.
5. Click **`Approve & Merge`**.
6. **Verify:**
   * Screen-wide portal modal opens: `🔀 Confirm PR Merge`.
   * Text: *"Are you sure you want to approve and merge Pull Request #1? This will integrate the intern's branch changes into the default branch."*
7. Click **Confirm Merge**.
8. **Verify:**
   * Button shows `Merging...`.
   * Green success banner displays: `Pull Request #1 merged successfully!`.
   * PR status badge changes from green `OPEN` to red/purple `CLOSED` or `MERGED`.
   * On GitHub, `main` branch now contains Intern 1's code.

### Test 6.2: Workspace Sync from Main (`🔄 Sync from Main`)
1. Log out as Manager and log in as Intern 2 (`intern2@gmail.com` / `password123`).
2. Navigate to **Cloud IDE** (`/intern/ide`).
3. Click **`🔄 Sync from Main`**.
4. **Verify:**
   * Full-screen React Portal modal opens: `🔄 Sync Workspace from Main`.
   * Warning text: *"This will merge the latest main branch code into your workspace. Any unsaved drafts will be overwritten. Do you want to proceed?"*
5. Click **Confirm Sync**.
6. **Verify:**
   * Page reloads automatically.
   * Green success banner displays: `Workspace synced with main branch successfully!`.
   * StackBlitz WebContainer initializes containing the merged code from Intern 1 (`index.js`).

---

## 8. Phase 7: UI Aesthetics & Stacking Verification

1. **Native Alert Removal:** Verify no native browser popups (`alert()` or `confirm()`) appear anywhere during login, draft saving, pushing, PR submission, merging, or workspace syncing.
2. **Auto-Dismissing Banners:** Verify all success notifications auto-dismiss after 5 seconds without leaving broken layout gaps.
3. **Portal Overlay Stacking:** Verify all modals (Commit, PR Submit, PR Merge, Sync Confirm) render with dark backdrop overlays spanning 100% of the viewport window (`zIndex: 10000`).
4. **Dropdown Persistence:** Change workspace selection in the header dropdown, navigate between pages, and verify the choice is preserved in `localStorage`.

---

### 🎯 Verification Sign-Off Checklist

| Module / Workflow | Status | Verified By |
| :--- | :---: | :---: |
| 🌐 Public Landing Page & Route Guards | 🟩 PASS | Manual QA |
| 🔑 Auth & Password Reset Pipelines | 🟩 PASS | Manual QA |
| 🛡️ Superadmin User & Project Management | 🟩 PASS | Manual QA |
| 👔 Manager Cohort Inspection & Task Allocation | 🟩 PASS | Manual QA |
| 👩‍💻 Intern Task Lifecycle & Daily Reports | 🟩 PASS | Manual QA |
| ⚡ StackBlitz Cloud IDE Draft Backup | 🟩 PASS | Manual QA |
| 🐙 Branch Pushing & PR Creation | 🟩 PASS | Manual QA |
| 🔀 Manager 1-Click PR Merging | 🟩 PASS | Manual QA |
| 🔄 Cross-Intern Workspace Sync from Main | 🟩 PASS | Manual QA |

*When all items above are checked, your CodeForge installation is **100% production ready!***
