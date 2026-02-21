# Next.js React Node.js MongoDB FastAPI Python

# 💰 FinanceHub
**Your AI-Powered Personal Finance Command Center.**

A comprehensive personal finance intelligence platform that helps users track transactions, manage budgets, plan goals, optimize taxes, monitor investments, and simulate financial futures — all powered by a deterministic AI engine.

---

## 🎯 Problem Statement

Managing personal finances is overwhelming for most individuals:

- 📉 No unified view of income, expenses, investments, and debt
- 🧾 Manual transaction tracking is tedious and error-prone
- 🤷 Users lack actionable insights on budgeting, tax savings, and investments
- 🏦 Bank statement parsing requires manual effort
- 🔮 No way to simulate "what-if" financial scenarios before making decisions
- ⚠️ Missed bill payments and overlooked subscription renewals

---

## 💡 Our Solution

FinanceHub bridges the gap between raw financial data and intelligent decision-making:

| For Users | AI-Powered Intelligence |
|---|---|
| 📊 Unified financial dashboard | 🧠 Automatic transaction categorization |
| 💳 Multi-account & credit card tracking | 📄 Bank statement PDF parsing |
| 📈 Investment portfolio monitoring | 🎯 Goal-based savings planner |
| 🔄 Recurring payment management | 🧮 Tax estimation & ITR suggestions |
| 🏦 Loan & debt tracking | 🛡️ Emergency fund shield |
| 🌙 Dark mode support | 🪞 Digital Financial Twin simulator |

---

## ✨ Key Features

### 🔐 Authentication & Security
- JWT-based secure authentication with HTTP-only cookies
- Password hashing with bcrypt
- Protected routes with auth middleware
- Role-based access control

### 📊 Financial Dashboard
- Net worth overview across all accounts
- Monthly spending breakdown with charts
- Top spending categories visualization
- Transactions to review & upcoming recurrings
- Real-time notifications system

### 💳 Accounts & Transactions
- Multi-account management (bank, credit card, depository, investment)
- Smart transaction import via CSV upload
- AI-powered PDF bank statement parsing
- Manual transaction entry with rich categorization
- Payment method management (UPI, Cards, Wallets, Net Banking)

### 🤖 AI-Powered Intelligence Engine

The AI Engine is a **stateless Python microservice** that provides deterministic, explainable financial intelligence:

```
┌─────────────────────────────────────────────────────────┐
│  AI ENGINE CAPABILITIES                                 │
├─────────────────────────────────────────────────────────┤
│  🏷️  Transaction Categorization   → Rule-based engine   │
│  📊  Spending Behavior Analysis   → Pattern detection    │
│  💳  Credit Score Analysis        → Multi-factor scoring │
│  🧮  Tax Estimation & ITR Forms   → India tax slabs 2024 │
│  🎯  Goal Feasibility Planning    → SIP/lump-sum calc    │
│  🪞  Digital Financial Twin       → What-if simulation   │
│  🔔  Smart Alerts & Reminders     → Proactive nudges     │
│  📄  Statement Parsing            → PDF → Transactions   │
│  💰  Budget Agent                 → Spending guardrails  │
│  📈  Investment Readiness Gate    → Risk profiling       │
│  🧠  Agent Explanation Layer      → Transparent AI       │
└─────────────────────────────────────────────────────────┘
```

### 📈 Investment Hub
- Portfolio summary with asset allocation
- Live performance tracking
- Mutual fund monitoring
- Holdings breakdown
- AI-powered investment recommendations
- Investment readiness assessment
- Stock market data integration

### 🧮 Tax Center
- Tax summary with interactive charts
- ITR form suggester (India-specific)
- Tax planning wizard
- Upcoming tax deadlines tracker
- Tax slab calculations (Old vs New regime)

### 🎯 Goals & Savings
- Create and track savings goals
- AI-powered goal feasibility analysis
- Savings history visualization
- Goal insights and recommendations

### 🛡️ Emergency Fund Shield
- Emergency fund calculator and tracker
- Shield badge achievement system
- Risk-adjusted fund recommendations

### 🪞 Virtual Financial Twin
- "What-if" scenario simulator
- Project future financial states
- Test decisions before committing

### 💸 Budgeting & Recurrings
- Budget creation and tracking by category
- Subscription management with calendar view
- Spending by category analysis
- Upcoming renewal reminders

### 🏦 Loans & Debt
- Loan tracking and management
- Smart loan recommendations
- Debt repayment planning

