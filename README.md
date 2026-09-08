# 🍳 AI-Powered Recipe Sharing Platform

A full-stack recipe-sharing web application featuring an integrated LLM-powered chat assistant that answers questions about each recipe — with a resilient multi-provider AI fallback system for uninterrupted responses.

## ✨ Features

- **Create & browse recipes** — add recipes with title, ingredients, instructions, and an image
- **AI Chat Assistant** — ask questions about any recipe (substitutions, cooking tips, techniques) and get context-aware answers grounded in that specific recipe's data
- **Multi-provider AI fallback** — automatically switches between Google Gemini and Groq if one provider hits a rate limit or fails, with a rule-based fallback as a final safety net so the chat never breaks
- **Persistent storage** — recipes stored in MongoDB, with an in-memory fallback if the database is temporarily unreachable

## 🛠️ Tech Stack

**Backend:** Node.js, Express.js, Mongoose
**Database:** MongoDB (Atlas)
**AI Providers:** Google Gemini API, Groq API
**Frontend:** HTML, CSS, JavaScript
**Deployment:** Render (backend), Vercel (frontend), MongoDB Atlas (database)

## 📁 Project Structure

```
recipe-sharing/
├── backend/
│   ├── server.js        # Express app, routes, MongoDB connection
│   ├── aiChat.js         # AI chat logic + Gemini/Groq fallback pipeline
│   ├── package.json
│   └── .env               # Environment variables (not committed)
└── frontend/
    ├── index.html
    ├── script.js
    ├── style.css
    ├── submit.html
    └── view.html
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A MongoDB Atlas account (free tier) or local MongoDB instance
- A free Gemini API key ([aistudio.google.com/apikey](https://aistudio.google.com/apikey))
- A free Groq API key ([console.groq.com](https://console.groq.com))

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/recipe-sharing.git
   cd recipe-sharing/backend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file inside `backend/` with the following:
   ```env
   MONGO_URI=your_mongodb_connection_string
   PORT=5000
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-3.6-flash
   GROQ_API_KEY=your_groq_api_key
   GROQ_MODEL=openai/gpt-oss-120b
   ```

4. Start the backend
   ```bash
   npm start
   ```
   The server runs on `http://localhost:5000`

5. Open `frontend/index.html` in your browser (or serve it with a static server) to use the app.

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/recipes` | Fetch all recipes |
| POST | `/recipes` | Create a new recipe |
| POST | `/api/chat` | Chat with the AI assistant about a recipe |
| GET | `/health` | Health check |

## 🧠 How the AI Fallback Works

1. The app first tries **Gemini** for a response
2. If Gemini fails (quota exceeded, error, etc.), it automatically retries with **Groq**
3. If both providers are unavailable, a **rule-based fallback response** is returned so the chat still functions

This ensures the assistant stays responsive even under free-tier rate limits.

## ☁️ Deployment

- **Database:** MongoDB Atlas (free M0 cluster)
- **Backend:** Render (Node web service, env vars set in the Render dashboard)
- **Frontend:** Vercel (static site)

## 🔒 Environment Variables

| Variable | Description |
|----------|--------------|
| `MONGO_URI` | MongoDB connection string |
| `PORT` | Backend server port (default: 5000) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_MODEL` | Gemini model name |
| `GROQ_API_KEY` | Groq API key |
| `GROQ_MODEL` | Groq model name |

> ⚠️ Never commit your `.env` file. It's excluded via `.gitignore`.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
