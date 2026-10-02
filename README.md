🍳 AI-Powered Recipe Sharing Platform

A full-stack recipe-sharing platform with an LLM-powered cooking assistant that understands the selected recipe and uses a resilient multi-provider AI fallback pipeline to keep responses available even when an AI provider is rate-limited or unavailable.

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js">
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini">
  <img src="https://img.shields.io/badge/Groq-LLM-F55036?style=for-the-badge" alt="Groq">
  <img src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="Frontend">
</p>

<p align="center">
  <b>Share recipes. Explore recipes. Ask an AI assistant how to cook them.</b>
</p>

🌟 Project Overview
 
The AI-Powered Recipe Sharing Platform combines a traditional recipe-sharing application with an LLM-powered conversational assistant.

Users can create and browse recipes containing:

🍽️ Recipe title

🥕 Ingredients

👨‍🍳 Cooking instructions

🖼️ Recipe image

The platform also provides a contextual AI assistant that can answer questions about a specific recipe, such as:

"What can I use instead of butter?"

"How can I make this recipe less spicy?"

"At what stage should I add the tomatoes?"

"Can I replace this ingredient with something vegetarian?"

"What cooking technique is being used here?"

Instead of treating the AI assistant as a generic chatbot, the application provides the selected recipe's information as context so that responses are focused on the recipe the user is actually viewing.

✨ Key Features

🍽️ Recipe Management

Users can create and browse recipes through a simple web interface.

Each recipe can contain:

Recipe title

Ingredients

Cooking instructions

Image

Creation information

The application provides dedicated pages for creating and viewing recipes.

🔎 Browse Recipes

The platform allows users to explore recipes stored in MongoDB.

Typical flow:

Open Application
      │
      ▼
Browse Recipes
      │
      ▼
Select Recipe
      │
      ▼
View Ingredients
      │
      ▼
Read Instructions
      │
      ▼
Ask AI Assistant

🤖 AI Recipe Assistant

The main differentiating feature is the integrated LLM-powered cooking assistant.

The assistant is designed to answer questions using the context of the selected recipe.

Example

Suppose the recipe contains:

Recipe: Vegetable Pasta

Ingredients:
- Pasta
- Tomato
- Garlic
- Olive Oil
- Chili Flakes

Instructions:
1. Boil the pasta.
2. Prepare the tomato sauce.
3. Add garlic and chili flakes.
4. Mix the pasta with the sauce.

A user can ask:

Can I make this without chili flakes?

The assistant can use the recipe context to provide a response related to that specific dish instead of responding as a completely generic cooking chatbot.

🧠 Multi-Provider AI Fallback Architecture

A major reliability feature is the multi-provider AI fallback pipeline.

Instead of depending on only one LLM provider, the application follows:

                User Question
                      │
                      ▼
               AI Chat Endpoint
                      │
                      ▼
                 Try Gemini
                      │
              ┌───────┴───────┐
              │               │
           Success           Failure
              │               │
              ▼               ▼
          Response          Try Groq
                              │
                       ┌──────┴──────┐
                       │             │
                    Success        Failure
                       │             │
                       ▼             ▼
                   Response     Rule-Based
                                Fallback
                                    │
                                    ▼
                                 Response

Provider order

🟢 Google Gemini

🟠 Groq

🔵 Rule-based fallback

If Gemini is unavailable because of quota limits, rate limiting, temporary errors, or another provider failure, the application attempts Groq.

If both AI providers fail, the application returns a rule-based response instead of allowing the chat experience to completely break.

🛡️ Why the Fallback System Matters

LLM APIs can fail for reasons outside the application's control:

Rate limits

Free-tier quotas

Temporary provider outages

Network errors

Invalid provider responses

API configuration issues

Without fallback handling:

Gemini unavailable
       │
       ▼
❌ Chat fails

With FlashRecipe's fallback architecture:

Gemini unavailable
       │
       ▼
Try Groq
       │
       ├── Available ──► AI Response
       │
       └── Unavailable
               │
               ▼
        Rule-Based Response
               │
               ▼
          Chat continues

This makes the application more resilient to provider-specific failures.

