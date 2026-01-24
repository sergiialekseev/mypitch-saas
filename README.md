# MyPitch - AI Interviews

## Project overview
MyPitch is a modern SaaS web application scaffold for AI interview practice, built with React + Vite, Material UI, Firebase Authentication, Firestore, and Google Cloud Run.

## Tech stack
- React + TypeScript + Vite
- Material UI (MUI)
- Firebase Authentication (Google + email/password)
- Firestore
- Google Cloud Run
- Google Cloud Functions (example)
- GitHub Actions

## Directory structure
```
.
├── .firebaserc
├── .github
│   └── workflows
│       ├── deploy-backend.yml
│       ├── deploy-frontend.yml
│       └── deploy-functions.yml
├── .gitignore
├── README.md
├── cloudrun
│   ├── backend-service.yaml
│   └── frontend-service.yaml
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── backend
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   ├── src
│   │   └── index.ts
│   └── tsconfig.json
├── frontend
│   ├── .env.example
│   ├── Dockerfile
│   ├── index.html
│   ├── nginx.conf
│   ├── package.json
│   ├── public
│   │   └── favicon.svg
│   ├── src
│   │   ├── App.tsx
│   │   ├── components
│   │   │   └── NavBar.tsx
│   │   ├── context
│   │   │   └── AuthContext.tsx
│   │   ├── firebase.ts
│   │   ├── main.tsx
│   │   ├── pages
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── routes
│   │   │   └── ProtectedRoute.tsx
│   │   ├── styles.css
│   │   ├── theme.ts
│   │   └── vite-env.d.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
└── functions
    ├── package.json
    ├── src
    │   └── index.ts
    └── tsconfig.json
```

## Prerequisites
- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud SDK (`gcloud`)
- A Google Cloud project with billing enabled

## Initialization commands
```bash
# create the Vite app
npm create vite@latest frontend -- --template react-ts

# install frontend dependencies
cd frontend
npm install
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled firebase react-router-dom
cd ..

# backend setup
cd backend
npm install
npm install express cors firebase-admin dotenv
npm install -D typescript ts-node-dev @types/express @types/cors @types/node
cd ..

# functions setup
cd functions
npm install
npm install firebase-functions firebase-admin
npm install -D typescript
cd ..
```

## Environment variables
Frontend: `frontend/.env`
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_API_BASE_URL=http://localhost:8080
```

Backend: `backend/.env`
```
PORT=8080
CORS_ORIGIN=http://localhost:5173
```

## Local development
```bash
# frontend
cd frontend
npm run dev

# backend
cd backend
npm run dev
```

For local Firestore access from the backend:
```bash
gcloud auth application-default login
```

## Firebase setup
```bash
firebase login
firebase use --add
firebase init firestore functions
```

Enable Google and email/password providers:
- Firebase Console -> Authentication -> Sign-in method

Firestore rules are in `firestore.rules`.

## Google Cloud setup
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

gcloud services enable run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  firestore.googleapis.com \
  iam.googleapis.com

# create artifact registry for docker images
gcloud artifacts repositories create mypitch \
  --repository-format=docker \
  --location=us-central1
```

## Build and deploy: Cloud Run
Frontend (Cloud Run):
```bash
cd frontend

docker build \
  --build-arg VITE_FIREBASE_API_KEY=YOUR_KEY \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN=YOUR_DOMAIN \
  --build-arg VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID \
  --build-arg VITE_FIREBASE_APP_ID=YOUR_APP_ID \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET=YOUR_BUCKET \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID \
  --build-arg VITE_API_BASE_URL=YOUR_BACKEND_URL \
  -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/mypitch/mypitch-frontend:latest .

docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/mypitch/mypitch-frontend:latest

gcloud run deploy mypitch-frontend \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/mypitch/mypitch-frontend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated
```

Backend (Cloud Run):
```bash
cd backend

docker build -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/mypitch/mypitch-backend:latest .

docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/mypitch/mypitch-backend:latest

gcloud run deploy mypitch-backend \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/mypitch/mypitch-backend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars CORS_ORIGIN=YOUR_FRONTEND_URL
```

## Environment variables and secrets
Backend env vars in Cloud Run:
```bash
gcloud run services update mypitch-backend \
  --region us-central1 \
  --set-env-vars CORS_ORIGIN=YOUR_FRONTEND_URL
```

Frontend variables are compiled at build time. Set them as Docker build args or GitHub Actions secrets.

## Local testing
```bash
curl http://localhost:8080/api/health
```

## Cloud testing
```bash
gcloud run services describe mypitch-backend --region us-central1 --format='value(status.url)'
```

## Cloud Functions example deployment
```bash
cd functions
npm run build
firebase deploy --only functions
```

## CI/CD (GitHub Actions)
Workflows in `.github/workflows/` build and deploy frontend and backend to Cloud Run. Set these secrets in GitHub:
- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GCP_SA_KEY`
- `FRONTEND_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_API_BASE_URL`

For functions deployment:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_TOKEN`

## Linking Firebase config with frontend
Firebase web config is in Firebase Console -> Project settings -> General -> Your apps. Copy values into `frontend/.env` or GitHub Actions secrets.

## Development commands
```bash
cd frontend
npm run dev

cd backend
npm run dev
```
