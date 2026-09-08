require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { getAiReply } = require('./aiChat');

console.log('📝 Environment loaded, GEMINI_API_KEY:', !!process.env.GEMINI_API_KEY, '| GROQ_API_KEY:', !!process.env.GROQ_API_KEY);

const app = express();

// Middleware
// CORS: allow your deployed frontend + local dev. Set FRONTEND_URL in
// Render's env vars once your Vercel URL is known (e.g. https://your-app.vercel.app)
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // No origin = curl/server-to-server, always allow.
    // If FRONTEND_URL isn't set yet, allow everything (dev-friendly default).
    if (!origin || !process.env.FRONTEND_URL || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

// MongoDB Connection
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/recipe-sharing';

mongoose
  .connect(mongoUri)
  .then(() => console.log('✓ MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    // Continue anyway - data will be stored in memory if DB is unavailable
  });

// Recipe Schema
const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    ingredients: {
      type: [String],
      default: [],
      set: (val) => (Array.isArray(val) ? val.map(v => v.trim()).filter(Boolean) : [])
    },
    instructions: {
      type: String,
      default: '',
      trim: true
    },
    image: {
      type: String,
      default: '',
      trim: true
    }
  },
  { timestamps: true }
);

const Recipe = mongoose.model('Recipe', recipeSchema);

// In-memory fallback for recipes if MongoDB is unavailable
let recipeStore = [];

// Routes

// GET /recipes - Retrieve all recipes
app.get('/recipes', async (req, res) => {
  try {
    const recipes = await Recipe.find().sort({ createdAt: -1 });
    res.json(recipes);
  } catch (err) {
    console.error('Error fetching recipes:', err.message);
    // Fallback to in-memory store
    res.json(recipeStore);
  }
});

// POST /recipes - Create a new recipe
app.post('/recipes', async (req, res) => {
  try {
    const { title, ingredients, instructions, image } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const ingredientArray = Array.isArray(ingredients)
      ? ingredients.map(i => typeof i === 'string' ? i.trim() : String(i)).filter(Boolean)
      : String(ingredients || '')
          .split(',')
          .map(i => i.trim())
          .filter(Boolean);

    const recipe = new Recipe({
      title: title.trim(),
      ingredients: ingredientArray,
      instructions: (instructions || '').toString().trim(),
      image: (image || '').toString().trim()
    });

    const savedRecipe = await recipe.save();
    recipeStore.unshift(savedRecipe.toObject()); // Keep in-memory store in sync
    
    res.status(201).json(savedRecipe);
  } catch (err) {
    console.error('Error creating recipe:', err.message);
    
    // Fallback: store in memory if MongoDB fails
    const fallbackRecipe = {
      _id: Date.now().toString(),
      title: req.body.title,
      ingredients: Array.isArray(req.body.ingredients) ? req.body.ingredients : req.body.ingredients.split(','),
      instructions: req.body.instructions,
      image: req.body.image,
      createdAt: new Date()
    };
    recipeStore.unshift(fallbackRecipe);
    res.status(201).json(fallbackRecipe);
  }
});

// POST /api/chat - AI chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, recipe } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!recipe || !recipe.title) {
      return res.status(400).json({ error: 'Recipe context is required' });
    }

    const aiResponse = await getAiReply(message, recipe);
    console.log('✓ Chat response generated:', aiResponse.source);
    res.json(aiResponse);
  } catch (err) {
    console.error('🔴 Chat error:', err.message);
    res.status(500).json({
      error: err.message || 'Failed to process chat message',
      reply: `Sorry, I encountered an error: ${err.message}. Please try again.`,
      source: 'error'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API endpoints:`);
  console.log(`   GET  /recipes - Fetch all recipes`);
  console.log(`   POST /recipes - Create a new recipe`);
  console.log(`   POST /api/chat - Chat with AI assistant`);
  console.log(`   GET  /health - Health check`);
});
