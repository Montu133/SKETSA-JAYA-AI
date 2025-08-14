// Konfigurasi API dari RequimeBoost
const API_CONFIG = {
    wotty: {
        name: "Wotty AI",
        endpoint: "https://requimeboost.id/api/wotty-ai",
        apiKey: "sk-tiugp5pc3iuhxu",
        method: "POST",
        status: "checking"
    },
    chatgpt3: {
        name: "ChatGPT 3",
        endpoint: "https://requimeboost.id/api/chatgpt-3",
        apiKey: "sk-tiugp5pc3iuhxu",
        method: "POST",
        status: "checking"
    },
    chatgpt35: {
        name: "ChatGPT 3.5",
        endpoint: "https://requimeboost.id/api/chatgpt-3-5",
        apiKey: "sk-tiugp5pc3iuhxu",
        method: "POST",
        status: "checking"
    },
    chatgpt4: {
        name: "ChatGPT 4",
        endpoint: "https://requimeboost.id/api/chatgpt-4",
        apiKey: "sk-tiugp5pc3iuhxu",
        method: "POST",
        status: "checking"
    },
    blackbox: {
        name: "BlackBox",
        endpoint: "https://requimeboost.id/api/blackbox",
        apiKey: "sk-tiugp5pc3iuhxu",
        method: "POST",
        status: "checking"
    },
    metaai: {
        name: "Meta AI",
        endpoint: "https://requimeboost.id/api/meta-ai",
        apiKey: "sk-tiugp5pc3iuhxu",
        method: "POST",
        status: "checking"
    }
};

// Variabel global
let currentApi = 'chatgpt35'; // Default ke ChatGPT 3.5
let isWaitingForResponse = false;
let conversationHistory = {};

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', function() {
    const chatHistory = document.getElementById('chatHistory');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const apiOptions = document.querySelectorAll('.api-option');
    
    // Inisialisasi history percakapan untuk setiap API
    Object.keys(API_CONFIG).forEach(api => {
        conversationHistory[api] = [];
    });

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
    
    // Periksa ketersediaan API
    checkAllApiAvailability();
    
    // Kirim pesan
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // Pesan awal
    setTimeout(() => {
        addSystemMessage("Selamat datang di SKETSA JAYA AI! Pilih provider AI di panel kiri untuk memulai.");
    }, 1000);
});

// Fungsi untuk memeriksa semua API
async function checkAllApiAvailability() {
    const apis = Object.keys(API_CONFIG);
    
    for (const api of apis) {
        await checkSingleApiAvailability(api);
    }
    
    // Set default API yang tersedia
    setFirstAvailableApi();
}

// Fungsi untuk memeriksa satu API
async function checkSingleApiAvailability(api) {
    const config = API_CONFIG[api];
    const optionElement = document.querySelector(`.api-option[data-api="${api}"]`);
    
    if (!optionElement) return;
    
    const indicator = optionElement.querySelector('.status-indicator');
    const description = optionElement.querySelector('p');
    
    // Skip jika API key kosong
    if (!config.apiKey) {
        config.status = "invalid";
        updateApiStatusUI(api, "invalid", "API Key tidak valid");
        return;
    }
    
    // Tandai sedang memeriksa
    config.status = "checking";
    updateApiStatusUI(api, "checking", "Memeriksa...");
    
    try {
        const isAvailable = await testRequimeBoostConnection(config);
        
        if (isAvailable) {
            config.status = "active";
            updateApiStatusUI(api, "active", "Siap digunakan");
        } else {
            config.status = "inactive";
            updateApiStatusUI(api, "inactive", "Tidak merespon");
        }
    } catch (error) {
        console.error(`Error testing ${api} API:`, error);
        config.status = "error";
        updateApiStatusUI(api, "error", "Koneksi gagal");
    }
}

// Fungsi untuk menguji koneksi ke RequimeBoost
async function testRequimeBoostConnection(config) {
    try {
        const testPayload = {
            question: "Test connection",
            api_key: config.apiKey
        };
        
        const response = await fetch(config.endpoint, {
            method: config.method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testPayload)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error(`${config.name} API error:`, errorData);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error(`${config.name} connection test failed:`, error);
        return false;
    }
}

// Fungsi untuk mengirim pesan
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    if (!message || isWaitingForResponse) return;
    
    addMessage(message, 'user');
    messageInput.value = '';
    
    showTypingIndicator();
    isWaitingForResponse = true;
    document.getElementById('sendButton').disabled = true;
    
    try {
        const config = API_CONFIG[currentApi];
        const response = await getRequimeBoostResponse(message, config);
        addMessage(response, 'ai');
    } catch (error) {
        console.error("Error:", error);
        addSystemMessage("Maaf, terjadi kesalahan. Silakan coba lagi.");
    } finally {
        hideTypingIndicator();
        isWaitingForResponse = false;
        document.getElementById('sendButton').disabled = false;
    }
}

// Fungsi untuk mendapatkan respons dari RequimeBoost
async function getRequimeBoostResponse(message, config) {
    const payload = {
        question: message,
        api_key: config.apiKey
    };
    
    // Tambahkan instructions untuk API premium jika ada
    if (currentApi.includes('instructions')) {
        payload.instructions = "Jawab dengan jelas dan detail dalam Bahasa Indonesia";
    }
    
    const response = await fetch(config.endpoint, {
        method: config.method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal mendapatkan respons");
    }
    
    const data = await response.json();
    return data.response || data.answer || "Maaf, tidak bisa memproses permintaan Anda";
}

// ... (fungsi-fungsi helper lainnya tetap sama seperti sebelumnya)
