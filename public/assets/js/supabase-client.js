
// Initialize Supabase Client & Global Auth Helpers

function initSupabase() {
    if (typeof supabase === 'undefined') {
        setTimeout(initSupabase, 50);
        return;
    }

    const { createClient } = supabase;

    const supabaseUrl = window.SUPABASE_URL;
    const supabaseKey = window.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase keys not found in window object');
        return;
    }

    const sb = createClient(supabaseUrl, supabaseKey);
    window.sb = sb; // Expose client

    // Global Login Helper
    window.handleSupabaseLogin = async (email, password) => {
        return await sb.auth.signInWithPassword({ email, password });
    };

    // Global OAuth Helper
    window.handleSupabaseOAuth = async (provider) => {
        return await sb.auth.signInWithOAuth({
            provider: provider,
            options: { redirectTo: window.location.origin }
        });
    };

    // Global SignUp Helper
    window.handleSupabaseSignUp = async (email, password, options) => {
        return await sb.auth.signUp({ email, password, options });
    };
}

initSupabase();
