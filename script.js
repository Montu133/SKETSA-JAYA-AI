// Konfigurasi API dari RequimeBoost
const API_CONFIG = {
    chatgpt35: {
        name: "ChatGPT 3.5",
        endpoint: "https://requimeboost.id/api/chatgpt-3-5",
        apiKey: "sk-tiugp5pc3iuhxu",
        method: "POST",
        status: "active"
    },
    chatgpt4: {
        name: "ChatGPT 4",
        endpoint: "https://requimeboost.id/api/chatgpt-4",
        apiKey: "sk-tiugp5pc3iuhxu",
        method: "POST",
        status: "active"
    },
    wotty: {
        name: "Wotty AI",
        endpoint: "https://requimeboost.id/api/wotty-ai",
        apiKey: "sk-tiugp5pc3iuhxu",
        method: "POST",
        status: "active"
    },
    blackbox: {
        name: "BlackBox",
        endpoint: "https://requimeboost.id/api/blackbox",
        apiKey: "sk-tiugp5pc3iuhxu",
        method: "POST",
        status: "active"
    },
    metaai: {
        name: "Meta AI",
        endpoint: "https://requimeboost.id/api/meta-ai",
        apiKey: "sk-tiugp5pc3iuhxu",
        method: "POST",
        status: "active"
    }
};

// Variabel global
let currentApi = 'chatgpt35';
let isWaitingForResponse = false;
let conversationHistory = {};

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi history percakapan untuk setiap API
    Object.keys(API_CONFIG).forEach(api => {
        conversationHistory[api] = [];
    });

    const chatHistory = document.getElementById('chatHistory');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const apiOptions = document.querySelectorAll('.api-option');
    
    // Pilih API
    apiOptions.forEach(option => {
        option.addEventListener('click', () => {
            const api = option.getAttribute('data-api');
            
            if (!option.classList.contains('disabled')) {
                apiOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                currentApi = api;
                
                addSystemMessage(`Menggunakan ${API_CONFIG[api].name} sebagai provider AI`);
            }
        });
    });
    
    // Kirim pesan
    sendButton.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendMessage();
    });
    
    // Pesan awal
    setTimeout(() => {
        addSystemMessage("Selamat datang di SKETSA JAYA AI! Pilih provider AI di panel kiri untuk memulai.");
    }, 1000);
});

// Fungsi untuk menangani pengiriman pesan
async function handleSendMessage() {
    if (isWaitingForResponse) return;
    
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) {
        addSystemMessage("Silakan ketik pesan terlebih dahulu");
        return;
    }
    
    // Tampilkan pesan pengguna
    addMessage(message, 'user');
    messageInput.value = '';
    
    // Tampilkan indikator mengetik
    showTypingIndicator();
    isWaitingForResponse = true;
    document.getElementById('sendButton').disabled = true;
    
    try {
        // Dapatkan response dari API
        const response = await getAIResponse(message);
        addMessage(response, 'ai');
    } catch (error) {
        console.error("Error:", error);
        addSystemMessage("Maaf, terjadi kesalahan. Silakan coba lagi nanti.");
    } finally {
        // Sembunyikan indikator mengetik
        hideTypingIndicator();
        isWaitingForResponse = false;
        document.getElementById('sendButton').disabled = false;
    }
}

// Fungsi untuk mendapatkan respons dari AI
async function getAIResponse(message) {
    const config = API_CONFIG[currentApi];
    
    // Tambahkan timeout untuk menghindari hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Timeout 15 detik
    
    try {
        const response = await fetch(config.endpoint, {
            method: config.method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                question: message,
                api_key: config.apiKey
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal mendapatkan respons");
        }
        
        const data = await response.json();
        return data.response || data.answer || "Maaf, tidak bisa memproses permintaan Anda";
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error("Waktu permintaan habis. Silakan coba lagi.");
        }
        throw error;
    }
}

// Fungsi untuk menambahkan pesan ke chat
function addMessage(content, sender) {
    const chatHistory = document.getElementById('chatHistory');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
    
    const senderName = sender === 'user' ? 'Anda' : 'SKETSA JAYA AI';
    const senderIcon = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
    
    messageElement.innerHTML = `
        <div class="message-header">
            <i class="${senderIcon}"></i>
            <span>${senderName}</span>
        </div>
        <div class="message-content">${formatMessageContent(content)}</div>
    `;
    
    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Fungsi untuk menambahkan pesan sistem
function addSystemMessage(content) {
    const chatHistory = document.getElementById('chatHistory');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add('ai-message');
    
    messageElement.innerHTML = `
        <div class="message-header">
            <i class="fas fa-info-circle"></i>
            <span>Sistem</span>
        </div>
        <div class="message-content">${content}</div>
    `;
    
    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Fungsi untuk memformat konten pesan
function formatMessageContent(content) {
    // Ganti tanda kutip kode
    let formatted = content.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    // Ganti baris baru dengan <br>
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
}

// Fungsi untuk menampilkan indikator mengetik
function showTypingIndicator() {
    const chatHistory = document.getElementById('chatHistory');
    const typingElement = document.createElement('div');
    typingElement.classList.add('typing-indicator');
    typingElement.id = 'typingIndicator';
    
    typingElement.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <span>SKETSA JAYA AI sedang mengetik...</span>
    `;
    
    chatHistory.appendChild(typingElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Fungsi untuk menyembunyikan indikator mengetik
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}
