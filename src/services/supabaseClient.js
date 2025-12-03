// src/services/testConnection.js (or wherever you initialize Supabase)

import { createClient } from '@supabase/supabase-js';

// Access the environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize the Supabase Client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- The Test Function ---
export async function testSupabaseConnection() {
  console.log("Attempting to connect to Supabase...");
  console.log("URL:", supabaseUrl); // Check if the URL is loading from .env

  try {
    // Attempt to fetch data from a table (e.g., 'questions' or a temporary 'test_table')
    const { data, error } = await supabase
      .from('questions')
      .select('id') // Select only a small field for speed
      .limit(1); // Only fetch one record

    if (error) {
      console.error("CONNECTION FAILED. Supabase Error:", error.message);
      return false;
    }

    if (data && data.length >= 0) {
      console.log("CONNECTION SUCCESSFUL!");
      console.log(`Successfully retrieved ${data.length} records.`);
      return true;
    }

  } catch (e) {
    console.error("CONNECTION FAILED. General Error:", e.message);
    return false;
  }
}