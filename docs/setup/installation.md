# Installation Guide

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Firebase account

## Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/Artenlaclase/financeflow.git
   cd financeflow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase configuration:
   - Create a new Firebase project
   - Enable Authentication and Firestore
   - Copy your Firebase configuration to `src/lib/firebase/config.ts`

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env.local` file in the root directory with your Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Build for Production

```bash
npm run build
npm start
```
