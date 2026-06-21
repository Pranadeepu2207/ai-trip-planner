# Trao AI Travel Planner

Trao AI Travel Planner is a production-ready, multi-user web application that allows users to create, customize, and save travel itineraries powered by Google Gemini. It estimates realistic budgets, suggests local lodging options, and includes a creative custom feature: a weather-aware packing assistant.

---

## 1. Chosen Tech Stack & Justification

- **Backend**: **Node.js (Express.js)**
  - Fast, event-driven, and highly scalable REST API server. Perfect for handling asynchronous AI network transactions.
- **Frontend**: **React.js (Vite)**
  - Extremely fast compilation, optimized bundle loading, and state management. Uses Javascript and standard hooks to render UI updates smoothly.
- **Styling**: **Tailwind CSS**
  - Utility-first framework used to construct a modern, premium dark-mode theme featuring glassmorphic forms and vertical timeline visual cues.
- **Database**: **Mongoose ODM (MongoDB)**
  - High flexibility for nested itinerary structures. 
  - **In-Memory Fallback**: For zero-configuration setups, if no `MONGO_URI` is supplied in the `.env` file, the server launches an in-memory database (`mongodb-memory-server`) automatically.

---

## 2. High-Level Architecture & User Isolation

```
┌────────────────────────────────────────────────────────┐
│                    React Client (UI)                   │
│   (Auth State, Trip Form, Dynamic Itinerary Board)     │
└───────────┬────────────────────────────────▲───────────┘
            │                                │
     REST Request                     JSON Response
 (JWT in Auth Header)           (Strict User-Isolated Data)
            │                                │
┌───────────▼────────────────────────────────┼───────────┐
│               Express.js REST API Server               │
│   ┌────────────────────────────────────────────────┐   │
│   │               Auth Middleware                  │   │
│   │   (Decodes JWT, Enforces req.user.id Checks)   │   │
│   └───────────────────────┬────────────────────────┘   │
│                           │                            │
│           ┌───────────────┴───────────────┐            │
│           ▼                               ▼            │
│   ┌───────────────┐               ┌───────────────┐    │
│   │  Trip Routes  │               │  User Routes  │    │
│   └───────┬───────┘               └───────┬───────┘    │
└───────────┼───────────────────────────────┼────────────┘
            │                               │
            ├───────────────┐               │
            ▼               ▼               ▼
 ┌───────────────────┐ ┌─────────┐ ┌─────────────────┐
 │ Google Gemini API │ │ MongoDB │ │  MongoDB Users  │
 │ (LLM Generation)  │ │  Trips  │ │  (Hashed Pass)  │
 └───────────────────┘ └─────────┘ └─────────────────┘
```

- **Authentication**: Users submit credentials via `/api/auth/register` and `/api/auth/login`. Password storage is secured using `bcryptjs` one-way hashing with 10 salt rounds.
- **User Authorization Enclave**: private endpoints require an `Authorization: Bearer <TOKEN>` header. The JWT validation middleware decodes the token and attaches the user identifier payload to `req.user.id`.
- **Database Isolation**: The Mongoose `Trip` collection explicitly defines a `userId` index. Trip read, write, update, and deletion queries restrict scope via `userId: req.user.id`, preventing data leakage between accounts.

---

## 3. Setup & Running Instructions

### Prerequisites
- **Node.js**: Version 18.x or 20.x (LTS) installed locally.

### Local Development Setup

1. **Clone or Open project root**:
   ```bash
   cd C:\Users\HP\.gemini\antigravity-ide\scratch\ai-travel-planner
   ```

2. **Configure Backend Settings**:
   - Navigate to the backend directory:
     ```bash
     cd backend
     ```
   - Rename `.env.example` to `.env` (or copy it).
   - Enter your Google AI Studio key:
     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
     ```
   - *Note*: If you leave `MONGO_URI` empty, the system automatically starts `mongodb-memory-server` in the background.

3. **Install & Launch Backend**:
   ```bash
   npm install
   npm start
   ```
   The backend REST server will start listening on port `5000`.

4. **Install & Launch Frontend**:
   - Open a separate terminal at the project root and navigate to the frontend directory:
     ```bash
     cd frontend
     ```
   - Install packages and launch:
     ```bash
     npm install
     npm run dev
     ```
   The client will compile and serve on: `http://localhost:3000/`.

---

## 4. AI Agent Design & Creative Feature

### Prompt Engineering & Fallbacks
The backend coordinates generation parameters using Google's Gemini 2.5 Flash API (utilizing `responseMimeType: "application/json"` to ensure structured schemas). If rate limits (HTTP 429) or transient delays occur, an exponential retry handler waits progressively before attempting again. The controller attempts `gemini-2.5-flash` first and falls back to `gemini-1.5-flash` to guarantee high availability.

### Creative Custom Feature: AI Weather-Aware Packing Assistant
The assistant solves a major travel pain point—under/over-packing.
- It cross-references the destination climate, duration, and planned itinerary activities to compile a weather-optimized checklist.
- Items are grouped into categories: *Documents & Vault*, *Climate Wear*, *Activity Equipment*, and *Other*.
- Users can check/uncheck items dynamically from the frontend; progress state updates in the MongoDB record and renders an active percentage completions bar.

---

## 5. Key Design Decisions & Known Limitations

### Design Decisions
- **State-Based Navigation Router**: Instead of introducing nested dependencies like `react-router-dom`, the client utilizes a centralized, reactive state-based router. This avoids hydration issues and guarantees responsive page loads.
- **Dynamic Timeline Regeneration**: Instead of forcing a full rewrite for simple updates, the app supports single-day regeneration prompts (e.g. *"Focus Day 2 on seafood dining"*), requesting update blocks from the LLM and replacing only the targeted Mongoose day sub-document.

### Known Limitations
- **Session Duration**: JWT tokens are signed for 30 days and are stored in client `localStorage`.
- **In-Memory Database Lifespan**: When running in in-memory mode, user accounts and itinerary data persist as long as the backend server process is active. Data is cleared on server shutdown. (For persistence, simply uncomment `MONGO_URI` in `.env` and point to a running local or cloud MongoDB cluster).
