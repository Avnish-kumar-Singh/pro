// Auto-detects environment: uses localhost while developing,
// and your deployed Render URL once you fill it in below.
const backendURL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000'
  : 'https://recipe-sharing-backend-h6wn.onrender.com';

let currentRecipe = null;
let chatHistory = [];
let chatLoading = false;
let standaloneChatLoading = false;

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('leaving');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3200);
}

function renderIngredientTags(ingredients, max = 4) {
  const trimmed = ingredients.map(i => i.trim()).filter(Boolean);
  const visible = trimmed.slice(0, max);
  const extra = trimmed.length - max;

  let html = visible.map(ing => `<span class="ingredient-tag">${escapeHtml(ing)}</span>`).join('');
  if (extra > 0) {
    html += `<span class="ingredient-tag more">+${extra} more</span>`;
  }
  return html;
}

function renderAllIngredientTags(ingredients) {
  return ingredients
    .map(i => i.trim())
    .filter(Boolean)
    .map(ing => `<span class="ingredient-tag">${escapeHtml(ing)}</span>`)
    .join('');
}

function buildRecipeCard(recipe, index) {
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  return `
    <article class="recipe-card" data-index="${index}" tabindex="0" role="button" aria-label="View ${escapeHtml(recipe.title)}">
      ${recipe.image
        ? `<div class="recipe-card-image"><img src="${escapeHtml(recipe.image)}" alt="${escapeHtml(recipe.title)}" loading="lazy"></div>`
        : `<div class="recipe-card-image recipe-card-placeholder"></div>`
      }
      <div class="recipe-card-body">
        <h2>${escapeHtml(recipe.title)}</h2>
        <div class="ingredient-tags">${renderIngredientTags(ingredients)}</div>
        <p class="recipe-instructions">${escapeHtml(recipe.instructions)}</p>
        <button class="view-recipe-btn" type="button">
          View Full Recipe
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </article>
  `;
}

