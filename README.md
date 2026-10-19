# Campus Lost & Found — Field Project Web Application

A centralized, responsive, role-based campus item-recovery platform engineered for colleges and universities.

> 🌐 **Live Public Prototype URL:** [https://captain-locking-allow-purchasing.trycloudflare.com](https://captain-locking-allow-purchasing.trycloudflare.com)  
> *(Accessible worldwide on any desktop, tablet, or smartphone without installation)*
>
> 📱 **Download Android App (APK):** [https://github.com/VikrantGawai/campus-lost-and-found/releases](https://github.com/VikrantGawai/campus-lost-and-found/releases)  
> *(Download directly to any Android device to install and test as a native mobile application)*

## Key Features & Highlights

1. **Return Assistance (Core Differentiator)**
   - Finders are never forced to store or personally deliver found items.
   - 4 Flexible custody paths:
     1. Drop off at an **Authorized Collection Desk** (Library, Student Center, Campus Security).
     2. Request a **Campus Volunteer Courier** dispatch.
     3. Propose a **Scheduled Public Handover** at a safe campus location.
     4. Keep the item temporarily until instructions arrive.

2. **Smart Matching Engine**
   - Transparent, rule-based matching combining:
     - Category taxonomic match (35%)
     - Keyword text overlap via tokenization & stop-word filtration (30%)
     - Campus location proximity (20%)
     - Date & timeline proximity within a 14-day sliding window (15%)
   - Explains *why* each match was suggested and labels results as suggestions.

3. **Privacy & Sensitive Belonging Protection**
   - Public cards **never** disclose phone numbers, full ID numbers, or private ownership proofs.
   - Private ownership evidence is kept confidential and only visible to the reporter and authorized administrators.
   - Dedicated workflows for high-risk categories (IDs, wallets, phones, storage drives).

4. **Claims & Verification Workflow**
   - Non-claimant descriptions are prevented from acting as proof.
   - Finders and admins can inspect submitted private evidence and mark claims as **Approved**, **Rejected**, or send them for **Collection Desk Review**.

5. **Role-Based Authorization & Admin Panel**
   - Roles: Student, Volunteer, Admin.
   - Authorized desk interface to manage collection points, resolve disputed claims, monitor unresolved registries, and audit logs.

6. **Local Demo Mode & Firebase Ready**
   - Seamless out-of-the-box local demo mode with seeded sample records and localStorage persistence.
   - User switcher in the top bar allows instant testing across Student, Admin, and Volunteer personas.
   - Full Firebase configuration support (Auth, Firestore, Storage) with production security rules provided.

---

## Technical Stack

- **Frontend:** React 18 with Vite
- **Styling:** Tailwind CSS with custom navy & teal campus palette
- **Routing:** React Router v6
- **Icons:** Lucide React
- **Notifications:** React Hot Toast + in-app notification state
- **Backend / Database:** Cloud Firestore & Firebase Auth (or Local Demo Mode)

---

## Getting Started

### 1. Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm or pnpm

### 2. Installation
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## Demo Mode Usage

When running without Firebase credentials:
- A banner across the top indicates **Demo Mode Active**.
- Use the **user dropdown in the top header** to switch between:
  - `Priya Sharma (Student)` — has lost laptop sleeve & earbuds reports.
  - `Rahul Verma (Student)` — has lost wallet report & claim on found wallet.
  - `Ananya Gupta (Volunteer)` — has found items logged with return assistance.
  - `Admin Desk (Admin)` — has full access to the Admin Panel.
- Use the **Reset (🔄) button** in the top bar to revert all demo records to initial state.

---

## Firebase Configuration (Optional Production Setup)

To connect to a live Firebase backend:
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in your project credentials from Firebase Console:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-app
   VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   VITE_FORCE_DEMO_MODE=false
   ```
3. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules,storage
   ```
   (Uses `firestore.rules` and `storage.rules` in the project root).
