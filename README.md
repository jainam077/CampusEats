# Campus Eats

**A comprehensive campus dining platform that helps students discover, review, and track meals across university dining halls.**

Built by **Team OMAJ** for Software Engineering CTW.

---

##  Project Overview

Campus Eats is a full-stack application featuring:
- **Web App** - Next.js 16 with Tailwind CSS
- **iOS App** - Native SwiftUI application
- **Backend API** - FastAPI (Python) with Supabase
- **AI Assistant** - OpenAI-powered food recommendations
- **Monitoring** - Grafana, Prometheus, and Loki stack

---

##  Architecture

```
campus-eats/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── backend/      # FastAPI backend
│   └── mobile/ios/   # SwiftUI iOS app
├── monitoring/       # Grafana/Prometheus/Loki configs
└── docker-compose.monitoring.yml
```

---

##  Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Xcode 15+ (for iOS)
- Docker (for monitoring stack)

### Environment Variables

Create `.env` files with the following variables:

**Backend (`apps/backend/.env`):**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
```

**Web (`apps/web/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Running the Applications

#### Web Frontend
```bash
cd apps/web
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

#### Backend API
```bash
cd apps/backend
python -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload
```
API available at [http://localhost:8000](http://localhost:8000)

#### iOS App
Open `apps/mobile/ios/CampusEatsMobile.xcodeproj` in Xcode and run.

#### Monitoring Stack
```bash
docker-compose -f docker-compose.monitoring.yml up -d
```
- Grafana: [http://localhost:4000](http://localhost:4000) (admin/campuseats)
- Prometheus: [http://localhost:9090](http://localhost:9090)

---

##  Features

### Core Features
-  **Smart Search** - Find dishes by name, cuisine, or dietary preferences
-  **Reviews & Ratings** - Rate and review dishes
-  **Favorites** - Save your favorite meals
-  **Nutrition Tracking** - Track calories, protein, carbs, and fat

### AI-Powered Features
-  **AI Chat Assistant** - Get personalized food recommendations
-  **Smart Recommendations** - Based on dietary preferences and history
-  **Voice Search** - Search by speaking (iOS)

### Advanced Features
-  **Location-Based Menus** - Auto-detect nearby dining halls
-  **Smart Notifications** - Alerts for favorite dishes being served
-  **Live Trending** - See what's popular right now
-  **Meal Builder** - Build balanced meals with nutrition goals

---

##  Tech Stack

| Layer | Technology |
|-------|------------|
| Web Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| iOS App | SwiftUI, Swift 5 |
| Backend | FastAPI, Python 3.11, Pydantic |
| Database | Supabase (PostgreSQL) |
| AI/LLM | OpenAI GPT-4 |
| Monitoring | Grafana, Prometheus, Loki, Promtail |
| Containerization | Docker, Docker Compose |

---

##  License

This project was created for educational purposes as part of a Software Engineering course.