function openModal(recipe) {
  const modal = document.getElementById('recipeModal');
  if (!modal) return;

  currentRecipe = recipe;
  chatHistory = [];

  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const modalImage = document.getElementById('modalImage');
  const modalTitle = document.getElementById('modalTitle');
  const modalIngredients = document.getElementById('modalIngredients');
  const modalInstructions = document.getElementById('modalInstructions');

  if (recipe.image) {
    modalImage.className = 'modal-image';
    modalImage.innerHTML = `<img src="${escapeHtml(recipe.image)}" alt="${escapeHtml(recipe.title)}">`;
  } else {
    modalImage.className = 'modal-image placeholder';
    modalImage.innerHTML = '';
  }

  modalTitle.textContent = recipe.title;
  modalIngredients.innerHTML = renderAllIngredientTags(ingredients);
  modalInstructions.textContent = recipe.instructions;

  resetChatUI(recipe.title);

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function resetChatUI(recipeTitle) {
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const aiBadge = document.getElementById('aiBadge');

  if (!chatMessages) return;

  chatMessages.innerHTML = `
    <div class="chat-welcome">
      Hi! I'm Chef AI. Ask me anything about <strong>${escapeHtml(recipeTitle)}</strong> —
      cooking steps, substitutions, timing, or tips!
    </div>
  `;

  if (chatInput) chatInput.value = '';
  if (aiBadge) {
    aiBadge.textContent = 'AI Ready';
    aiBadge.classList.remove('fallback');
  }
}

function formatAiText(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>');
}

function appendChatMessage(role, text) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;

  const welcome = chatMessages.querySelector('.chat-welcome');
  if (welcome) welcome.remove();

  const msg = document.createElement('div');
  msg.className = `chat-message ${role}`;

  const avatar = role === 'ai' ? '👨‍🍳' : '🧑';
  const bubbleContent = role === 'ai' ? formatAiText(text) : escapeHtml(text);

  msg.innerHTML = `
    <span class="chat-message-avatar" aria-hidden="true">${avatar}</span>
    <div class="chat-bubble">${bubbleContent}</div>
  `;

  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return null;

  const welcome = chatMessages.querySelector('.chat-welcome');
  if (welcome) welcome.remove();

  const typing = document.createElement('div');
  typing.className = 'chat-message ai';
  typing.id = 'chatTyping';
  typing.innerHTML = `
    <span class="chat-message-avatar" aria-hidden="true">👨‍🍳</span>
    <div class="chat-bubble typing">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return typing;
}

function removeTypingIndicator() {
  document.getElementById('chatTyping')?.remove();
}

async function sendChatMessage(message) {
  if (!message.trim() || !currentRecipe || chatLoading) return;

  chatLoading = true;
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const aiBadge = document.getElementById('aiBadge');

  appendChatMessage('user', message.trim());
  if (chatInput) chatInput.value = '';
  if (chatSendBtn) chatSendBtn.disabled = true;

  showTypingIndicator();

  try {
    const res = await fetch(`${backendURL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message.trim(),
        recipe: {
          title: currentRecipe.title,
          ingredients: currentRecipe.ingredients,
          instructions: currentRecipe.instructions
        }
      })
    });

    removeTypingIndicator();

    if (!res.ok) {
      throw new Error('Failed to get response');
    }

    const data = await res.json();
    appendChatMessage('ai', data.reply);

    if (aiBadge) {
      if (data.source === 'gemini') {
        aiBadge.textContent = 'Gemini AI';
        aiBadge.classList.remove('fallback');
      } else if (data.source === 'groq') {
        aiBadge.textContent = 'Groq AI';
        aiBadge.classList.remove('fallback');
      } else {
        aiBadge.textContent = 'Smart Assist';
        aiBadge.classList.add('fallback');
      }
    }
  } catch {
    removeTypingIndicator();
    appendChatMessage('ai', 'Sorry, I couldn\'t connect to the assistant. Make sure the backend server is running.');
  }

  chatLoading = false;
  if (chatSendBtn) chatSendBtn.disabled = false;
  chatInput?.focus();
}

function setupChat() {
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const suggestions = document.getElementById('chatSuggestions');

  chatForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    sendChatMessage(chatInput.value);
  });

  suggestions?.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      sendChatMessage(chip.dataset.prompt);
    });
  });
}

function closeModal() {
  const modal = document.getElementById('recipeModal');
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = '';
}

function openAiChatModal() {
  const modal = document.getElementById('aiChatModal');
  if (!modal) return;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  
  // Reset chat and focus input
  const chatMessages = document.getElementById('standaloneChatMessages');
  if (chatMessages) {
    chatMessages.innerHTML = `
      <div class="chat-welcome">
        Hi! I'm Chef AI. Ask me anything about cooking, recipes, ingredients, techniques, or dietary tips!
      </div>
    `;
  }
  
  const standaloneInput = document.getElementById('standaloneInput');
  if (standaloneInput) setTimeout(() => standaloneInput.focus(), 100);
}

function closeAiChatModal() {
  const modal = document.getElementById('aiChatModal');
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = '';
}

