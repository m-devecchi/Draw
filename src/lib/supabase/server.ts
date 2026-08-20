import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client Supabase per Server Component e Route Handler,
// autenticato con la sessione dell'utente (rispetta la RLS).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chiamato da un Server Component: i cookie vengono
            // aggiornati dal middleware, si può ignorare.
          }
        },
      },
    }
  );
}
