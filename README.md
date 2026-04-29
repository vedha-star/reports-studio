# Navacle Report Studio

Navacle Report Studio is a premium, full-stack report management and automation platform. It allows users to build, categorize, schedule, and test complex reports across multiple data sources with a focus on ease of use and high-fidelity mapping.

## 🚀 Recent Updates & Integration
The project is now a **production-ready, full-stack system** powered by PostgreSQL.
- **Optimized Frontend**: All React Hooks have been memoized and stabilized to prevent cascading renders and infinite loops.
- **Robust Metrics**: The `RunHistory` model now tracks live metrics including `rowCount` and `fileSize`.
- **Category 2.0**: Full integration of parent-child folder management with persistent color-coded branding.
- **Database Schema**: Expanded the `Report` model to include `columnMap`, `endpoint`, `status`, `parameters`, and `filters`.
- **Backend Stability**: Resolved TypeScript caching issues in duplicating complex JSON metadata payloads.

## 🛠 Tech Stack
- **Frontend**: Next.js 14+, React (memoized state management), DM Sans.
- **Backend**: NestJS, PostgreSQL (Primary DB).
- **Database**: Prisma ORM with automated synchronization.

---

## 📂 Project Structure

```text
navacle-report-studio/
├── frontend/           # Next.js Application
│   ├── src/app/        # App Router (Dashboard, Builder, Reports, Categories)
│   ├── components/     # UI components (Sidebar, Topbar)
│   └── lib/            # API Client (Axios)
└── backend/            # NestJS Application
    ├── prisma/         # PostgreSQL Schema
    └── src/            # Modules (Reports, Schedules, Categories, History)
```

---

## 🌟 Key Modules
- **Report Builder**: 4-step wizard for high-fidelity data source mapping.
- **Report List**: Centralized management with grouped/flat view toggles.
- **Folder Management**: Dynamic organizational system with distinct visual markers.
- **Tester & Analytics**: Verification suite for query execution and performance tracking.

---

## ⚙️ Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma db push
npm run start:dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🔍 How to Validate the Frontend
Follow these steps to verify the full-stack integration:

1.  **Dashboard Check**: Visit `http://localhost:3000/`. You should see the global overview with dynamic counters for "Total Reports" and "Scheduled" runs.
2.  **Category Creation**: Navigate to **Categories**. Create a new "Finance" folder. Ensure the icon and color persist after refresh.
3.  **Build a Report**: Go to the **Builder**.
    - Step 1: Select `Finance` database.
    - Step 2: Set column labels (e.g., "Invoice Value" as Currency).
    - Step 3: Assign the report to your new "Finance" folder.
    - Step 4: Click **Save Report**.
4.  **Verification**: 
    - Go back to **Categories**. Click on "Finance". Your new report should appear in the folder list.
    - Go to **Reports**. Ensure the report is listed and the "Format" badge (xlsx/pdf) is colored correctly.
5.  **Run Sample**: Click **Run** on any report to simulate a metric update in the database.

---

## 🧪 Testing Utilities
- **Prisma Studio**: `npx prisma studio` (Manage DB records visually at localhost:5555)

---

## 📝 License
Proprietary to Navacle Solutions.