🏗️ System Architecture

                         ┌──────────────────────┐
                         │      Frontend        │
                         │ HTML / CSS / JS      │
                         └──────────┬───────────┘
                                    │
                              HTTP / REST
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    Express.js API    │
                         │      Node.js         │
                         └───────┬───────┬──────┘
                                 │       │
                    ┌────────────┘       └─────────────┐
                    ▼                                  ▼
             ┌─────────────┐                    ┌──────────────┐
             │  MongoDB    │                    │  AI Pipeline │
             │   Atlas     │                    │              │
             │             │                    │ Gemini       │
             │ Recipes     │                    │     ↓        │
             │             │                    │ Groq         │
             └─────────────┘                    │     ↓        │
                                                │ Rule Fallback│
                                                └──────────────┘

🔄 Complete AI Request Flow

When a user sends a question from the recipe page:

User
 │
 │ "Can I replace butter?"
 ▼
Frontend
 │
 │ POST /api/chat
 ▼
Express API
 │
 │ Identify recipe
 ▼
Recipe Context
 │
 │ title + ingredients + instructions
 ▼
AI Provider Pipeline
 │
 ├── Gemini
 │
 ├── Groq
 │
 └── Rule-based fallback
 │
 ▼
AI Response
 │
 ▼
Frontend Chat UI

The important design decision is that the assistant is given recipe-specific context, allowing the response to remain focused on the selected recipe.

💾 Data Storage

Recipe data is stored using MongoDB through the Mongoose ODM.

Recipe information

Conceptually, a recipe contains:

Recipe
├── title
├── ingredients[]
├── instructions
├── image
└── createdAt

MongoDB Atlas provides the persistent cloud database used by the deployed application.

🛡️ Database Resilience

The application includes an in-memory fallback for situations where MongoDB is temporarily unavailable.

Conceptually:

                 Application
                      │
                      ▼
                MongoDB Atlas
                      │
               ┌──────┴──────┐
               │             │
           Available      Unavailable
               │             │
               ▼             ▼
          Persistent     In-Memory
            Storage       Fallback

This allows the application to continue serving data during temporary database connectivity problems instead of immediately failing every request.

The in-memory fallback is a resilience mechanism for the application; MongoDB remains the persistent storage layer.

📡 REST API

The backend exposes REST endpoints for recipe management and AI chat.

Method

Endpoint

Description

GET

/recipes

Fetch all recipes

POST

/recipes

Create a new recipe

POST

/api/chat

Ask the AI assistant about a recipe

GET

/health

Check backend health

Example recipe creation

POST /recipes
Content-Type: application/json

Example payload:

{
  "title": "Vegetable Pasta",
  "ingredients": [
    "Pasta",
    "Tomato",
    "Garlic",
    "Olive Oil"
  ],
  "instructions": "Boil pasta and prepare the sauce..."
}

🧩 API Responsibility

The backend separates the application's main responsibilities:

Express Server
     │
     ├── Recipe Routes
     │       │
     │       └── MongoDB
     │
     ├── AI Chat Route
     │       │
     │       ├── Recipe Context
     │       ├── Gemini
     │       ├── Groq
     │       └── Rule Fallback
     │
     └── Health Route

This keeps recipe operations and AI operations behind the backend rather than exposing provider credentials directly to the browser.

📁 Project Structure

recipe-sharing/
│
├── backend/
│   ├── server.js
│   │   └── Express application
│   │       Routes + MongoDB connection
│   │
│   ├── aiChat.js
│   │   └── AI chat logic
│   │       Gemini → Groq → Rule fallback
│   │
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── index.html
    │   └── Recipe browsing page
    │
    ├── submit.html
    │   └── Recipe submission page
    │
    ├── view.html
    │   └── Recipe details + AI assistant
    │
    ├── script.js
    │   └── Frontend logic + API communication
    │
    └── style.css
        └── Application styling

.env contains secrets and should never be committed to the repository.

🛠️ Tech Stack

Backend

Node.js

Express.js

Mongoose

Database

MongoDB

MongoDB Atlas

AI

Google Gemini API

Groq API

Rule-based fallback

Frontend

HTML5

CSS3

JavaScript

Deployment

Render — Backend

Vercel — Frontend

MongoDB Atlas — Database

🚀 Getting Started

Prerequisites

Install or create:

Node.js v18 or higher

MongoDB Atlas account or local MongoDB

Gemini API key

Groq API key

1️⃣ Clone the Repository

git clone https://github.com/Avnish-kumar-Singh/recipe-sharing.git
cd recipe-sharing

Replace the repository URL with the current repository URL if the project is hosted under a different repository.

2️⃣ Install Backend Dependencies