async function sendStandaloneChatMessage(message) {
  if (!message.trim() || standaloneChatLoading) return;

  standaloneChatLoading = true;
  const chatInput = document.getElementById('standaloneInput');
  const chatSendBtn = document.getElementById('standaloneSendBtn');
  const aiBadge = document.getElementById('aiStandaloneBadge');

  appendStandaloneChatMessage('user', message.trim());
  if (chatInput) chatInput.value = '';
  if (chatSendBtn) chatSendBtn.disabled = true;

  showStandaloneTypingIndicator();

  try {
    // Send general cooking question without recipe context
    const res = await fetch(`${backendURL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message.trim(),
        recipe: {
          title: 'General Cooking Question',
          ingredients: [],
          instructions: 'General cooking advice requested'
        }
      })
    });

    removeStandaloneTypingIndicator();

    if (!res.ok) {
      throw new Error('Failed to get response');
    }

    const data = await res.json();
    appendStandaloneChatMessage('ai', data.reply);

    if (aiBadge) {
      if (data.source === 'gemini') {
        aiBadge.textContent = 'Gemini AI';
        aiBadge.classList.remove('fallback');
      } else if (data.source === 'groq') {
        aiBadge.textContent = 'Groq AI';
        aiBadge.classList.remove('fallback');
      } else {
        aiBadge.textContent = 'Smart Assist';
        aiBadge.classList.add('fallback');
      }
    }
  } catch {
    removeStandaloneTypingIndicator();
    appendStandaloneChatMessage('ai', 'Sorry, I couldn\'t connect to Chef AI. Please make sure the backend server is running.');
  }

  standaloneChatLoading = false;
  if (chatSendBtn) chatSendBtn.disabled = false;
  if (chatInput) chatInput.focus();
}

function appendStandaloneChatMessage(role, text) {
  const chatMessages = document.getElementById('standaloneChatMessages');
  if (!chatMessages) return;

  const welcome = chatMessages.querySelector('.chat-welcome');
  if (welcome) welcome.remove();

  const msg = document.createElement('div');
  msg.className = `chat-message ${role}`;

  const avatar = role === 'ai' ? '👨‍🍳' : '🧑';
  const bubbleContent = role === 'ai' ? formatAiText(text) : escapeHtml(text);

  msg.innerHTML = `
    <span class="chat-message-avatar" aria-hidden="true">${avatar}</span>
    <div class="chat-bubble">${bubbleContent}</div>
  `;

  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showStandaloneTypingIndicator() {
  const chatMessages = document.getElementById('standaloneChatMessages');
  if (!chatMessages) return;

  const typing = document.createElement('div');
  typing.className = 'chat-message ai';
  typing.id = 'standaloneTyping';
  typing.innerHTML = `
    <span class="chat-message-avatar" aria-hidden="true">👨‍🍳</span>
    <div class="chat-bubble typing">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeStandaloneTypingIndicator() {
  document.getElementById('standaloneTyping')?.remove();
}

function setupStandaloneChat() {
  const chatForm = document.getElementById('standaloneForm');
  const chatInput = document.getElementById('standaloneInput');
  const suggestions = document.getElementById('standaloneChatSuggestions');

  chatForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    sendStandaloneChatMessage(chatInput.value);
  });

  suggestions?.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      sendStandaloneChatMessage(chip.dataset.prompt);
    });
  });
}

function setupAiChatButton() {
  const aiChatBtn = document.getElementById('aiChatBtn');
  const aiChatClose = document.getElementById('aiChatClose');
  const aiChatModal = document.getElementById('aiChatModal');

  if (aiChatBtn) {
    aiChatBtn.addEventListener('click', openAiChatModal);
  }

  if (aiChatClose) {
    aiChatClose.addEventListener('click', closeAiChatModal);
  }

  if (aiChatModal) {
    aiChatModal.addEventListener('click', (e) => {
      if (e.target === aiChatModal) closeAiChatModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && aiChatModal && !aiChatModal.hidden) {
      closeAiChatModal();
    }
  });
}

function updateStats(recipes) {
  const statsBar = document.getElementById('statsBar');
  const searchBar = document.getElementById('searchBar');
  if (!statsBar) return;

  const totalIngredients = recipes.reduce((sum, r) => {
    const ings = Array.isArray(r.ingredients) ? r.ingredients : [];
    return sum + ings.length;
  }, 0);

  document.getElementById('statRecipes').textContent = recipes.length;
  document.getElementById('statIngredients').textContent = totalIngredients;
  statsBar.hidden = false;
  if (searchBar) searchBar.hidden = false;
}

function setupScrollTop() {
  const btn = document.getElementById('scrollTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 300);
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function setupModal() {
  const modal = document.getElementById('recipeModal');
  const closeBtn = document.getElementById('modalClose');
  if (!modal) return;

  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });
}

