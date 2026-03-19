# Smart E-Waste Collection System - Backend Integration Documentation

## Project Overview

A comprehensive React + Vite + Tailwind CSS frontend for e-waste collection scheduling and tracking. Designed for Flask backend integration with MySQL database.

**Tech Stack**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, React Router, Recharts

---

## 🚀 Frontend Run & Build Instructions

### Prerequisites

- Node.js 18+ or Bun runtime
- npm, yarn, or bun package manager

### Installation

```bash
# Clone or extract the project
cd ewaste-frontend

# Install dependencies
npm install
# OR
bun install
```

### Development Server

```bash
# Start development server
npm run dev
# OR
bun dev
```

**Development Port**: `http://localhost:5173` (Vite default)

### Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

**Build Output**: `dist/` folder (ready for deployment)

### Environment Variables

Create a `.env` file in the project root (optional for demo mode):

```bash
# Backend API URL (only needed when connecting to Flask)
VITE_API_URL=http://localhost:5000/api

# Leave empty or omit to use demo/mock mode
```

### Available Scripts

| Command           | Description                          |
|-------------------|--------------------------------------|
| `npm run dev`     | Start development server (port 5173) |
| `npm run build`   | Build for production                 |
| `npm run preview` | Preview production build             |
| `npm run lint`    | Run ESLint                           |
| `npm run test`    | Run Vitest tests                     |

---

## 🔧 Demo Mode Toggle (IMPORTANT)

### Single Configuration Point

**File**: `src/services/index.ts`

```typescript
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  useMock: true,  // ← TOGGLE THIS
};
```

### To Switch from Demo to Real Backend:

1. Open `src/services/index.ts`
2. Change `useMock: true` → `useMock: false`
3. Set `VITE_API_URL` in `.env` to your Flask backend URL
4. Restart the development server

### What Changes:

| Mode          | `useMock` | Data Source                    |
|---------------|-----------|--------------------------------|
| Demo Mode     | `true`    | `src/data/mockData.ts`         |
| Production    | `false`   | Flask REST API endpoints       |

### Demo Accounts (Mock Mode Only)

| Email                        | Password     | Role      |
|------------------------------|--------------|-----------|
| admin@ewaste.com             | password123  | ADMIN     |
| john.citizen@email.com       | password123  | USER      |
| sam.collector@email.com      | password123  | COLLECTOR |
| greentech@recycling.com      | password123  | RECYCLER  |

---

## ✅ Export Readiness Checklist

### Pages Included (All 35+ routes working)

**Auth Pages (3)**
- ✅ `/login` - Role-based login with animations
- ✅ `/register` - Role-based registration
- ✅ `/forgot-password` - Password recovery UI

**Admin Pages (9)**
- ✅ `/admin` - Dashboard with metrics
- ✅ `/admin/users` - User management
- ✅ `/admin/pickups` - Pickup management
- ✅ `/admin/approvals` - Pending approvals
- ✅ `/admin/routes` - Route planning
- ✅ `/admin/reports` - Analytics & reports
- ✅ `/admin/settings` - System settings
- ✅ `/admin/profile` - Admin profile
- ✅ `/admin/notifications` - System notifications

**User Pages (9)**
- ✅ `/user` - Citizen dashboard
- ✅ `/user/new-pickup` - 4-step pickup wizard
- ✅ `/user/track` - Active pickup tracking
- ✅ `/user/track/:id` - Pickup details
- ✅ `/user/history` - Pickup history
- ✅ `/user/feedback` - Submit feedback
- ✅ `/user/notifications` - User notifications
- ✅ `/user/profile` - User profile
- ✅ `/user/settings` - User settings

**Collector Pages (8)**
- ✅ `/collector` - Collector dashboard
- ✅ `/collector/tasks` - Assigned tasks
- ✅ `/collector/task/:id` - Task details
- ✅ `/collector/completed` - Completed tasks
- ✅ `/collector/performance` - Performance stats
- ✅ `/collector/notifications` - Collector notifications
- ✅ `/collector/profile` - Collector profile
- ✅ `/collector/settings` - Collector settings

**Recycler Pages (8)**
- ✅ `/recycler` - Recycler dashboard
- ✅ `/recycler/incoming` - Incoming items
- ✅ `/recycler/log` - Recycling log
- ✅ `/recycler/certificates` - Certificate management
- ✅ `/recycler/reports` - Recycler reports
- ✅ `/recycler/notifications` - Recycler notifications
- ✅ `/recycler/profile` - Recycler profile
- ✅ `/recycler/settings` - Recycler settings

### Assets Included

- ✅ All Framer Motion animations embedded in components
- ✅ Lucide React icons (vector, no external files)
- ✅ Tailwind CSS styles (compiled at build)
- ✅ DiceBear avatars (external URLs, no local files needed)
- ✅ Google Fonts loaded via CSS (Inter font)

### No External Dependencies Required

- ✅ No local image files to include
- ✅ No custom fonts to bundle
- ✅ All icons are inline SVG (Lucide)
- ✅ Animations are code-based (Framer Motion)

---

## 1️⃣ System Flow - Complete Lifecycle

