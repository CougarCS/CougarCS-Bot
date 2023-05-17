export const validateEnv = () => {
  if (!process.env.TOKEN) {
    console.warn("Missing Discord bot token.");
    return false;
  }

  if (!process.env.CLIENT_ID) {
    console.warn("Missing Creator ID.");
    return false;
  }

  if (!process.env.SUPABASE_URL) {
    console.warn("Missing Supabase URL.");
    return false;
  }

  if (!process.env.SUPABASE_KEY) {
    console.warn("Missing Supabase Key.");
    return false;
  }

  return true;
};
