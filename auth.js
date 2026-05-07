// --- CONFIGURATION ---
// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_PUBLIC_KEY';

// Replace this with your n8n Webhook URL (Production URL recommended)
const N8N_WEBHOOK_URL = 'https://YOUR_N8N_INSTANCE/webhook/admin-auth-log';

// --- INITIALIZATION ---
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- ELEMENTS ---
const loginCard = document.getElementById('login-card');
const adminCard = document.getElementById('admin-card');
const statusMsg = document.getElementById('status-msg');
const userEmailDisplay = document.getElementById('user-email-display');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');

// --- EVENT LISTENERS ---
loginBtn.addEventListener('click', handleLogin);
logoutBtn.addEventListener('click', handleLogout);

// --- FUNCTIONS ---

/**
 * Handles the login process using Supabase Auth
 */
async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        showMessage(error.message, 'error');
        setLoading(false);
    } else {
        showMessage('Login successful!', 'success');
        updateUI(data.user);
        
        // Trigger n8n Workflow
        sendToN8N('LOGIN_SUCCESS', data.user.email);
    }
}

/**
 * Handles the logout process
 */
async function handleLogout() {
    const email = userEmailDisplay.innerText;
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
        showMessage('Logout failed', 'error');
    } else {
        updateUI(null);
        // Trigger n8n Workflow
        sendToN8N('LOGOUT_SUCCESS', email);
    }
}

/**
 * Updates the visibility of the login vs dashboard view
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
 * Sends authentication details to n8n Webhook
 */
async function sendToN8N(event, email) {
    try {
        await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event: event,
                admin_email: email,
                timestamp: new Date().toISOString(),
                user_agent: navigator.userAgent
            })
        });
        console.log(`n8n logged: ${event}`);
    } catch (err) {
        console.error('Failed to notify n8n:', err);
    }
}

function showMessage(msg, type) {
    statusMsg.innerText = msg;
    statusMsg.style.color = type === 'error' ? 'var(--danger)' : 'var(--success)';
}

function setLoading(isLoading) {
    loginBtn.innerText = isLoading ? 'Authenticating...' : 'Sign In';
    loginBtn.disabled = isLoading;
}