### Role-Based Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          E-WASTE COLLECTION LIFECYCLE                        │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │  REGISTER   │
                              └──────┬──────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
   ┌───────────┐              ┌───────────┐              ┌───────────┐
   │  CITIZEN  │              │ COLLECTOR │              │ RECYCLER  │
   │  (USER)   │              │  (PENDING)│              │ (PENDING) │
   └─────┬─────┘              └─────┬─────┘              └─────┬─────┘
         │                          │                          │
         │                          ▼                          ▼
         │                    ┌───────────┐              ┌───────────┐
         │                    │   ADMIN   │              │   ADMIN   │
         │                    │ APPROVAL  │              │ APPROVAL  │
         │                    └─────┬─────┘              └─────┬─────┘
         │                          │                          │
         ▼                          ▼                          ▼
   ┌───────────┐              ┌───────────┐              ┌───────────┐
   │  CREATE   │              │ APPROVED  │              │ APPROVED  │
   │  PICKUP   │              │ COLLECTOR │              │ RECYCLER  │
   │  REQUEST  │              └─────┬─────┘              └─────┬─────┘
   └─────┬─────┘                    │                          │
         │                          │                          │
         ▼                          │                          │
   ┌───────────┐                    │                          │
   │ REQUESTED │◄───────────────────┘                          │
   │  STATUS   │    (Admin assigns)                            │
   └─────┬─────┘                                               │
         │                                                     │
         ▼                                                     │
   ┌───────────┐                                               │
   │  ASSIGNED │ ─► Collector receives task                    │
   └─────┬─────┘                                               │
         │                                                     │
         ▼                                                     │
   ┌───────────┐                                               │
   │  EN_ROUTE │ ─► Collector traveling                        │
   └─────┬─────┘                                               │
         │                                                     │
         ▼                                                     │
   ┌───────────┐                                               │
   │ COLLECTED │ ─► Pickup complete                            │
   └─────┬─────┘                                               │
         │                                                     │
         ▼                                                     │
   ┌────────────────┐                                          │
   │ HANDED_TO_     │ ◄────────────────────────────────────────┘
   │ RECYCLER       │    (Collector hands to Recycler)
   └───────┬────────┘
           │
           ▼
   ┌───────────┐
   │PROCESSING │ ─► Recycler processing
   └─────┬─────┘
         │
         ▼
   ┌───────────┐
   │  RECYCLED │ ─► Complete! Certificate generated
   └─────┬─────┘
         │
         ▼
   ┌───────────────┐
   │  CERTIFICATE  │ ─► User can download
   │   GENERATED   │
   └───────────────┘
```

### Detailed Step-by-Step Flow

#### Phase 1: Registration & Authentication

```
1. User visits /register
2. Selects role: CITIZEN | COLLECTOR | RECYCLER
3. Fills required fields:
   - All: Name, Email, Phone, Password, Address
   - Collector: + Vehicle Type, License Number
   - Recycler: + Facility Name, Certification
4. Submit registration
5. For CITIZEN: Immediate access
6. For COLLECTOR/RECYCLER: Status = PENDING (awaits admin approval)
7. Login redirects to role-specific dashboard
```

#### Phase 2: Citizen Pickup Request

```
1. Citizen logs in → /user/dashboard
2. Clicks "New Pickup" → /user/new-pickup
3. Wizard Step 1: Select e-waste items (category, quantity, weight)
4. Wizard Step 2: Enter/confirm pickup address
5. Wizard Step 3: Choose date and time slot
6. Wizard Step 4: Review & Submit
7. Status = REQUESTED
8. Citizen can track at /user/track
```

#### Phase 3: Admin Assignment

```
1. Admin logs in → /admin
2. Views pending requests in Pickup Management
3. Selects available collector
4. Assigns collector to pickup
5. Status = ASSIGNED
6. Both collector and citizen notified
```

#### Phase 4: Collector Collection

```
1. Collector logs in → /collector
2. Views assigned tasks
3. Starts task → Status = EN_ROUTE
4. Navigates to location (Google Maps integration ready)
5. Collects e-waste → Status = COLLECTED
6. Hands to recycler → Status = HANDED_TO_RECYCLER
7. Task complete for collector
```

#### Phase 5: Recycler Processing

```
1. Recycler logs in → /recycler
2. Views incoming items
3. Receives batch → Status = PROCESSING
4. Logs materials breakdown (plastic, metal, etc.)
5. Completes recycling → Status = RECYCLED
6. Generates certificate
7. Certificate available for citizen download
```

#### Phase 6: Completion & Reporting

```
1. Citizen receives notification
2. Downloads recycling certificate
3. Can leave feedback (1-5 stars + comment)
4. Data feeds into admin reports
5. Environmental impact calculated (CO₂ saved)
```

---

## 2️⃣ Business Logic Mapping

### Role-Based Access Control

| Role      | Access Level | Dashboard Route | Approval Required |
|-----------|--------------|-----------------|-------------------|
| ADMIN     | Full system  | /admin          | No                |
| USER      | Own requests | /user           | No                |
| COLLECTOR | Assigned tasks| /collector     | Yes               |
| RECYCLER  | Processing   | /recycler       | Yes               |

### Approval Logic

```typescript
// New registration check
if (role === 'COLLECTOR' || role === 'RECYCLER') {
  approvalStatus = 'PENDING';
  // Requires admin action
} else {
  approvalStatus = null; // Regular users don't need approval
}