cd backend
npm install

3️⃣ Configure Environment Variables

Create:

backend/.env

Add:

MONGO_URI=your_mongodb_connection_string

PORT=5000

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.6-flash

GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b

Environment variable overview

Variable

Purpose

MONGO_URI

MongoDB connection string

PORT

Backend port

GEMINI_API_KEY

Gemini authentication

GEMINI_MODEL

Gemini model

GROQ_API_KEY

Groq authentication

GROQ_MODEL

Groq model

4️⃣ Start the Backend

npm start

The backend runs on:

http://localhost:5000

Verify the server:

http://localhost:5000/health

5️⃣ Start the Frontend

Open the frontend using a static server or development server.

For example, from the project root:

frontend/index.html

Then browse the application.

💬 Using the AI Assistant

Step 1 — Choose a recipe

Browse Recipes
      ↓
Select Recipe

Step 2 — Read the recipe

The selected recipe provides:

Title

Ingredients

Instructions

Image

Step 3 — Ask the assistant

Example:

Can I replace olive oil with butter?

Step 4 — AI pipeline executes

Gemini
  ↓
if failure
  ↓
Groq
  ↓
if failure
  ↓
Rule-based fallback

Step 5 — Receive response

The response is displayed in the recipe chat interface.

☁️ Deployment Architecture

The project is designed for a simple cloud deployment:

                 User
                  │
                  ▼
             Vercel
          Frontend / UI
                  │
                  │ API Requests
                  ▼
              Render
         Node.js + Express
           Backend API
          │           │
          │           │
          ▼           ▼
      MongoDB       AI APIs
       Atlas      ┌────┴────┐
                  │         │
               Gemini     Groq

Deployment responsibilities

Service

Role

Vercel

Hosts frontend

Render

Runs Express backend

MongoDB Atlas

Persistent recipe storage

Gemini

Primary AI provider

Groq

Secondary AI provider

🌐 Production Configuration

For the deployed backend, environment variables should be configured through the hosting provider's environment-variable settings rather than committed to source control.

For example:

Render
 │
 ├── MONGO_URI
 ├── GEMINI_API_KEY
 ├── GEMINI_MODEL
 ├── GROQ_API_KEY
 └── GROQ_MODEL

The frontend communicates with the deployed backend API.

🔐 Security

The project follows an important rule:

AI provider credentials belong on the backend, never in frontend JavaScript.

Never expose:

GEMINI_API_KEY
GROQ_API_KEY
MONGO_URI

inside client-side code.

Recommended repository protection

.env
node_modules/

should be excluded through .gitignore.

Never commit API keys, database credentials, or other secrets to Git.

🧯 Failure Handling

The application is designed around graceful degradation.

Scenario 1 — Gemini works

Request
  ↓
Gemini
  ↓
Response

Scenario 2 — Gemini is rate-limited

Request
  ↓
Gemini ❌
  ↓
Groq
  ↓
Response

Scenario 3 — Both AI providers fail

Request
  ↓
Gemini ❌
  ↓
Groq ❌
  ↓
Rule-based fallback
  ↓
Response

Scenario 4 — MongoDB is temporarily unavailable

Application
    ↓
MongoDB ❌
    ↓
In-memory fallback
    ↓
Application continues

This architecture demonstrates how external dependencies can be isolated behind fallback mechanisms.

🧠 Engineering Concepts Demonstrated

This project demonstrates several backend and modern application-development concepts.

Backend Development

REST API design

Express.js routing

Middleware

Request handling

Error handling

Environment-based configuration

Database

MongoDB

MongoDB Atlas

Mongoose

Persistent document storage

Database failure fallback

AI Engineering

LLM API integration

Context-aware prompting

Multi-provider architecture

Provider fallback

Rate-limit resilience

Rule-based degradation

Frontend

HTML

CSS

JavaScript

REST API integration

Dynamic recipe rendering

Conversational UI

Deployment

Cloud database

Backend deployment

Frontend deployment

Environment variables

Production configuration

🔬 AI Reliability Design

The project treats AI providers as external dependencies rather than assuming they are always available.

                  ┌────────────────┐
                  │   AI Request   │
                  └───────┬────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   Gemini    │
                   └──────┬──────┘
                          │
                  ┌───────┴───────┐
                  │               │
               Success           Error
                  │               │
                  ▼               ▼
               Return           Groq
                               ┌───┴───┐
                               │       │
                            Success   Error
                               │       │
                               ▼       ▼
                            Return   Rule
                                     Based
                                      │
                                      ▼
                                    Return

