// AI Travel Agent Logic
const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const plusBtn = document.getElementById('plus-btn');
const optionsMenu = document.getElementById('options-menu');
const typingIndicator = document.getElementById('typing-indicator');
const chatBubble = document.getElementById('chat-bubble');
const agentContainer = document.getElementById('agent-container');
const closeChat = document.getElementById('close-chat');

// Toggle Chatbox
chatBubble.addEventListener('click', () => {
  agentContainer.classList.toggle('hidden');
});

closeChat.addEventListener('click', () => {
  agentContainer.classList.add('hidden');
});

let currentFlow = null;
let flowStep = 0;
let flowData = {};

const FLOWS = {
  local: [
    "Great! Let's plan a local trip. First, where are you currently located?",
    "Nice! And what is your destination?",
    "Got it. How many days are you planning to stay?",
    "Perfect! I'm calculating the details for you..."
  ],
  foreign: [
    "Exciting! For a foreign trip, what is your current city and country?",
    "Which country are you dreaming of visiting?",
    "How many days will your international adventure be?",
    "Thinking... I'll get the international travel details for you shortly."
  ]
};

// Toggle plus menu
plusBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  optionsMenu.classList.toggle('active');
});

document.addEventListener('click', () => {
  optionsMenu.classList.remove('active');
});

function appendMessage(role, text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message message--${role}`;
  msgDiv.innerHTML = text.replace(/\n/g, '<br>');
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping(show) {
  typingIndicator.style.display = show ? 'flex' : 'none';
  chatBox.scrollTop = chatBox.scrollHeight;
}

window.startFlow = (type) => {
  currentFlow = type;
  flowStep = 0;
  flowData = {};
  optionsMenu.classList.remove('active');

  appendMessage('ai', FLOWS[type][flowStep]);
};

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  appendMessage('user', text);
  chatInput.value = '';

  if (currentFlow) {
    handleFlow(text);
  } else {
    // Normal chat
    await getAIResponse(text);
  }
});

async function handleFlow(userInput) {
  const questions = FLOWS[currentFlow];

  // Store data
  if (flowStep === 0) flowData.currentLocation = userInput;
  else if (flowStep === 1) flowData.destination = userInput;
  else if (flowStep === 2) flowData.duration = userInput;

  flowStep++;

  if (flowStep < questions.length) {
    showTyping(true);
    setTimeout(() => {
      showTyping(false);
      appendMessage('ai', questions[flowStep]);
      if (flowStep === 3) {
        // Trigger final AI generation
        generateTripPlan();
      }
    }, 1000);
  }
}

async function generateTripPlan() {
  const prompt = `Plan a ${currentFlow} trip from ${flowData.currentLocation} to ${flowData.destination} for ${flowData.duration} days. 
  Provide specific data on: 
  1. Top places to visit.
  2. Estimated total cost in the local currency of the destination or user's preferred currency.
  3. Top 5 things to do.
  Format it nicely with headers and bullet points.`;

  showTyping(true);
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    showTyping(false);

    if (data.error) {
      appendMessage('ai', "Sorry, I encountered an error: " + data.error);
    } else {
      appendMessage('ai', data.content);
    }
  } catch (err) {
    showTyping(false);
    appendMessage('ai', "Cloud connection failed. Please try again.");
  }

  // Reset flow
  currentFlow = null;
  flowStep = 0;
}

async function getAIResponse(userInput) {
  showTyping(true);
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: userInput }]
      })
    });
    const data = await response.json();
    showTyping(false);

    if (data.error) {
      appendMessage('ai', "Error: " + data.error);
    } else {
      appendMessage('ai', data.content);
    }
  } catch (err) {
    showTyping(false);
    appendMessage('ai', "Connection error.");
  }
}
