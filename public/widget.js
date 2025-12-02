;(() => {
  var config = window.AutoSupportConfig || {}
  var workspaceKey = config.workspaceKey
  var primaryColor = config.primaryColor || "#0066FF"

  if (!workspaceKey) {
    console.error("AutoSupport: Missing workspaceKey in configuration")
    return
  }

  // Generate visitor ID
  var visitorId = localStorage.getItem("autosupport_visitor_id")
  if (!visitorId) {
    visitorId = "visitor_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now()
    localStorage.setItem("autosupport_visitor_id", visitorId)
  }

  var conversationId = sessionStorage.getItem("autosupport_conversation_id")
  var isOpen = false
  var messages = []
  var container, chatWindow, messagesDiv, inputEl

  // Get API base URL from script src
  var scripts = document.getElementsByTagName("script")
  var currentScript = scripts[scripts.length - 1]
  var apiBase = currentScript.src.replace("/widget.js", "")

  // Create styles
  var styles = document.createElement("style")
  styles.textContent = `
    #autosupport-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #autosupport-button {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.2s;
    }
    #autosupport-button:hover {
      transform: scale(1.05);
    }
    #autosupport-chat {
      display: none;
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.15);
      overflow: hidden;
      flex-direction: column;
    }
    #autosupport-chat.open {
      display: flex;
    }
    #autosupport-header {
      padding: 16px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    #autosupport-header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
    }
    #autosupport-close {
      background: transparent;
      border: none;
      color: white;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
    }
    #autosupport-close:hover {
      background: rgba(255,255,255,0.2);
    }
    #autosupport-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }
    .autosupport-message {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }
    .autosupport-message.user {
      flex-direction: row-reverse;
    }
    .autosupport-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .autosupport-bubble {
      max-width: 75%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.4;
    }
    .autosupport-message.user .autosupport-bubble {
      color: white;
    }
    .autosupport-message.assistant .autosupport-bubble {
      background: #f3f4f6;
      color: #1f2937;
    }
    #autosupport-input-area {
      padding: 12px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
    }
    #autosupport-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }
    #autosupport-input:focus {
      border-color: ${primaryColor};
    }
    #autosupport-send {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    #autosupport-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .autosupport-typing {
      display: flex;
      gap: 4px;
      padding: 10px 14px;
    }
    .autosupport-typing span {
      width: 8px;
      height: 8px;
      background: #9ca3af;
      border-radius: 50%;
      animation: typing 1s infinite;
    }
    .autosupport-typing span:nth-child(2) { animation-delay: 0.2s; }
    .autosupport-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typing {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
    #autosupport-human-btn {
      text-align: center;
      padding: 8px;
      border-top: 1px solid #e5e7eb;
    }
    #autosupport-human-btn button {
      background: none;
      border: none;
      color: ${primaryColor};
      cursor: pointer;
      font-size: 13px;
      text-decoration: underline;
    }
  `
  document.head.appendChild(styles)

  // Create container
  container = document.createElement("div")
  container.id = "autosupport-widget"

  // Create toggle button
  var button = document.createElement("button")
  button.id = "autosupport-button"
  button.style.backgroundColor = primaryColor
  button.innerHTML =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'
  button.onclick = toggleChat

  // Create chat window
  chatWindow = document.createElement("div")
  chatWindow.id = "autosupport-chat"

  var header = document.createElement("div")
  header.id = "autosupport-header"
  header.style.backgroundColor = primaryColor
  header.innerHTML =
    '<div id="autosupport-header-title"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg><span>Support</span></div>'

  var closeBtn = document.createElement("button")
  closeBtn.id = "autosupport-close"
  closeBtn.innerHTML =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>'
  closeBtn.onclick = toggleChat
  header.appendChild(closeBtn)

  messagesDiv = document.createElement("div")
  messagesDiv.id = "autosupport-messages"

  var humanDiv = document.createElement("div")
  humanDiv.id = "autosupport-human-btn"
  humanDiv.innerHTML = '<button onclick="window.AutoSupport.requestHuman()">Talk to a human</button>'

  var inputArea = document.createElement("div")
  inputArea.id = "autosupport-input-area"

  inputEl = document.createElement("input")
  inputEl.id = "autosupport-input"
  inputEl.placeholder = "Type a message..."
  inputEl.onkeypress = (e) => {
    if (e.key === "Enter") sendMessage()
  }

  var sendBtn = document.createElement("button")
  sendBtn.id = "autosupport-send"
  sendBtn.style.backgroundColor = primaryColor
  sendBtn.innerHTML =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>'
  sendBtn.onclick = sendMessage

  inputArea.appendChild(inputEl)
  inputArea.appendChild(sendBtn)

  chatWindow.appendChild(header)
  chatWindow.appendChild(messagesDiv)
  chatWindow.appendChild(humanDiv)
  chatWindow.appendChild(inputArea)

  container.appendChild(chatWindow)
  container.appendChild(button)
  document.body.appendChild(container)

  // Load greeting
  loadHistory()

  function toggleChat() {
    isOpen = !isOpen
    chatWindow.classList.toggle("open", isOpen)
    button.style.display = isOpen ? "none" : "flex"
    if (isOpen) inputEl.focus()
  }

  function addMessage(role, content) {
    messages.push({ role: role, content: content })
    renderMessages()
  }

  function renderMessages() {
    messagesDiv.innerHTML = ""
    messages.forEach((msg) => {
      var div = document.createElement("div")
      div.className = "autosupport-message " + msg.role

      var avatar = document.createElement("div")
      avatar.className = "autosupport-avatar"
      avatar.style.backgroundColor = msg.role === "user" ? "#e5e7eb" : primaryColor + "20"
      avatar.innerHTML =
        msg.role === "user"
          ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
          : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' +
            primaryColor +
            '" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'

      var bubble = document.createElement("div")
      bubble.className = "autosupport-bubble"
      if (msg.role === "user") {
        bubble.style.backgroundColor = primaryColor
      }
      bubble.textContent = msg.content

      div.appendChild(avatar)
      div.appendChild(bubble)
      messagesDiv.appendChild(div)
    })
    messagesDiv.scrollTop = messagesDiv.scrollHeight
  }

  function showTyping() {
    var div = document.createElement("div")
    div.className = "autosupport-message assistant"
    div.id = "typing-indicator"
    div.innerHTML =
      '<div class="autosupport-avatar" style="background-color:' +
      primaryColor +
      '20"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' +
      primaryColor +
      '" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></div><div class="autosupport-typing"><span></span><span></span><span></span></div>'
    messagesDiv.appendChild(div)
    messagesDiv.scrollTop = messagesDiv.scrollHeight
  }

  function hideTyping() {
    var typing = document.getElementById("typing-indicator")
    if (typing) typing.remove()
  }

  function sendMessage() {
    var text = inputEl.value.trim()
    if (!text) return

    inputEl.value = ""
    addMessage("user", text)
    showTyping()

    fetch(apiBase + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceKey: workspaceKey,
        message: text,
        conversationId: conversationId,
        visitorId: visitorId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        hideTyping()
        if (data.conversationId) {
          conversationId = data.conversationId
          sessionStorage.setItem("autosupport_conversation_id", conversationId)
        }
        addMessage("assistant", data.message || data.error || "Sorry, something went wrong.")
      })
      .catch(() => {
        hideTyping()
        addMessage("assistant", "Sorry, I could not connect to the server.")
      })
  }

  function loadHistory() {
    fetch(apiBase + "/api/chat/history?workspaceKey=" + workspaceKey + "&visitorId=" + visitorId)
      .then((res) => res.json())
      .then((data) => {
        if (data.conversationId) {
          conversationId = data.conversationId
          sessionStorage.setItem("autosupport_conversation_id", conversationId)
        }
        if (data.messages && data.messages.length > 0) {
          messages = data.messages.map((m) => ({ role: m.role, content: m.content }))
          renderMessages()
        } else {
          // Show greeting
          fetch(apiBase + "/api/widget/config?workspaceKey=" + workspaceKey)
            .then((res) => res.json())
            .then((config) => {
              if (config.greeting) {
                addMessage("assistant", config.greeting)
              }
              if (config.botName) {
                var title = document.querySelector("#autosupport-header-title span")
                if (title) title.textContent = config.botName
              }
            })
        }
      })
      .catch(() => {
        addMessage("assistant", "Hello! How can I help you today?")
      })
  }

  // Expose API
  window.AutoSupport = {
    open: () => {
      if (!isOpen) toggleChat()
    },
    close: () => {
      if (isOpen) toggleChat()
    },
    requestHuman: () => {
      addMessage("user", "I would like to speak with a human agent.")
      showTyping()
      fetch(apiBase + "/api/tickets/widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceKey: workspaceKey,
          conversationId: conversationId,
          visitorId: visitorId,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          hideTyping()
          if (data.success) {
            addMessage(
              "assistant",
              "I have escalated your request to our support team. A human agent will get back to you soon. Thank you for your patience!",
            )
          } else {
            addMessage("assistant", data.error || "Sorry, I could not create a support ticket at this time.")
          }
        })
        .catch(() => {
          hideTyping()
          addMessage("assistant", "Sorry, I could not connect to the server.")
        })
    },
  }
})()