function setupImagePreview() {
  const imageInput = document.getElementById('image');
  const preview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  if (!imageInput || !preview) return;

  imageInput.addEventListener('input', () => {
    const url = imageInput.value.trim();
    if (!url) {
      preview.hidden = true;
      return;
    }

    previewImg.onload = () => { preview.hidden = false; };
    previewImg.onerror = () => { preview.hidden = true; };
    previewImg.src = url;
  });
}

if (document.getElementById('recipeForm')) {
  setupImagePreview();

  document.getElementById('recipeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');

    btn.classList.add('loading');
    btnText.hidden = true;
    btnLoader.hidden = false;

    const title = document.getElementById('title').value;
    const ingredients = document.getElementById('ingredients').value.split(',');
    const instructions = document.getElementById('instructions').value;
    const image = document.getElementById('image').value;

    try {
      await fetch(`${backendURL}/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, ingredients, instructions, image })
      });

      showToast('Recipe submitted successfully!');
      setTimeout(() => { window.location.href = 'index.html?submitted=true'; }, 1200);
    } catch {
      showToast('Failed to submit recipe. Please try again.', 'error');
      btn.classList.remove('loading');
      btnText.hidden = false;
      btnLoader.hidden = true;
    }
  });
}

if (document.getElementById('recipes')) {
  let allRecipes = [];

  setupScrollTop();
  setupModal();
  setupChat();
  setupStandaloneChat();
  setupAiChatButton();

  function renderRecipes(recipes) {
    const recipeDiv = document.getElementById('recipes');

    if (!recipes.length) {
      recipeDiv.innerHTML = `
        <div class="no-results">
          <h3>No matching recipes</h3>
          <p>Try a different search term or <a href="submit.html">add a new recipe</a>.</p>
        </div>
      `;
      return;
    }

    recipeDiv.innerHTML = recipes.map((recipe, i) => buildRecipeCard(recipe, i)).join('');

    recipeDiv.querySelectorAll('.recipe-card').forEach(card => {
      const index = parseInt(card.dataset.index, 10);
      const open = () => openModal(recipes[index]);

      card.addEventListener('click', (e) => {
        if (e.target.closest('.view-recipe-btn')) return;
        open();
      });

      card.querySelector('.view-recipe-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        open();
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });
  }

  function filterRecipes(query) {
    const q = query.toLowerCase().trim();
    if (!q) return allRecipes;

    return allRecipes.filter(recipe => {
      const title = recipe.title.toLowerCase();
      const ingredients = (Array.isArray(recipe.ingredients) ? recipe.ingredients : [])
        .join(' ').toLowerCase();
      return title.includes(q) || ingredients.includes(q);
    });
  }

  async function fetchRecipes() {
    const recipeDiv = document.getElementById('recipes');
    const searchInput = document.getElementById('searchInput');

    try {
      const res = await fetch(`${backendURL}/recipes`);
      allRecipes = await res.json();

      if (!allRecipes.length) {
        recipeDiv.innerHTML = `
          <div class="empty-state">
            <h3>No recipes yet!</h3>
            <p>Be the first to share a delicious dish with the community.</p>
            <p><a href="submit.html">Submit a recipe &rarr;</a></p>
          </div>
        `;
        return;
      }

      updateStats(allRecipes);
      renderRecipes(allRecipes);

      searchInput?.addEventListener('input', () => {
        renderRecipes(filterRecipes(searchInput.value));
      });

      const params = new URLSearchParams(window.location.search);
      if (params.get('submitted') === 'true') {
        showToast('Your recipe has been added to the collection!');
        window.history.replaceState({}, '', 'index.html');
      }
    } catch {
      recipeDiv.innerHTML = `
        <div class="empty-state">
          <h3>Could not load recipes</h3>
          <p>Make sure the backend server is running on port 5000.</p>
        </div>
      `;
    }
  }

  fetchRecipes();

}