This is especially useful when using free-tier AI providers where quotas and rate limits can be reached unexpectedly.

📊 Example User Journey

┌──────────────────────┐
│  Open Recipe App     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Browse Recipes       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Select Recipe        │
└──────────┬───────────┘
           │
           ├───────────────┐
           ▼               ▼
┌─────────────────┐   ┌──────────────────┐
│ Read Ingredients│   │ Read Instructions │
└────────┬────────┘   └─────────┬────────┘
         │                      │
         └──────────┬───────────┘
                    ▼
          ┌────────────────────┐
          │ Ask AI Assistant   │
          └─────────┬──────────┘
                    │
                    ▼
             Gemini / Groq
                    │
                    ▼
             AI Response
                    │
                    ▼
            Continue Cooking

🎯 Example Questions

The assistant can be used for questions such as:

🥕 Ingredient substitutions

What can I use instead of onions?

🌶️ Taste modifications

How can I make this less spicy?

🍳 Cooking technique

Should I fry the vegetables before adding the sauce?

🥗 Dietary changes

How can I make this vegetarian?

⏱️ Cooking guidance

Which step should I complete first?

The quality and scope of responses depend on the recipe context and the configured AI providers.

📋 API Quick Reference

GET  /recipes

Returns the available recipes.

POST /recipes

Creates a new recipe.

POST /api/chat

Sends a question to the recipe AI assistant.

GET /health

Checks backend availability.

🧪 Testing the Application

Health Check

After starting the backend:

GET http://localhost:5000/health

Expected behavior:

Backend is running

Recipe API

Fetch recipes:

curl http://localhost:5000/recipes

Create a recipe:

curl -X POST http://localhost:5000/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Vegetable Pasta",
    "ingredients": ["Pasta", "Tomato", "Garlic"],
    "instructions": "Cook pasta and prepare the sauce."
  }'

AI Chat

The frontend can send recipe-context questions to:

POST /api/chat

The backend then handles provider selection and fallback logic.

📦 Project Highlights

🍳 Recipe Sharing
🤖 Context-Aware AI Assistant
🔄 Gemini → Groq → Rule-Based Fallback
🛡️ AI Provider Failure Handling
💾 MongoDB Persistent Storage
🧯 In-Memory Database Fallback
🌐 REST API
☁️ Vercel + Render Deployment
🔐 Environment-Based Secret Management
📱 Responsive Recipe Experience

🚀 Future Improvements

Possible future extensions include:

User authentication and authorization

User profiles

Recipe likes and favorites

Ratings and reviews

Recipe search and filtering

Ingredient-based recipe recommendations

AI-generated shopping lists

AI-generated meal plans

Nutrition estimation

Image upload storage using cloud object storage

Recipe categories

Pagination

Redis caching

API rate limiting

Automated tests

CI/CD pipeline

Structured application logging

AI conversation history

Streaming AI responses

💡 Why This Project Is Different

A basic recipe-sharing application mainly demonstrates CRUD operations.

This project goes further by combining:

CRUD Application
       +
MongoDB
       +
REST APIs
       +
LLM Integration
       +
Recipe-Specific Context
       +
Multi-Provider AI Fallback
       +
Database Failure Fallback
       +
Cloud Deployment

The result is a project that demonstrates both full-stack development and practical AI/backend reliability engineering.

🧠 Key Engineering Takeaways

1. Don't depend on a single external AI provider

A provider outage or quota limit should not automatically make the entire feature unusable.

2. Keep AI credentials server-side

The browser should communicate with your backend rather than directly exposing provider API keys.

3. Ground AI responses in application data

Providing the selected recipe as context helps the assistant answer questions about the actual recipe being viewed.

4. Design for graceful degradation

When external dependencies fail, a controlled fallback can provide a better experience than an application-wide error.

5. Separate persistent and temporary storage concerns

MongoDB provides persistent storage, while the in-memory fallback is used as a temporary resilience mechanism.

📄 License

This project is open source and available under the MIT License.

See the project's LICENSE file for the complete license text.

<p align="center">
  <b>🍳 Built with JavaScript, Node.js, MongoDB and LLMs</b>
  <br>
  <sub>From sharing recipes to building resilient AI-powered applications.</sub>
</p>
