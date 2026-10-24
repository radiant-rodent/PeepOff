// Copy to stats-config.js and fill in your Supabase project values.
// Both of these are public: they ship to the browser in the deployed site.
// Access is controlled by the row-level security policies in supabase/schema.sql,
// not by keeping these hidden.
window.PEEPOFF_SUPABASE_URL = "https://your-project.supabase.co";
window.PEEPOFF_SUPABASE_ANON_KEY = "your-publishable-or-anon-key";

// Local testing: when running on localhost, 127.0.0.1, or file://,
// stats.js automatically enters safe Local Test Mode (live DB protected,
// votes stay in local storage). Set to true to force test mode anywhere.
// Set ?live=1 in URL if you ever need to connect to live Supabase from localhost.
// window.PEEPOFF_LOCAL_TEST = true;