### 🌙 Dark Mode
- System-wide dark mode toggle
- Persistent theme preference

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 16 | React framework with App Router |
| React 19 | UI framework |
| TypeScript | Type-safe development |
| Tailwind CSS v4 | Utility-first styling |
| Radix UI | Accessible component primitives |
| Recharts | Interactive data visualizations |
| Lucide React | Icon library |
| React Hook Form + Zod | Form handling & validation |
| Sonner | Toast notifications |
| next-themes | Dark mode support |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| Express 5 | Web framework |
| TypeScript | Type-safe development |
| MongoDB + Mongoose | Database & ODM |
| JWT | Authentication tokens |
| bcrypt | Password hashing |
| Axios | HTTP client for AI Engine |
| cookie-parser | Cookie-based auth |

### AI Engine
| Technology | Purpose |
|---|---|
| Python 3.11+ | Runtime environment |
| FastAPI | Async web framework |
| Pydantic v2 | Data validation & schemas |
| pdfplumber | PDF bank statement parsing |
| pytest | Testing framework |
| uvicorn | ASGI server |

---

## 📁 Project Structure

```
FinanceHub/
├── 📂 backend/
│   ├── 📂 src/
│   │   ├── 📂 config/
│   │   │   ├── constants.ts          # App-wide constants
│   │   │   ├── env.ts                # Environment config
│   │   │   └── offers.json           # Financial offers data
│   │   ├── 📂 controllers/
│   │   │   ├── auth.controller.ts    # Login / Register / Me
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── transactions.controller.ts
│   │   │   ├── budget.controller.ts
│   │   │   ├── goals.controller.ts
│   │   │   ├── investment.controller.ts
│   │   │   ├── investment-agent.controller.ts
│   │   │   ├── investment-recommendation.controller.ts
│   │   │   ├── loans.controller.ts
│   │   │   ├── tax.controller.ts
│   │   │   ├── credit.controller.ts
│   │   │   ├── recurring.controller.ts
│   │   │   ├── ledger.controller.ts
│   │   │   ├── alerts.controller.ts
│   │   │   ├── categorization.controller.ts
│   │   │   ├── parser.controller.ts
│   │   │   ├── paymentMethods.controller.ts
│   │   │   ├── recommendation.controller.ts
│   │   │   ├── risk-profile.controller.ts
│   │   │   └── agent-explanation.controller.ts
│   │   ├── 📂 database/
│   │   │   └── mongo.ts              # MongoDB connection
│   │   ├── 📂 integrations/
│   │   │   └── 📂 ai-engine/
│   │   │       ├── ai.client.ts      # AI Engine HTTP client
│   │   │       └── ai.types.ts       # AI request/response types
│   │   ├── 📂 middleware/
│   │   │   ├── auth.middleware.ts     # JWT verification
│   │   │   ├── error.middleware.ts    # Global error handler
│   │   │   └── validate.middleware.ts # Request validation
│   │   ├── 📂 models/
│   │   │   ├── user.model.ts         # User schema
│   │   │   ├── transaction.model.ts  # Transaction schema
│   │   │   ├── budget.model.ts       # Budget schema
│   │   │   ├── goal.model.ts         # Goal schema
│   │   │   ├── investment.model.ts   # Investment schema
│   │   │   ├── loan.model.ts         # Loan schema
│   │   │   ├── taxProfile.model.ts   # Tax profile schema
│   │   │   ├── creditSnapshot.model.ts
│   │   │   ├── recurring.model.ts    # Recurring payment schema
│   │   │   ├── alert.model.ts        # Alert schema
│   │   │   └── paymentMethod.model.ts
│   │   ├── 📂 routes/                # 21 route files
│   │   ├── 📂 services/              # 20 service files
│   │   ├── 📂 scripts/
│   │   │   └── seed-demo-data.ts     # Demo data seeder
│   │   ├── 📂 types/
│   │   │   ├── auth.types.ts
│   │   │   ├── credit.types.ts
│   │   │   ├── tax.types.ts
│   │   │   └── transaction.types.ts
│   │   ├── 📂 utils/
│   │   │   ├── jwt.ts                # Token utilities
│   │   │   ├── password.ts           # Hashing utilities
│   │   │   ├── csv.ts                # CSV parser
│   │   │   └── date.ts               # Date helpers
│   │   ├── app.ts                    # Express app setup
│   │   └── main.ts                   # Entry point
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
│
├── 📂 frontend/
│   ├── 📂 app/
│   │   ├── 📂 auth/
│   │   │   ├── 📂 login/            # Login page
│   │   │   ├── 📂 sign-up/          # Registration page
│   │   │   ├── 📂 sign-up-success/  # Success page
│   │   │   └── 📂 forgot-password/  # Password recovery
│   │   ├── 📂 dashboard/
│   │   │   ├── 📂 accounts/         # Multi-account management
│   │   │   ├── 📂 transactions/     # Transaction history
│   │   │   ├── 📂 budget/           # Budget tracking
│   │   │   ├── 📂 investments/      # Portfolio manager
│   │   │   ├── 📂 goals/            # Savings goals
│   │   │   ├── 📂 loans/            # Loan management
│   │   │   ├── 📂 tax/              # Tax center
│   │   │   ├── 📂 recurrings/       # Subscription tracker
│   │   │   ├── 📂 emergency-fund/   # Emergency shield
│   │   │   ├── 📂 virtual-twin/     # Financial twin simulator
│   │   │   ├── 📂 categories/       # Category management
│   │   │   ├── 📂 connect-bank/     # Bank connection
│   │   │   ├── 📂 explore/          # Feature discovery
│   │   │   ├── 📂 action-plan/      # AI action plans
│   │   │   ├── 📂 settings/         # User settings
│   │   │   ├── 📂 get-help/         # Help center
│   │   │   ├── 📂 demo/             # Demo mode
│   │   │   ├── layout.tsx           # Dashboard layout + sidebar
│   │   │   └── page.tsx             # Main dashboard
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Landing / redirect
│   │   └── globals.css              # Global styles
│   ├── 📂 components/
│   │   ├── 📂 dashboard/            # Dashboard widgets
│   │   ├── 📂 accounts/             # Account components
│   │   ├── 📂 investments/          # Investment cards & charts
│   │   ├── 📂 goals/                # Goal cards & dialogs
│   │   ├── 📂 recurrings/           # Subscription components
│   │   ├── 📂 tax/                  # Tax wizard & charts
│   │   ├── 📂 transactions/         # Transaction dialogs
│   │   ├── 📂 loans/                # Loan recommendations
│   │   ├── 📂 auth/                 # Auth components
│   │   └── 📂 ui/                   # 57 Radix-based UI primitives
│   ├── 📂 lib/
│   │   ├── 📂 api/                  # 16 API client modules
│   │   ├── 📂 auth/                 # Auth context & API
│   │   ├── 📂 context/              # Notification, Security, Settings
│   │   └── 📂 validations/          # Zod schemas
│   ├── 📂 hooks/
│   │   ├── use-mobile.ts            # Responsive hook
│   │   └── use-toast.ts             # Toast notifications
│   ├── middleware.ts                # Route protection
│   ├── next.config.mjs
│   ├── tsconfig.json
│   └── package.json
│
├── 📂 ai-engine/
│   ├── 📂 app/
│   │   ├── 📂 core/
│   │   │   ├── config.py            # Settings & env config
│   │   │   └── logging.py           # Structured logging
│   │   ├── 📂 routers/
│   │   │   ├── health.py            # Health check
│   │   │   ├── categorize.py        # Transaction categorization
│   │   │   ├── behavior.py          # Spending behavior analysis
│   │   │   ├── credit.py            # Credit score analysis
│   │   │   ├── tax.py               # Tax estimation & ITR
│   │   │   ├── goals.py             # Goal feasibility planning
│   │   │   ├── digital_twin.py      # Financial twin simulation
│   │   │   ├── alerts.py            # Smart alerts
│   │   │   ├── parse.py             # PDF statement parsing
│   │   │   ├── budget.py            # Budget agent
│   │   │   ├── investment_readiness.py  # Investment gate
│   │   │   └── agent_explanation.py # Explainability layer
│   │   ├── 📂 services/
│   │   │   ├── categorization_service.py
│   │   │   ├── behavior_service.py
│   │   │   ├── credit_service.py
│   │   │   ├── tax_service.py
│   │   │   ├── goal_service.py
│   │   │   ├── digital_twin_service.py
│   │   │   ├── alert_service.py
│   │   │   ├── statement_parser_service.py
│   │   │   ├── budget_agent_service.py
│   │   │   ├── investment_readiness_service.py
│   │   │   └── agent_explanation_service.py
│   │   ├── 📂 models/
│   │   │   ├── schemas.py            # Pydantic request/response
│   │   │   ├── statement_schemas.py  # Statement parsing models
│   │   │   ├── investment_readiness.py
│   │   │   └── agent_explanation.py
│   │   ├── 📂 rules/
│   │   │   ├── budget_rules.py       # Budget guardrails
│   │   │   ├── credit_rules.py       # Credit scoring rules
│   │   │   ├── tax_slabs_2024.py     # India tax slabs
│   │   │   └── categories.json       # Category taxonomy
│   │   └── 📂 utils/
│   │       ├── date_utils.py         # Date calculations
│   │       └── math.py              # Financial math helpers
│   ├── 📂 tests/
│   │   ├── conftest.py              # Test fixtures
│   │   ├── test_categorization.py
│   │   ├── test_behavior.py
│   │   ├── test_digital_twin.py
│   │   ├── test_investment_readiness.py
│   │   ├── test_statement_parser.py
│   │   └── test_tax.py
│   ├── main.py                      # FastAPI entry point
│   └── requirements.txt
│
└── README.md
```

