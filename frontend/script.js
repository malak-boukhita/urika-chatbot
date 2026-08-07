"use strict";

const currentScript = document.currentScript;
const API_URL = currentScript?.dataset.apiUrl?.replace(/\/$/, "") || "http://127.0.0.1:8000";

const chatbotToggler = document.querySelector("#chatbot-toggler");
const chatbotPopup = document.querySelector("#chatbot-popup");
const closeChatbotButton = document.querySelector("#close-chatbot");
const heroButton = document.querySelector("#hero-button");
const chatBody = document.querySelector("#chat-body");
const chatForm = document.querySelector("#chat-form");
const messageInput = document.querySelector("#message-input");
const sendButton = document.querySelector("#send-message");
const suggestionButtons = document.querySelectorAll("[data-question]");

let requestInProgress = false;

function openChatbot() {
  document.body.classList.add("show-chatbot");
  chatbotToggler.setAttribute("aria-expanded", "true");
  chatbotPopup.setAttribute("aria-hidden", "false");
  chatbotToggler.setAttribute("aria-label", "Fermer le chatbot");

  window.setTimeout(() => {
    messageInput.focus();
  }, 220);
}

function closeChatbot() {
  document.body.classList.remove("show-chatbot");
  chatbotToggler.setAttribute("aria-expanded", "false");
  chatbotPopup.setAttribute("aria-hidden", "true");
  chatbotToggler.setAttribute("aria-label", "Ouvrir le chatbot");
}

function scrollToLastMessage() {
  chatBody.scrollTop = chatBody.scrollHeight;
}

function createMessageElement(type) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");

  if (type === "user") {
    messageElement.classList.add("user-message");
  } else {
    messageElement.classList.add("bot-message");

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";

    const robotIcon = document.createElement("i");
    robotIcon.className = "fa-solid fa-robot";

    avatar.appendChild(robotIcon);
    messageElement.appendChild(avatar);

    if (type === "error") {
      messageElement.classList.add("error-message");
    }
  }

  return messageElement;
}

function appendSources(contentElement, sources) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return;
  }

  const sourcesElement = document.createElement("div");
  sourcesElement.className = "message-sources";

  sources.forEach((source) => {
    if (!source?.url || !source?.title) {
      return;
    }

    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = `En savoir plus : ${source.title}`;

    sourcesElement.appendChild(link);
  });

  contentElement.appendChild(sourcesElement);
}

function addMessage(text, type = "bot", sources = []) {
  const messageElement = createMessageElement(type);

  const contentElement = document.createElement("div");
  contentElement.className = "message-content";

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  contentElement.appendChild(paragraph);
  appendSources(contentElement, sources);
  messageElement.appendChild(contentElement);
  chatBody.appendChild(messageElement);

  scrollToLastMessage();

  return messageElement;
}

function addThinkingIndicator() {
  const messageElement = createMessageElement("bot");

  const contentElement = document.createElement("div");
  contentElement.className = "message-content";

  const indicator = document.createElement("div");
  indicator.className = "thinking-indicator";

  for (let index = 0; index < 3; index += 1) {
    const dot = document.createElement("span");
    indicator.appendChild(dot);
  }

  contentElement.appendChild(indicator);
  messageElement.appendChild(contentElement);
  chatBody.appendChild(messageElement);

  scrollToLastMessage();

  return messageElement;
}

function resizeInput() {
  messageInput.style.height = "auto";
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 110)}px`;
}

function setLoadingState(isLoading) {
  requestInProgress = isLoading;
  messageInput.disabled = isLoading;
  sendButton.disabled = isLoading;

  const icon = sendButton.querySelector("i");
  if (icon) {
    icon.className = isLoading ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-paper-plane";
  }
}

async function requestAnswer(message) {
  const controller = new AbortController();

  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, 20000);

  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function sendMessage(rawMessage) {
  if (requestInProgress) {
    return;
  }

  const message = rawMessage.trim();

  if (!message) {
    messageInput.focus();
    return;
  }

  addMessage(message, "user");

  messageInput.value = "";
  resizeInput();
  setLoadingState(true);

  const thinkingMessage = addThinkingIndicator();

  try {
    const result = await requestAnswer(message);

    thinkingMessage.remove();

    const answer = typeof result.answer === "string"
      ? result.answer
      : "Le serveur a retourné une réponse invalide.";

    addMessage(answer, "bot", Array.isArray(result.sources) ? result.sources : []);
  } catch (error) {
    console.error(error);

    thinkingMessage.remove();

    const message = error.name === "AbortError"
      ? "La réponse prend trop de temps. Veuillez réessayer."
      : ("L’assistant est temporairement indisponible. " + "Vérifiez que le serveur FastAPI est démarré.");

    addMessage(message, "error");
  } finally {
    setLoadingState(false);
    messageInput.focus();
  }
}

chatbotToggler.addEventListener("click", () => {
  const isOpen = document.body.classList.contains("show-chatbot");

  if (isOpen) {
    closeChatbot();
  } else {
    openChatbot();
  }
});

heroButton.addEventListener("click", openChatbot);

closeChatbotButton.addEventListener("click", closeChatbot);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("show-chatbot")) {
    closeChatbot();
  }
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await sendMessage(messageInput.value);
});

messageInput.addEventListener("keydown", async (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    await sendMessage(messageInput.value);
  }
});

messageInput.addEventListener("input", resizeInput);

suggestionButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const question = button.dataset.question;

    openChatbot();

    if (question) {
      await sendMessage(question);
    }
  });
});