// Admin approval action
async function approveUser(userId: string) {
  // Updates approvalStatus from 'PENDING' to 'APPROVED'
  // For collectors: also sets isAvailable = true
}

async function rejectUser(userId: string) {
  // Updates approvalStatus to 'REJECTED'
  // User cannot login/access dashboard
}
```

### Pickup Status State Machine

```
REQUESTED ──► ASSIGNED ──► EN_ROUTE ──► COLLECTED ──► HANDED_TO_RECYCLER ──► PROCESSING ──► RECYCLED
     │                                                                                          │
     └────────────────────────────────► CANCELLED ◄─────────────────────────────────────────────┘
```

**Status Transition Rules:**
```typescript
const validTransitions = {
  REQUESTED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['EN_ROUTE', 'CANCELLED'],
  EN_ROUTE: ['COLLECTED'],
  COLLECTED: ['HANDED_TO_RECYCLER'],
  HANDED_TO_RECYCLER: ['PROCESSING'],
  PROCESSING: ['RECYCLED'],
  RECYCLED: [] // Terminal state
};
```

### Dashboard Logic by Role

**Admin Dashboard:**
- View all system metrics
- Manage all users (approve/reject/suspend)
- Assign collectors to pickups
- View and generate reports
- Configure system settings

**User Dashboard:**
- View own pickup requests
- Create new requests
- Track active pickups
- Download certificates
- Submit feedback

**Collector Dashboard:**
- View assigned tasks
- Update task status
- View performance metrics
- Mark availability

**Recycler Dashboard:**
- View incoming items
- Log recycling activities
- Generate certificates
- View processing statistics

---

## 3️⃣ Demo Data Details

### Demo Accounts

| Email                        | Password     | Role      | Status   |
|------------------------------|--------------|-----------|----------|
| admin@ewaste.com             | password123  | ADMIN     | Active   |
| john.citizen@email.com       | password123  | USER      | Active   |
| sam.collector@email.com      | password123  | COLLECTOR | APPROVED |
| greentech@recycling.com      | password123  | RECYCLER  | APPROVED |

### Demo Users (Citizens)

```javascript
[
  {
    id: 'user-1',
    email: 'john.citizen@email.com',
    name: 'John Citizen',
    phone: '+1234567890',
    address: '123 Green Street, Eco City, EC 12345',
    role: 'USER'
  },
  {
    id: 'user-2',
    email: 'jane.doe@email.com',
    name: 'Jane Doe',
    phone: '+1234567891',
    address: '456 Leaf Avenue, Eco City, EC 12346',
    role: 'USER'
  },
  {
    id: 'user-3',
    email: 'mike.green@email.com',
    name: 'Mike Green',
    phone: '+1234567892',
    address: '789 Oak Road, Eco City, EC 12347',
    role: 'USER'
  }
]
```

### Demo Collectors

```javascript
[
  {
    id: 'collector-1',
    name: 'Sam Collector',
    vehicleType: 'Van',
    licenseNumber: 'COL-2024-001',
    approvalStatus: 'APPROVED',
    isAvailable: true,
    totalPickups: 156,
    rating: 4.8
  },
  {
    id: 'collector-2',
    name: 'Alex Driver',
    vehicleType: 'Truck',
    licenseNumber: 'COL-2024-002',
    approvalStatus: 'APPROVED',
    isAvailable: true,
    totalPickups: 89,
    rating: 4.5
  },
  {
    id: 'collector-3',
    name: 'New Collector',
    vehicleType: 'Pickup',
    licenseNumber: 'COL-2024-003',
    approvalStatus: 'PENDING', // For testing approval flow
    isAvailable: false,
    totalPickups: 0
  }
]
```

### Demo Recyclers

```javascript
[
  {
    id: 'recycler-1',
    name: 'GreenTech Recycling',
    facilityName: 'GreenTech Recycling Center',
    certification: 'ISO-14001-2024',
    approvalStatus: 'APPROVED',
    totalProcessed: 5420
  },
  {
    id: 'recycler-2',
    name: 'EcoProcess Industries',
    facilityName: 'EcoProcess Recycling Facility',
    certification: 'R2-2024',
    approvalStatus: 'APPROVED',
    totalProcessed: 3280
  }
]
```

### Demo Pickup Requests

```javascript
[
  {
    id: 'pickup-1',
    userName: 'John Citizen',
    items: [{ category: 'LAPTOP', quantity: 1 }, { category: 'MOBILE', quantity: 3 }],
    status: 'ASSIGNED',
    collectorName: 'Sam Collector'
  },
  {
    id: 'pickup-2',
    userName: 'Jane Doe',
    items: [{ category: 'TV', quantity: 1 }, { category: 'COMPUTER', quantity: 1 }],
    status: 'REQUESTED',
    priority: 'URGENT'
  },
  {
    id: 'pickup-3',
    userName: 'John Citizen',
    items: [{ category: 'PRINTER', quantity: 2 }],
    status: 'RECYCLED',
    collectorName: 'Alex Driver',
    recyclerName: 'GreenTech Recycling',
    feedback: { rating: 5, comment: 'Excellent service!' }
  },
  {
    id: 'pickup-4',
    userName: 'Mike Green',
    items: [{ category: 'REFRIGERATOR', quantity: 1 }],
    status: 'EN_ROUTE',
    collectorName: 'Sam Collector'
  },
  {
    id: 'pickup-5',
    userName: 'Jane Doe',
    items: [{ category: 'BATTERY', quantity: 10 }, { category: 'CABLE', quantity: 20 }],
    status: 'COLLECTED',
    collectorName: 'Alex Driver'
  }
]
```

### E-Waste Categories

| Category        | Label             | Avg Weight (kg) |
|-----------------|-------------------|-----------------|
| COMPUTER        | Desktop Computer  | 10              |
| LAPTOP          | Laptop            | 2.5             |
| MOBILE          | Mobile Phone      | 0.2             |
| TABLET          | Tablet            | 0.5             |
| TV              | Television        | 20              |
| MONITOR         | Monitor           | 5               |
| PRINTER         | Printer           | 8               |
| REFRIGERATOR    | Refrigerator      | 50              |
| WASHING_MACHINE | Washing Machine   | 40              |
| AC              | Air Conditioner   | 35              |
| MICROWAVE       | Microwave         | 12              |
| BATTERY         | Batteries         | 0.5             |
| CABLE           | Cables & Chargers | 0.3             |
| OTHER           | Other Electronics | 5               |

---

## 4️⃣ Services Mapping - Frontend to Backend

### Service Files Structure

```
src/services/
├── index.ts           # API configuration & exports
├── pickupService.ts   # Pickup CRUD operations
├── userService.ts     # User/Collector/Recycler management
├── collectorService.ts # Collector-specific operations
└── recyclerService.ts  # Recycler-specific operations
```

### API Configuration

```typescript
// src/services/index.ts
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  useMock: true, // Set to false for Flask integration
};
```

### Authentication Endpoints

| Frontend Action          | Method | Flask Endpoint          | Request Body                                          | Response                        |
|--------------------------|--------|-------------------------|-------------------------------------------------------|---------------------------------|
| Register new user        | POST   | /api/auth/register      | `{ name, email, phone, password, address, role, ... }` | `{ user, token }`              |
| Login                    | POST   | /api/auth/login         | `{ email, password }`                                  | `{ user, token, role }`        |
| Get current user         | GET    | /api/auth/me            | -                                                      | `{ user }`                     |
| Forgot password          | POST   | /api/auth/forgot        | `{ email }`                                            | `{ message }`                  |
| Reset password           | POST   | /api/auth/reset         | `{ token, password }`                                  | `{ message }`                  |

### Pickup Service Endpoints

| Service Method           | Method | Flask Endpoint                  | Request/Query                           | Response                     |
|--------------------------|--------|----------------------------------|----------------------------------------|------------------------------|
| getAll(filters)          | GET    | /api/pickups                     | `?userId=&status=&collectorId=`         | `PickupRequest[]`            |
| getById(id)              | GET    | /api/pickups/:id                 | -                                       | `PickupRequest`              |
| create(data)             | POST   | /api/pickups                     | `{ userId, items, address, date, ... }` | `PickupRequest`              |
| update(id, updates)      | PUT    | /api/pickups/:id                 | `{ ...updates }`                        | `PickupRequest`              |
| updateStatus(id, status) | PUT    | /api/pickups/:id/status          | `{ status }`                            | `PickupRequest`              |
| assignCollector(id, ...) | PUT    | /api/pickups/:id/assign          | `{ collectorId, collectorName }`        | `PickupRequest`              |
| assignRecycler(id, ...)  | PUT    | /api/pickups/:id/recycler        | `{ recyclerId, recyclerName }`          | `PickupRequest`              |
| updatePriority(id, ...)  | PUT    | /api/pickups/:id/priority        | `{ priority }`                          | `PickupRequest`              |
| cancel(id)               | DELETE | /api/pickups/:id                 | -                                       | `{ success }`                |
| addFeedback(...)         | POST   | /api/pickups/:id/feedback        | `{ rating, comment }`                   | `Feedback`                   |
| getUnassigned()          | GET    | /api/pickups/unassigned          | -                                       | `PickupRequest[]`            |
| getStats()               | GET    | /api/pickups/stats               | -                                       | `{ total, pending, ... }`    |

### User Service Endpoints

| Service Method               | Method | Flask Endpoint                   | Request/Query        | Response                     |
|------------------------------|--------|----------------------------------|----------------------|------------------------------|
| getAllUsers()                | GET    | /api/users                       | -                    | `User[]`                     |
| getUserById(id)              | GET    | /api/users/:id                   | -                    | `User`                       |
| getAllCollectors()           | GET    | /api/collectors                  | -                    | `Collector[]`                |
| getAvailableCollectors()     | GET    | /api/collectors/available        | -                    | `Collector[]`                |
| getCollectorById(id)         | GET    | /api/collectors/:id              | -                    | `Collector`                  |
| getAllRecyclers()            | GET    | /api/recyclers                   | -                    | `Recycler[]`                 |
| getApprovedRecyclers()       | GET    | /api/recyclers/approved          | -                    | `Recycler[]`                 |
| getRecyclerById(id)          | GET    | /api/recyclers/:id               | -                    | `Recycler`                   |
| getPendingApprovals()        | GET    | /api/admin/pending-approvals     | -                    | `(Collector\|Recycler)[]`    |
| approveUser(id)              | PUT    | /api/admin/approve/:id           | -                    | `{ success }`                |
| rejectUser(id)               | PUT    | /api/admin/reject/:id            | -                    | `{ success }`                |
| updateCollectorAvailability()| PUT    | /api/collectors/:id/availability | `{ isAvailable }`    | `{ success }`                |
| getStats()                   | GET    | /api/admin/stats                 | -                    | `{ totalUsers, ... }`        |

### Collector Service Endpoints

| Service Method           | Method | Flask Endpoint                      | Request              | Response                     |
|--------------------------|--------|-------------------------------------|----------------------|------------------------------|
| getMyTasks(collectorId)  | GET    | /api/collector/:id/tasks            | -                    | `PickupRequest[]`            |
| getTodaysTasks(id)       | GET    | /api/collector/:id/today            | -                    | `PickupRequest[]`            |
| getCompletedTasks(id)    | GET    | /api/collector/:id/completed        | -                    | `PickupRequest[]`            |
| startPickup(pickupId)    | PUT    | /api/collector/task/:id/start       | -                    | `PickupRequest`              |
| markCollected(id, ...)   | PUT    | /api/collector/task/:id/collect     | `{ notes, photo }`   | `PickupRequest`              |
| handToRecycler(...)      | PUT    | /api/collector/task/:id/handover    | `{ recyclerId, ... }`| `PickupRequest`              |
| addNotes(id, notes)      | PUT    | /api/collector/task/:id/notes       | `{ notes }`          | `PickupRequest`              |
| getPerformanceStats(id)  | GET    | /api/collector/:id/stats            | -                    | `{ totalPickups, ... }`      |

### Recycler Service Endpoints

| Service Method              | Method | Flask Endpoint                    | Request                 | Response                  |
|-----------------------------|--------|-----------------------------------|-------------------------|---------------------------|
| getIncomingItems(id)        | GET    | /api/recycler/:id/incoming        | -                       | `PickupRequest[]`         |
| getProcessingItems(id)      | GET    | /api/recycler/:id/processing      | -                       | `PickupRequest[]`         |
| getCompletedItems(id)       | GET    | /api/recycler/:id/completed       | -                       | `PickupRequest[]`         |
| receiveItem(pickupId, ...)  | PUT    | /api/recycler/item/:id/receive    | `{ actualWeight }`      | `PickupRequest`           |
| completeRecycling(id, ...)  | PUT    | /api/recycler/item/:id/complete   | `{ materials[] }`       | `{ pickup, log }`         |
| generateCertificate(id)     | POST   | /api/recycler/certificate         | `{ pickupId }`          | `RecyclingCertificate`    |
| getCertificates(recyclerId) | GET    | /api/recycler/:id/certificates    | -                       | `RecyclingCertificate[]`  |
| getCertificateById(id)      | GET    | /api/recycler/certificate/:id     | -                       | `RecyclingCertificate`    |
| getRecyclingLogs(id)        | GET    | /api/recycler/:id/logs            | -                       | `RecyclingLog[]`          |
| getStats(recyclerId)        | GET    | /api/recycler/:id/stats           | -                       | `{ totalProcessed, ... }` |

---

## 5️⃣ Features by Role

### Admin Features

| Feature                | Route                    | Description                                    |
|------------------------|--------------------------|------------------------------------------------|
| Dashboard Overview     | /admin                   | Key metrics, charts, system health             |
| User Management        | /admin/users             | View/search all users, suspend accounts        |
| Pending Approvals      | /admin/approvals         | Approve/reject collectors & recyclers          |
| Pickup Management      | /admin/pickups           | View all pickups, assign collectors            |
| Route Planning         | /admin/routes            | Plan collection routes (UI ready)              |
| Reports & Analytics    | /admin/reports           | Generate/export reports                        |
| Settings               | /admin/settings          | System configuration                           |
| Notifications          | /admin/notifications     | System alerts, approval requests               |
| Profile                | /admin/profile           | Admin profile management                       |

### User (Citizen) Features

| Feature                | Route                    | Description                                    |
|------------------------|--------------------------|------------------------------------------------|
| Dashboard              | /user                    | Welcome, quick actions, recent pickups         |
| Create Pickup Request  | /user/new-pickup         | 4-step wizard for scheduling                   |
| Track Active Pickup    | /user/track              | Real-time status, collector info, map          |
| Pickup History         | /user/history            | All past requests with filters                 |
| Pickup Details         | /user/pickup/:id         | Single pickup details, timeline                |
| Submit Feedback        | /user/feedback           | Rate completed pickups                         |
| Notifications          | /user/notifications      | Pickup updates, confirmations                  |
| Profile                | /user/profile            | Personal info, saved addresses                 |
| Settings               | /user/settings           | Preferences, notifications                     |

### Collector Features

| Feature                | Route                      | Description                                  |
|------------------------|----------------------------|----------------------------------------------|
| Dashboard              | /collector                 | Today's tasks, quick stats                   |
| My Tasks               | /collector/tasks           | All assigned pickups                         |
| Task Detail            | /collector/task/:id        | Pickup details, status actions               |
| Completed Tasks        | /collector/completed       | History of completed collections             |
| Performance Stats      | /collector/performance     | Ratings, completion rate, earnings           |
| Notifications          | /collector/notifications   | New assignments, updates                     |
| Profile                | /collector/profile         | Personal info, vehicle details               |
| Settings               | /collector/settings        | Availability, preferences                    |

### Recycler Features

| Feature                | Route                      | Description                                  |
|------------------------|----------------------------|----------------------------------------------|
| Dashboard              | /recycler                  | Processing overview, metrics                 |
| Incoming Items         | /recycler/incoming         | Items from collectors                        |
| Recycling Log          | /recycler/log              | Processing activities                        |
| Certificates           | /recycler/certificates     | Generate & manage certificates               |
| Reports                | /recycler/reports          | Environmental impact, statistics             |
| Notifications          | /recycler/notifications    | Incoming batches, alerts                     |
| Profile                | /recycler/profile          | Facility info, certifications                |
| Settings               | /recycler/settings         | Preferences                                  |

---

## 6️⃣ SQL Database Schema

### Database Creation

```sql
-- Create Database
CREATE DATABASE IF NOT EXISTS ewaste_management;
USE ewaste_management;

