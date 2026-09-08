require('dotenv').config({ path: require('path').join(__dirname, '.env') });

function buildRecipeContext(recipe) {
  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.join(', ')
    : String(recipe.ingredients || '');

  return `Title: ${recipe.title || 'Untitled'}
Ingredients: ${ingredients}
Instructions: ${recipe.instructions || 'Not provided'}`;
}

function fallbackReply(message, recipe) {
  const q = message.toLowerCase();
  const title = recipe.title || 'this recipe';
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const instructions = recipe.instructions || '';

  if (q.includes('step') || q.includes('explain') || q.includes('how to')) {
    const steps = instructions
      .split(/[.\n]+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (steps.length > 1) {
      const numbered = steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
      return `Here's a step-by-step breakdown of **${title}**:\n\n${numbered}\n\nTip: Prep all ingredients (${ingredients.slice(0, 5).join(', ')}${ingredients.length > 5 ? ', ...' : ''}) before you start cooking!`;
    }
    return `**${title}** — Overview:\n\nIngredients: ${ingredients.join(', ')}\n\nInstructions: ${instructions}\n\nFor smarter AI answers, add a free Gemini API key to your backend .env file.`;
  }

  if (q.includes('substitut') || q.includes('replace') || q.includes('swap')) {
    return `For **${title}**, here are general substitution ideas based on your ingredients (${ingredients.join(', ')}):\n\n• Dairy → plant milk or yogurt alternatives\n• Eggs → flax egg (1 tbsp flax + 3 tbsp water)\n• All-purpose flour → whole wheat or gluten-free blend\n• Butter → olive oil or coconut oil\n\nTell me which specific ingredient you'd like to replace for a more tailored suggestion!\n\n_Add a GEMINI_API_KEY in backend/.env for full AI-powered substitution advice._`;
  }

  if (q.includes('time') || q.includes('long') || q.includes('minute') || q.includes('hour')) {
    return `**${title}** timing depends on your skill level and equipment. Based on the instructions, estimate:\n\n• Prep time: 10–20 minutes\n• Cook time: 20–40 minutes\n\nRead through the steps first: "${instructions.slice(0, 120)}${instructions.length > 120 ? '...' : ''}"\n\nFor precise timing estimates, connect a Gemini API key for AI analysis.`;
  }

  if (q.includes('healthy') || q.includes('calori') || q.includes('nutrition')) {
    return `**${title}** includes: ${ingredients.join(', ')}.\n\nGeneral notes:\n• Fresh whole ingredients are usually healthier than processed ones\n• Watch sodium in sauces and seasonings\n• Portion size matters for calorie control\n\nFor detailed nutritional analysis, add a GEMINI_API_KEY to enable full AI nutrition insights.`;
  }

  if (q.includes('tip') || q.includes('trick') || q.includes('better')) {
    return `Pro tips for **${title}**:\n\n1. Read all instructions before starting\n2. Mise en place — measure and chop everything first\n3. Taste and adjust seasoning as you go\n4. Let the dish rest briefly before serving\n\nIngredients to focus on: ${ingredients.slice(0, 4).join(', ')}.\n\n_Add GEMINI_API_KEY for personalized chef tips!_`;
  }

  return `I'd love to help with **${title}**!\n\n**Ingredients:** ${ingredients.join(', ')}\n\n**Instructions:** ${instructions}\n\nTry asking:\n• "Explain this step by step"\n• "What can I substitute?"\n• "How long will this take?"\n• "Give me cooking tips"\n\nFor full AI-powered answers, add your free Gemini API key to \`backend/.env\`:\n\`GEMINI_API_KEY=your_key_here\``;
}

async function callGemini(message, recipe, apiKey) {
  const model = process.env.GEMINI_MODEL || 'gemini-pro';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const systemPrompt = `You are Chef AI, a friendly and knowledgeable culinary assistant on the Flavor Fusion recipe sharing platform.
Answer questions about the recipe below. Be helpful, clear, and encouraging. Use bullet points or numbered steps when explaining cooking processes.
Keep responses concise (under 250 words unless the user asks for detail). Focus on practical home cooking advice.

RECIPE:
${buildRecipeContext(recipe)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${systemPrompt}\n\nUser question: ${message}` }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from AI');
  }

  return text.trim();
}

async function callGroq(message, recipe, apiKey) {
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const systemPrompt = `You are Chef AI, a friendly and knowledgeable culinary assistant on the Flavor Fusion recipe sharing platform.
Answer questions about the recipe below. Be helpful, clear, and encouraging. Use bullet points or numbered steps when explaining cooking processes.
Keep responses concise (under 250 words unless the user asks for detail). Focus on practical home cooking advice.

RECIPE:
${buildRecipeContext(recipe)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('No response from Groq');
  }

  return text.trim();
}

async function getAiReply(message, recipe) {
  if (!message?.trim()) {
    throw new Error('Message is required');
  }

  if (!recipe?.title) {
    throw new Error('Recipe context is required');
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  console.log('🔍 Gemini key present:', !!geminiKey, '| Groq key present:', !!groqKey);

  // 1. Try Gemini first
  if (geminiKey) {
    try {
      const reply = await callGemini(message.trim(), recipe, geminiKey);
      return { reply, source: 'gemini' };
    } catch (err) {
      console.error('🔴 Gemini API error:', err.message);
      // fall through to Groq
    }
  }

  // 2. Fall back to Groq if Gemini failed or has no key
  if (groqKey) {
    try {
      const reply = await callGroq(message.trim(), recipe, groqKey);
      return { reply, source: 'groq' };
    } catch (err) {
      console.error('🔴 Groq API error:', err.message);
      return {
        reply: fallbackReply(message, recipe) + `\n\n_(AI temporarily unavailable: ${err.message}. Showing basic assistant response.)_`,
        source: 'fallback'
      };
    }
  }

  // 3. Last resort — static fallback
  return { reply: fallbackReply(message, recipe), source: 'fallback' };
}

module.exports = { getAiReply };
