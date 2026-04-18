/**
 * Administrative script to create users via Supabase Admin API
 * 
 * Usage:
 *   npx tsx scripts/create-user.ts <email>
 * 
 * Example:
 *   npx tsx scripts/create-user.ts iriasnandinho@gmail.com
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load .env.local file
config({ path: ".env.local" });

async function createUser(email: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing environment variables:");
    console.error("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
    console.error("   SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗");
    console.error("\n💡 Make sure .env.local exists with these variables");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log(`\n🔧 Creating user: ${email}`);

  try {
    // Create user with Admin API (this bypasses email confirmation)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        created_via: "admin_script",
      },
    });

    if (error) {
      console.error("\n❌ Error creating user:", error.message);
      process.exit(1);
    }

    console.log("\n✅ User created successfully!");
    console.log(`   User ID: ${data.user.id}`);
    console.log(`   Email: ${data.user.email}`);
    console.log(`   Email confirmed: ${data.user.email_confirmed_at ? "Yes" : "No"}`);
    console.log(`\n💡 User can now login via magic link`);
  } catch (err) {
    console.error("\n❌ Unexpected error:", err);
    process.exit(1);
  }
}

// Main execution
const email = process.argv[2];

if (!email) {
  console.error("\n❌ Usage: npx tsx scripts/create-user.ts <email>");
  console.error("   Example: npx tsx scripts/create-user.ts user@example.com\n");
  process.exit(1);
}

if (!email.includes("@")) {
  console.error("\n❌ Invalid email format\n");
  process.exit(1);
}

createUser(email);
