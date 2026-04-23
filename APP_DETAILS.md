# SalesPulse Intelligence - Application Overview

## 1. Core Technologies
- **Frontend**: React 18 with Vite, TypeScript.
- **Styling**: Tailwind CSS for responsive and modern UI.
- **Animations**: Framer Motion (`motion/react`) for smooth transitions.
- **Charts**: Recharts & D3 for data visualization.
- **Backend**: Node.js with Express.
- **Database**: SQLite (`better-sqlite3`) for high-performance local data management and caching.
- **Cloud Integration**: Google Sheets API (v4) for master data storage and reporting.

## 2. System Architecture
SalesPulse follows a "Sheet-as-a-DB" architecture but uses a local SQLite database to scale performance:
1. **Pull System**: On "Master Sync", the server fetches data from multiple Google Sheets (Users, Team, Targets, Products).
2. **Local Processing**: Data is stored in SQLite. Complex SQL queries handle MTD (Month-to-Date) and RPD (Required Per Day) calculations in milliseconds.
3. **Push System**: After processing, the server generates summarized reporting spreadsheets and pushes them back to Google Sheets (e.g., `OB_Performance` and `Targets_vs_Achievement` tabs).
4. **Authentication**: JWT-based auth. Every login triggers a fresh sync of the `Users` sheet to ensure 100% registration accuracy.

## 3. Database Schema (SQLite)
- `submitted_orders`: Stores all field entries (Date, OB, Customer, Volume).
- `ob_assignments`: Master list of Order Bookers, Town, and TSM mapping.
- `brand_targets`: Targets assigned per OB, per Brand, per Month.
- `app_config`: Stores system-wide settings like `last_sync_at`.
- `users`: Registered users with roles (Admin, RSM, NSM, TSM, OB).

## 4. Key Reports & Logic
- **Master Sync**: Triggers a full recalculation of all KPIs.
- **Target vs Achievement**: Deep drill-down from National level to individual OB routes.
- **Real-time Registration**: Login logic checks the Google Sheet directly before allowing entry, preventing "User not registered" errors for new staff.
- **RPD Calculation**: Dynamically determines how many cases an OB needs to sell daily to hit their monthly target based on remaining working days.

## 5. Main Files
- `/server.ts`: The "Brain". Handles all background tasks, Google API calls, and data syncing.
- `/src/App.tsx`: The "Heart". Contains the UI logic for the National Dashboard, operational stats, and reporting views.
- `/src/components/Login.tsx`: Secure entry point.
- `/src/components/MainNav.tsx`: Navigation mapping and role-based visibility.
