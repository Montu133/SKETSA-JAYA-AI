// Konfigurasi AP
const API_CONFIG = {
    gemini: {
        name: "Gemini AI",
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        apiKey: "AIzaSyDIn1BYaxQIhkJ5Yp6BQSinWXkVK_YN3wc",
        model: "gemini-pro"
    },
    chatgpt1: {
        name: "ChatGPT API 1",
        endpoint: "https://api.openai.com/v1/chat/completions",
        apiKey: "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",
        model: "gpt-4-turbo"
    },
    chatgpt2: {
        name: "ChatGPT API 2",
        endpoint: "https://api.openai.com/v1/chat/completions",
        apiKey: "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",
        model: "gpt-3.5-turbo"
    }
};

// Variabel global
let currentApi = 'gemini';
let isWaitingForResponse = false;
let conversationHistory = {
    gemini: [],
    chatgpt1: [],
    chatgpt2: []
};

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', function() {
    const chatHistory = document.getElementById('chatHistory');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const apiOptions = document.querySelectorAll('.api-option');
    
    // Pilih API
    apiOptions.forEach(option => {
        option.addEventListener('click', () => {
            const api = option.getAttribute('data-api');
            
            // Skip jika disabled
            if (option.classList.contains('disabled')) return;
            
            // Update selection
            apiOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            currentApi = api;
            
            // Tambahkan notifikasi ke chat
            addSystemMessage(`Menggunakan API: ${API_CONFIG[api].name}`);
        });
    });
    
    // Nonaktifkan API yang tidak tersedia
    checkApiAvailability();
    
    // Kirim pesan saat tombol diklik atau enter ditekan
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Pesan awal
    setTimeout(() => {
        addSystemMessage("Selamat datang di SKETSA JAYA AI! Saya siap membantu Anda dengan berbagai pertanyaan atau tugas. Silakan pilih provider AI yang diinginkan dan mulai percakapan.");
    }, 1000);
});

// Fungsi untuk mengecek ketersediaan API
async function checkApiAvailability() {
    const options = document.querySelectorAll('.api-option');
    
    for (const option of options) {
        const api = option.getAttribute('data-api');
        const config = API_CONFIG[api];
        const indicator = option.querySelector('.status-indicator');
        
        // Skip jika sudah disabled
        if (option.classList.contains('disabled')) continue;
        
        // Cek ketersediaan API key
        if (!config.apiKey) {
            option.classList.add('disabled');
            indicator.style.backgroundColor = 'var(--error)';
            option.querySelector('p').textContent = 'API Key tidak tersedia';
            continue;
        }
        
        // Tandai sedang memeriksa
        indicator.style.backgroundColor = 'var(--warning)';
        
        try {
            // Lakukan ping ke API untuk memeriksa konektivitas
            let isAvailable = false;
            
            if (api === 'gemini') {
                isAvailable = await testGeminiConnection(config);
            } else {
                isAvailable = await testChatGptConnection(config);
            }
            
            if (isAvailable) {
                indicator.style.backgroundColor = 'var(--success)';
            } else {
                indicator.style.backgroundColor = 'var(--error)';
                option.classList.add('disabled');
                option.querySelector('p').textContent = 'API tidak merespon';
            }
        } catch (error) {
            console.error(`Error testing ${api} API:`, error);
            indicator.style.backgroundColor = 'var(--error)';
            option.classList.add('disabled');
            option.querySelector('p').textContent = 'Koneksi gagal';
        }
    }
}

// Fungsi untuk menguji koneksi Gemini
async function testGeminiConnection(config) {
    const testPayload = {
        contents: [{
            parts: [{
                text: "Halo"
            }]
        }]
    };
    
    const response = await fetch(`${config.endpoint}?key=${config.apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
    });
    
    return response.ok;
}

// Fungsi untuk menguji koneksi ChatGPT
async function testChatGptConnection(config) {
    const testPayload = {
        model: config.model,
        messages: [{
            role: "user",
            content: "Halo"
        }],
        max_tokens: 5
    };
    
    const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(testPayload)
    });
    
    return response.ok;
}

// Fungsi untuk mengirim pesan
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    if (!message || isWaitingForResponse) return;
    
    // Tambahkan pesan pengguna ke chat
    addMessage(message, 'user');
    messageInput.value = '';
    
    // Tampilkan indikator mengetik
    showTypingIndicator();
    isWaitingForResponse = true;
    document.getElementById('sendButton').disabled = true;
    
    try {
        // Dapatkan respons dari API yang dipilih
        let response;
        const config = API_CONFIG[currentApi];
        
        if (currentApi === 'gemini') {
            response = await getGeminiResponse(message, config);
        } else {
            response = await getChatGptResponse(message, config);
        }
        
        // Tambahkan pesan AI ke chat
        addMessage(response, 'ai');
    } catch (error) {
        console.error("Error getting AI response:", error);
        addSystemMessage("Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.");
    } finally {
        // Sembunyikan indikator mengetik
        hideTypingIndicator();
        isWaitingForResponse = false;
        document.getElementById('sendButton').disabled = false;
    }
}

// Fungsi untuk mendapatkan respons dari Gemini
async function getGeminiResponse(message, config) {
    // Tambahkan ke riwayat percakapan
    conversationHistory.gemini.push({
        role: "user",
        parts: [{ text: message }]
    });
    
    // Batasi riwayat percakapan untuk menghindari token berlebihan
    if (conversationHistory.gemini.length > 10) {
        conversationHistory.gemini = conversationHistory.gemini.slice(-10);
    }
    
    const payload = {
        contents: conversationHistory.gemini,
        generationConfig: {
            temperature: 0.9,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
            stopSequences: []
        },
        safetySettings: [
            {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
        ]
    };
    
    const response = await fetch(`${config.endpoint}?key=${config.apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Simpan respons ke riwayat percakapan
    const aiResponse = data.candidates[0].content.parts[0].text;
    conversationHistory.gemini.push({
        role: "model",
        parts: [{ text: aiResponse }]
    });
    
    return aiResponse;
}

// Fungsi untuk mendapatkan respons dari ChatGPT
async function getChatGptResponse(message, config) {
    // Tambahkan ke riwayat percakapan
    conversationHistory[currentApi].push({
        role: "user",
        content: message
    });
    
    // Batasi riwayat percakapan untuk menghindari token berlebihan
    if (conversationHistory[currentApi].length > 10) {
        conversationHistory[currentApi] = conversationHistory[currentApi].slice(-10);
    }
    
    const payload = {
        model: config.model,
        messages: conversationHistory[currentApi],
        temperature: 0.7,
        max_tokens: 2000
    };
    
    const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        throw new Error(`ChatGPT API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Simpan respons ke riwayat percakapan
    const aiResponse = data.choices[0].message.content;
    conversationHistory[currentApi].push({
        role: "assistant",
        content: aiResponse
    });
    
    return aiResponse;
}

// Fungsi untuk menambahkan pesan ke chat
function addMessage(content, sender) {
    const chatHistory = document.getElementById('chatHistory');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
    
    const senderName = sender === 'user' ? 'Anda' : 'SKETSA JAYA AI';
    const senderIcon = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
    
    // Format konten untuk menangani kode dan baris baru
    const formattedContent = formatMessageContent(content);
    
    messageElement.innerHTML = `
        <div class="message-header">
            <i class="${senderIcon}"></i>
            <span>${senderName}</span>
        </div>
        <div class="message-content">${formattedContent}</div>
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