---

## 🏗️ Architecture

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│              │      │              │      │              │
│   Frontend   │◄────►│   Backend    │◄────►│  AI Engine   │
│  (Next.js)   │ REST │  (Express)   │ HTTP │  (FastAPI)   │
│  Port: 5137  │      │  Port: 5000  │      │  Port: 8000  │
│              │      │              │      │              │
└──────────────┘      └──────┬───────┘      └──────────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │   MongoDB    │
                      │  (Database)  │
                      └──────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js v18+** — [Download](https://nodejs.org/)
- **Python 3.11+** — [Download](https://www.python.org/)
- **MongoDB** — Local or [MongoDB Atlas](https://www.mongodb.com/atlas)

### Installation

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/KalpeshEragi/HackVengers.git
cd HackVengers
```

#### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/hackvengers
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster.xxxxx.mongodb.net/hackvengers

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# AI Engine
AI_ENGINE_URL=http://localhost:8000
```

Start the backend server:

```bash
npm run dev
```

#### 3️⃣ AI Engine Setup

```bash
cd ../ai-engine
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Start the AI engine:

```bash
python main.py
```

#### 4️⃣ Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the frontend development server:

```bash
npm run dev
```

#### 5️⃣ Seed Demo Data (Optional)

```bash
cd ../backend
npm run seed:demo
```

#### 6️⃣ Access the Application

| URL | Description |
|---|---|
| http://localhost:5137 | Frontend application |
| http://localhost:5000 | Backend API |
| http://localhost:8000/docs | AI Engine API docs (Swagger) |

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Transactions
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/transactions` | Get all transactions |
| POST | `/api/transactions` | Create transaction |
| POST | `/api/transactions/import` | Import CSV transactions |
| POST | `/api/transactions/parse` | Parse bank statement PDF |

### Budget
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/budget` | Get budgets |
| POST | `/api/budget` | Create budget |

### Goals
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/goals` | Get all goals |
| POST | `/api/goals` | Create goal |
| PATCH | `/api/goals/:id` | Update goal |

### Investments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/investments` | Get portfolio |
| POST | `/api/investments` | Add investment |
| GET | `/api/investment-recommendations` | Get AI recommendations |
| GET | `/api/risk-profile` | Get risk profile |

### Loans
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/loans` | Get all loans |
| POST | `/api/loans` | Add loan |

### Tax
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tax/profile` | Get tax profile |
| POST | `/api/tax/estimate` | Calculate tax estimate |
| GET | `/api/tax/suggestions` | Get tax-saving suggestions |

### AI Engine (Internal)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/categorize` | Categorize transactions |
| POST | `/behavior/analyze` | Analyze spending behavior |
| POST | `/credit/analyze` | Credit score analysis |
| POST | `/tax/estimate` | Tax calculation |
| POST | `/goals/plan` | Goal feasibility check |
| POST | `/twin/simulate` | Financial twin simulation |
| POST | `/alerts/check` | Generate smart alerts |
| POST | `/parse` | Parse bank statement |
| POST | `/budget/analyze` | Budget analysis |
| POST | `/investment/readiness` | Investment readiness gate |
| POST | `/agent/explanation` | AI explanation layer |

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

#### 1️⃣ Fork the Repository

Click the "Fork" button at the top right of this page.

#### 2️⃣ Clone Your Fork

```bash
git clone https://github.com/your-username/HackVengers.git
cd HackVengers
```

#### 3️⃣ Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

#### 4️⃣ Make Your Changes

- Follow existing code style and TypeScript conventions
- Add comments for complex logic
- Test your changes thoroughly

#### 5️⃣ Commit Your Changes

```bash
git add .
git commit -m "feat: add your feature description"
```

**Commit Convention:**

| Prefix | Description |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation |
| `style:` | Formatting |
| `refactor:` | Code restructuring |
| `test:` | Adding tests |

#### 6️⃣ Push and Create PR

```bash
git push origin feature/your-feature-name
```

Open a Pull Request on GitHub with:
- Clear title describing the change
- Description of what was changed and why
- Screenshots (if UI changes)

---

## 📋 Roadmap

- [ ] Bank account aggregation via Account Aggregator APIs
- [ ] Push notifications for bill reminders
- [ ] Email reports (weekly/monthly summaries)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-currency support
- [ ] Offline-first PWA support
- [ ] Export financial reports as PDF

---

## 📄 License

This project is licensed under the **ISC License** — see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

Made with 💚 by the **HackVengers** team.

> 💰 *Taking control of your finances, one smart decision at a time.*