-- Set character encoding
ALTER DATABASE ewaste_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Enums (MySQL doesn't have native enums, use CHECK constraints or ENUM type)

```sql
-- User Roles Enum
-- Values: 'ADMIN', 'USER', 'COLLECTOR', 'RECYCLER'

-- Approval Status Enum
-- Values: 'PENDING', 'APPROVED', 'REJECTED'

-- Pickup Status Enum
-- Values: 'REQUESTED', 'ASSIGNED', 'EN_ROUTE', 'COLLECTED', 'HANDED_TO_RECYCLER', 'PROCESSING', 'RECYCLED', 'CANCELLED'

-- Priority Enum
-- Values: 'NORMAL', 'URGENT'

-- Notification Type Enum
-- Values: 'INFO', 'SUCCESS', 'WARNING', 'ERROR'

-- E-Waste Category Enum
-- Values: 'COMPUTER', 'LAPTOP', 'MOBILE', 'TABLET', 'TV', 'MONITOR', 'PRINTER', 'REFRIGERATOR', 'WASHING_MACHINE', 'AC', 'MICROWAVE', 'BATTERY', 'CABLE', 'OTHER'

-- Material Type Enum
-- Values: 'PLASTIC', 'METAL', 'GLASS', 'CIRCUIT_BOARD', 'BATTERY', 'OTHER'

-- Recycling Status Enum
-- Values: 'RECEIVED', 'PROCESSING', 'RECYCLED', 'DISPOSED'
```

### Users Table (Base)

```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    role ENUM('ADMIN', 'USER', 'COLLECTOR', 'RECYCLER') NOT NULL DEFAULT 'USER',
    avatar VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role)
);
```

### Collectors Profile Table

```sql
CREATE TABLE collector_profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL UNIQUE,
    vehicle_type VARCHAR(50) NOT NULL,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    is_available BOOLEAN DEFAULT FALSE,
    total_pickups INT DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_approval_status (approval_status),
    INDEX idx_availability (is_available)
);
```

### Recyclers Profile Table

```sql
CREATE TABLE recycler_profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL UNIQUE,
    facility_name VARCHAR(200) NOT NULL,
    certification VARCHAR(100) NOT NULL,
    approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    total_processed INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_approval_status (approval_status)
);
```

### Pickup Requests Table

```sql
CREATE TABLE pickup_requests (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    collector_id VARCHAR(36),
    recycler_id VARCHAR(36),
    status ENUM('REQUESTED', 'ASSIGNED', 'EN_ROUTE', 'COLLECTED', 'HANDED_TO_RECYCLER', 'PROCESSING', 'RECYCLED', 'CANCELLED') DEFAULT 'REQUESTED',
    address TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time_slot VARCHAR(20) NOT NULL,
    total_weight DECIMAL(10,2) DEFAULT 0,
    priority ENUM('NORMAL', 'URGENT') DEFAULT 'NORMAL',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (collector_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (recycler_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_user_id (user_id),
    INDEX idx_collector_id (collector_id),
    INDEX idx_scheduled_date (scheduled_date)
);
```

### E-Waste Items Table

```sql
CREATE TABLE ewaste_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    pickup_id VARCHAR(36) NOT NULL,
    category ENUM('COMPUTER', 'LAPTOP', 'MOBILE', 'TABLET', 'TV', 'MONITOR', 'PRINTER', 'REFRIGERATOR', 'WASHING_MACHINE', 'AC', 'MICROWAVE', 'BATTERY', 'CABLE', 'OTHER') NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    estimated_weight DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (pickup_id) REFERENCES pickup_requests(id) ON DELETE CASCADE,
    INDEX idx_pickup_id (pickup_id),
    INDEX idx_category (category)
);
```

### Item Photos Table

```sql
CREATE TABLE item_photos (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    item_id VARCHAR(36) NOT NULL,
    photo_url VARCHAR(500) NOT NULL,
    photo_type ENUM('BEFORE', 'AFTER', 'PROOF') DEFAULT 'BEFORE',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (item_id) REFERENCES ewaste_items(id) ON DELETE CASCADE
);
```

### Feedback Table

```sql
CREATE TABLE feedback (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    pickup_id VARCHAR(36) NOT NULL UNIQUE,
    user_id VARCHAR(36) NOT NULL,
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (pickup_id) REFERENCES pickup_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_pickup_id (pickup_id)
);
```

### Recycling Logs Table

```sql
CREATE TABLE recycling_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    pickup_id VARCHAR(36) NOT NULL,
    recycler_id VARCHAR(36) NOT NULL,
    status ENUM('RECEIVED', 'PROCESSING', 'RECYCLED', 'DISPOSED') DEFAULT 'RECEIVED',
    actual_weight DECIMAL(10,2),
    co2_saved DECIMAL(10,2) DEFAULT 0,
    certificate_id VARCHAR(36),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (pickup_id) REFERENCES pickup_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (recycler_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_pickup_id (pickup_id),
    INDEX idx_recycler_id (recycler_id)
);
```

### Materials Breakdown Table

```sql
CREATE TABLE materials_breakdown (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    log_id VARCHAR(36) NOT NULL,
    material_type ENUM('PLASTIC', 'METAL', 'GLASS', 'CIRCUIT_BOARD', 'BATTERY', 'OTHER') NOT NULL,
    weight DECIMAL(10,2) NOT NULL,
    
    FOREIGN KEY (log_id) REFERENCES recycling_logs(id) ON DELETE CASCADE
);
```

### Recycling Certificates Table

```sql
CREATE TABLE recycling_certificates (
    id VARCHAR(50) PRIMARY KEY, -- Format: CERT-YYYY-NNNNNN
    pickup_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    recycler_id VARCHAR(36) NOT NULL,
    total_weight DECIMAL(10,2) NOT NULL,
    co2_saved DECIMAL(10,2) NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (pickup_id) REFERENCES pickup_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recycler_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_recycler_id (recycler_id)
);
```

### Notifications Table

```sql
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR') DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read)
);
```

### Time Slots Table

```sql
CREATE TABLE time_slots (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    label VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Insert default time slots
INSERT INTO time_slots (id, label, start_time, end_time) VALUES
('slot-1', 'Morning', '09:00:00', '12:00:00'),
('slot-2', 'Afternoon', '12:00:00', '15:00:00'),
('slot-3', 'Late Afternoon', '15:00:00', '18:00:00'),
('slot-4', 'Evening', '18:00:00', '20:00:00');
```

### Session/Token Table (For JWT)

```sql
CREATE TABLE user_sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token_hash),
    INDEX idx_expires (expires_at)
);
```

### Seed Data for Demo

```sql
-- Admin User
INSERT INTO users (id, email, password_hash, name, phone, address, role, avatar) VALUES
('admin-1', 'admin@ewaste.com', '$2b$10$...', 'Admin User', '+1234500000', 'E-Waste HQ, Eco City, EC 10000', 'ADMIN', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin');

-- Regular Users
INSERT INTO users (id, email, password_hash, name, phone, address, role, avatar) VALUES
('user-1', 'john.citizen@email.com', '$2b$10$...', 'John Citizen', '+1234567890', '123 Green Street, Eco City, EC 12345', 'USER', 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'),
('user-2', 'jane.doe@email.com', '$2b$10$...', 'Jane Doe', '+1234567891', '456 Leaf Avenue, Eco City, EC 12346', 'USER', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'),
('user-3', 'mike.green@email.com', '$2b$10$...', 'Mike Green', '+1234567892', '789 Oak Road, Eco City, EC 12347', 'USER', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike');

-- Collectors
INSERT INTO users (id, email, password_hash, name, phone, address, role, avatar) VALUES
('collector-1', 'sam.collector@email.com', '$2b$10$...', 'Sam Collector', '+1234560001', '100 Pickup Lane, Eco City, EC 12350', 'COLLECTOR', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam'),
('collector-2', 'alex.driver@email.com', '$2b$10$...', 'Alex Driver', '+1234560002', '200 Route Street, Eco City, EC 12351', 'COLLECTOR', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex');

INSERT INTO collector_profiles (user_id, vehicle_type, license_number, approval_status, is_available, total_pickups, rating) VALUES
('collector-1', 'Van', 'COL-2024-001', 'APPROVED', TRUE, 156, 4.8),
('collector-2', 'Truck', 'COL-2024-002', 'APPROVED', TRUE, 89, 4.5);

-- Recyclers
INSERT INTO users (id, email, password_hash, name, phone, address, role, avatar) VALUES
('recycler-1', 'greentech@recycling.com', '$2b$10$...', 'GreenTech Recycling', '+1234570001', '500 Recycle Boulevard, Eco City, EC 12400', 'RECYCLER', 'https://api.dicebear.com/7.x/avataaars/svg?seed=GreenTech'),
('recycler-2', 'ecoprocess@recycling.com', '$2b$10$...', 'EcoProcess Industries', '+1234570002', '600 Industrial Park, Eco City, EC 12401', 'RECYCLER', 'https://api.dicebear.com/7.x/avataaars/svg?seed=EcoProcess');

INSERT INTO recycler_profiles (user_id, facility_name, certification, approval_status, total_processed) VALUES
('recycler-1', 'GreenTech Recycling Center', 'ISO-14001-2024', 'APPROVED', 5420),
('recycler-2', 'EcoProcess Recycling Facility', 'R2-2024', 'APPROVED', 3280);

-- Sample Pickup Requests
INSERT INTO pickup_requests (id, user_id, collector_id, status, address, scheduled_date, scheduled_time_slot, total_weight, priority) VALUES
('pickup-1', 'user-1', 'collector-1', 'ASSIGNED', '123 Green Street, Eco City, EC 12345', '2024-02-15', '09:00 - 12:00', 3.0, 'NORMAL'),
('pickup-2', 'user-2', NULL, 'REQUESTED', '456 Leaf Avenue, Eco City, EC 12346', '2024-02-16', '14:00 - 17:00', 23.0, 'URGENT'),
('pickup-3', 'user-1', 'collector-2', 'RECYCLED', '123 Green Street, Eco City, EC 12345', '2024-01-25', '09:00 - 12:00', 12.0, 'NORMAL');

-- Note: Password hash should be generated by Flask using bcrypt
-- Demo password: password123
```

### ER Diagram (Text Representation)

```
┌─────────────┐       ┌──────────────────┐       ┌───────────────────┐
│   users     │       │ collector_profiles│       │ recycler_profiles │
├─────────────┤       ├──────────────────┤       ├───────────────────┤
│ id (PK)     │───┬──►│ user_id (FK)     │       │ user_id (FK)      │◄──┐
│ email       │   │   │ vehicle_type     │       │ facility_name     │   │
│ password    │   │   │ license_number   │       │ certification     │   │
│ name        │   │   │ approval_status  │       │ approval_status   │   │
│ phone       │   │   │ is_available     │       │ total_processed   │   │
│ address     │   │   │ total_pickups    │       └───────────────────┘   │
│ role        │   │   │ rating           │                               │
│ avatar      │   │   └──────────────────┘                               │
└─────────────┘   │                                                      │
      │           │   ┌──────────────────┐                               │
      │           └───│ pickup_requests  │◄──────────────────────────────┘
      │               ├──────────────────┤
      └──────────────►│ user_id (FK)     │
                      │ collector_id (FK)│
                      │ recycler_id (FK) │
                      │ status           │
                      │ address          │
                      │ scheduled_date   │
                      │ total_weight     │
                      │ priority         │
                      └────────┬─────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────┐  ┌─────────────────────┐
│  ewaste_items    │  │   feedback   │  │  recycling_logs     │
├──────────────────┤  ├──────────────┤  ├─────────────────────┤
│ pickup_id (FK)   │  │ pickup_id(FK)│  │ pickup_id (FK)      │
│ category         │  │ user_id (FK) │  │ recycler_id (FK)    │
│ quantity         │  │ rating       │  │ status              │
│ estimated_weight │  │ comment      │  │ actual_weight       │
│ description      │  └──────────────┘  │ co2_saved           │
└──────────────────┘                    │ certificate_id      │
                                        └──────────┬──────────┘
                                                   │
                              ┌────────────────────┴───────────────────┐
                              ▼                                        ▼
                   ┌─────────────────────┐              ┌───────────────────────┐
                   │ materials_breakdown │              │ recycling_certificates│
                   ├─────────────────────┤              ├───────────────────────┤
                   │ log_id (FK)         │              │ pickup_id (FK)        │
                   │ material_type       │              │ user_id (FK)          │
                   │ weight              │              │ recycler_id (FK)      │
                   └─────────────────────┘              │ total_weight          │
                                                        │ co2_saved             │
                                                        │ issued_at             │
                                                        └───────────────────────┘
```

---

## 7️⃣ Environmental Impact Calculations

### CO₂ Saved Formula

```python
# Approximate CO2 saved per kg of e-waste properly recycled
CO2_FACTOR = 0.5  # kg CO2 saved per kg e-waste

def calculate_co2_saved(weight_kg: float) -> float:
    return round(weight_kg * CO2_FACTOR, 2)
```

### Material Recovery Estimates

| Material       | % of E-Waste | Recovery Rate |
|----------------|--------------|---------------|
| Metal          | 40%          | 95%           |
| Plastic        | 30%          | 80%           |
| Circuit Boards | 15%          | 70%           |
| Glass          | 10%          | 90%           |
| Other          | 5%           | 50%           |

---

## 8️⃣ Flask Integration Checklist

### Environment Variables

```bash
# .env file for Flask
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here

# Database
DATABASE_URL=mysql://user:password@localhost/ewaste_management

# CORS (Frontend URL)
FRONTEND_URL=http://localhost:5173
```

### Required Flask Extensions

```bash
pip install flask
pip install flask-cors
pip install flask-jwt-extended
pip install flask-sqlalchemy
pip install flask-migrate
pip install mysql-connector-python
pip install bcrypt
pip install python-dotenv
```

### CORS Configuration

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=[os.getenv('FRONTEND_URL')], supports_credentials=True)
```

### JWT Configuration

```python
from flask_jwt_extended import JWTManager

app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)
```

---

## 9️⃣ Version Information

| Component     | Version    |
|---------------|------------|
| React         | 18.3.1     |
| TypeScript    | 5.x        |
| Vite          | 5.x        |
| Tailwind CSS  | 3.x        |
| Framer Motion | 12.x       |
| React Router  | 6.30.x     |
| Recharts      | 2.x        |

---

**Document Version**: 1.0.0  
**Last Updated**: February 2025  
**Status**: FROZEN - Production Ready
