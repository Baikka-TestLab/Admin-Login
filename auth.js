// --- CONFIGURATION ---
// Replace these with your actual details from the Supabase dashboard
const SUPABASE_URL = 'https://nwyysrqhtgxoizqquizb.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_PsNO8XElykjZgm1AAnCJ3Q_W2PvUoAt'; // The one starting with sb_publishable

// Replace this with your n8n Production Webhook URL
const N8N_WEBHOOK_URL = 'https://1524-747.n8nbysnbd.top/webhook/admin-auth';

// --- INITIALIZATION ---
// We use 'supabaseClient' to avoid name conflicts with the library itself
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- DOM ELEMENTS ---
const loginCard = document.getElementById('login-card');
const adminCard = document.getElementById('admin-card');
const statusMsg = document.getElementById('status-msg');
const userEmailDisplay = document.getElementById('user-email-display');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');

// --- EVENT LISTENERS ---
if (loginBtn) loginBtn.addEventListener('click', handleLogin);
if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

// --- FUNCTIONS ---

/**
 * Handles the login process
 */
async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showMessage('Please enter both email and password.', 'error');
        return;
    }

    setLoading(true);

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        showMessage(error.message, 'error');
        setLoading(false);
    } else {
        showMessage('Success! Redirecting...', 'success');
        updateUI(data.user);
        
        // Notify n8n
        sendToN8N('LOGIN', data.user.email);
    }
}

/**
 * Handles the logout process
 */
async function handleLogout() {
    const email = userEmailDisplay.innerText;
    
    const { error } = await supabaseClient.auth.signOut();
    
    if (error) {
        showMessage('Logout failed.', 'error');
    } else {
        updateUI(null);
        // Notify n8n
        sendToN8N('LOGOUT', email);
    }
}

/**
 * Updates the UI based on auth state
 */
function updateUI(user) {
    if (user) {
        loginCard.classList.add('hidden');
        adminCard.classList.remove('hidden');
        userEmailDisplay.innerText = user.email;
    } else {
        loginCard.classList.remove('hidden');
        adminCard.classList.add('hidden');
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        statusMsg.innerText = '';
    }
}

/**
 * Sends data to n8n Webhook
 */
async function sendToN8N(action, email) {
    try {
        await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: action,
                admin_email: email,
                date: new Date().toLocaleString(),
                platform: navigator.platform
            })
        });
        console.log(`n8n notified of ${action}`);
    } catch (err) {
        console.error('n8n notification failed:', err);
    }
}

function showMessage(msg, type) {
    statusMsg.innerText = msg;
    statusMsg.style.color = type === 'error' ? '#ef4444' : '#22c55e';
}

function setLoading(isLoading) {
    loginBtn.innerText = isLoading ? 'Verifying...' : 'Sign In';
    loginBtn.disabled = isLoading;
}
