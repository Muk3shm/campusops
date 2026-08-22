# CampusOps

**Cloud-Native Campus Operations & Knowledge Management Platform**

CampusOps is a multi-cloud web platform designed to centralize and streamline campus service-issue reporting, tracking, resolution, and knowledge sharing.

## Features

- 📋 **Service Request Management** — Report, track, and resolve campus issues
- 🎯 **Priority & Status Tracking** — LOW/MEDIUM/HIGH/CRITICAL priorities with OPEN → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED lifecycle
- 📊 **Role-Based Dashboards** — Separate views for Students, Technicians, and Administrators
- 📚 **Knowledge Base** — Searchable articles for common campus IT issues
- 📱 **Responsive Design** — Works on desktop, tablet, and mobile

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, JavaScript |
| Routing | React Router v8 |
| Icons | Lucide React |
| Styling | CSS Modules + Custom Properties |
| Backend (planned) | AWS API Gateway, Lambda, DynamoDB, S3 |
| Hosting (planned) | Azure Static Web Apps |
| CI/CD (planned) | Azure DevOps |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm (comes with Node.js)

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/campusops.git
cd campusops
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── layout/          # App shell (Header, Sidebar, Layout)
│   └── ui/              # Reusable UI components (badges, cards, tables)
├── data/                # Mock data (will be replaced by AWS APIs)
├── services/            # API service layer (single integration point)
├── pages/               # Page components (one per route)
├── styles/              # Global design tokens and CSS reset
├── App.jsx              # Router configuration
└── main.jsx             # Entry point
```

## Architecture

```
React Frontend
      │
      ▼
services/api.js          ← Single integration point
      │
      ├── data/mock*.js  ← Current: local mock data
      │
      └── AWS API Gateway ← Future: real cloud backend
            │
            ▼
         AWS Lambda
            │
            ├── DynamoDB
            └── S3
```

## Current Status

- ✅ Frontend foundation complete
- ✅ 9 pages with responsive layouts
- ✅ Reusable component library
- ✅ Mock data with service layer pattern
- 🔲 Backend API (AWS)
- 🔲 Authentication (AWS Cognito)
- 🔲 Cloud hosting (Azure Static Web Apps)
- 🔲 CI/CD pipeline (Azure DevOps)

## License

This project is part of an academic coursework submission.
