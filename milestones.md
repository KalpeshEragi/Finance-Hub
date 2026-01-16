# 📍 Project Milestones – PS-12 FinMirror

**Project:** Comprehensive Personal Finance & Tax Management Platform  
**Hackathon Duration:** ~20 hours  
**Team Size:** 5  
**Tech Stack:** React + Node.js (NestJS/Express) + Python (FastAPI)

This document tracks development milestones for periodic commits and progress visibility during the hackathon.

---

## 🧠 High-Level Goal

Build a **fully functional MVP** that allows users to:

- Track income & expenses from **multiple sources**
- Automatically categorize transactions
- View **budget insights**, **credit health**, and **tax estimates**
- Receive **behavioral financial insights** (Financial Mirror™)

All features are **rule-based, explainable, and free** (no paid APIs).

---

## 🏗️ Architecture Overview

```plaintext
Frontend (React + Tailwind)
↓
Backend API (Node.js + Express/NestJS)
↓
AI / Rules Engine (Python + FastAPI)
↓
Database (Postgres / MongoDB)
```

Tech Stack

- **Node.js** handles auth, APIs, orchestration, and persistence
- **Python** handles finance logic, categorization, tax, credit & behavior analysis
- Communication via **internal REST APIs (JSON)**

---

## 🕒 MILESTONE TIMELINE (20 HOURS)

---

## ✅ Milestone 0: Scope Lock & Architecture (Hour 0–1)

**Status:** Planned  
**Commit Tag:** `milestone-0-scope-lock`

### Deliverables

- Final feature list locked
- Tech stack finalized
- Repo structure created
- Environment variables defined

### Decisions

- No real bank APIs
- CSV + manual imports only
- Rule-based logic (no ML training)
- Salary-only tax estimation
- Credit *health score* (CIBIL-like, not real)

---

## ✅ Milestone 1: Repo Setup & Boilerplate (Hour 1–2)

**Commit Tag:** `milestone-1-boilerplate`

### Deliverables

- Monorepo structure
- Frontend (React + Vite)
- Backend (Node.js + TS)
- AI Engine (FastAPI)
- Base README.md

### Folders Created

- `/frontend`
- `/backend`
- `/ai-engine`
- `/docs`

---

## ✅ Milestone 2: Authentication & User Management (Hour 2–4)

**Commit Tag:** `milestone-2-auth`

### Features

- User registration
- User login
- JWT-based auth
- Protected routes

### APIs

- POST /auth/register
- POST /auth/login
- GET /auth/me

### Notes

- Passwords hashed using bcrypt
- JWT stored securely
- All financial data user-scoped

---

## ✅ Milestone 3: Transaction Ingestion (Multi-Source) (Hour 4–7)

**Commit Tag:** `milestone-3-transactions`

### Features

- Manual transaction entry
- CSV upload support
- Source tagging:
  - Bank
  - Wallet (Paytm)
  - Card
  - Manual

### Supported Sources (Hackathon)

- Paytm CSV
- Bank statements (CSV)
- Card statements (CSV)

### APIs

POST /budget/set
GET /budget/summary


---

## ✅ Milestone 6: Dashboard & Analytics (Hour 9–12)

**Commit Tag:** `milestone-6-dashboard`

### Features

- Expense breakdown (pie chart)
- Monthly trends (line chart)
- Savings indicator
- Alerts feed

### Tech

- Recharts
- Responsive layout
- Clean, minimal UI

---

## ✅ Milestone 7: Credit Health Score (Hour 10–13)

**Commit Tag:** `milestone-7-credit-score`

### Features

- Estimated credit health score (300–900)
- Explainable breakdown
- Improvement suggestions

### Factors

- Payment regularity
- Credit utilization
- Loan count

### API

GET /credit/score


> Clearly labeled as **“Estimated / Simulated Credit Health Score”**

---

## ✅ Milestone 8: Tax & ITR Estimation (Hour 13–16)

**Commit Tag:** `milestone-8-tax`

### Scope (Strict)
- Salary income only
- FY 2024–25
- Old vs New regime
- Standard deduction + 80C cap

### Features
- Tax payable estimate
- Best regime suggestion
- Deduction breakdown

### APIs
GET /behavior/summary


---

## ✅ Milestone 10: Goals & Savings Planning (Hour 15–17)

**Commit Tag:** `milestone-10-goals`

### Features
- Create savings goals
- Monthly contribution tracking
- Progress visualization

### APIs

POST /goals
GET /goals


---

## ✅ Milestone 11: Integration, Polish & Demo Prep (Hour 17–20)

**Commit Tag:** `milestone-11-polish`

### Tasks
- End-to-end flow testing
- Seed demo data
- UI polish
- Error handling
- Demo script preparation

### Demo Flow
1. Login
2. Add income
3. Upload Paytm/bank CSV
4. Auto categorization
5. Budget alert
6. Financial Mirror insight
7. Credit score
8. Tax estimate

---

## 🚫 Explicitly Out of Scope

- Real bank APIs
- Live Paytm integration
- Full ITR filing
- Real CIBIL score
- Paid services

---

## 🏁 Final Notes

- All financial insights are **estimations**
- All rules are **transparent and explainable**
- System is **privacy-first**
- Architecture is **scalable post-hackathon**

---