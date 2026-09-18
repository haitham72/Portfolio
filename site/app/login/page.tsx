"use client";

import { createClient } from "@/lib/supabase/browserClient";
import { SITE } from "@/lib/placeholders";

export default function LoginPage() {
  async function signIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-6 text-center">
      <span className="text-ui-sm uppercase tracking-tight text-meta">{SITE.brand}</span>
      <h1 className="text-sub-3 tracking-tight text-text-hi">Private preview</h1>
      <p className="max-w-sm text-body text-text-alt">
        This portfolio isn&apos;t public yet. Sign in with Google to request access.
      </p>
      <button onClick={signIn} className="btn-pill btn-pill--solid">
        Sign in with Google
      </button>
    </main>
  );
}
