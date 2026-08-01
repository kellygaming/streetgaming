import Footer from "@/components/Footer";
import DefisList, { type ChallengeWithGame } from "@/components/DefisList";
import { createClient } from "@/lib/supabase/server";
import type { Game } from "@/lib/types";
import type { SubmissionStatus } from "@/components/ChallengeRow";

export const metadata = { title: "Défis — StreetGame" };
export const revalidate = 0;

export default async function DefisPage() {
  const supabase = await createClient();

  const [{ data: games }, { data: challenges }, userRes] = await Promise.all([
    supabase.from("games").select("id, slug, name, category, icon, cover_url, is_active").order("sort_order"),
    supabase
      .from("challenges")
      .select("*, games(id, slug, name, category, icon, cover_url, is_active)")
      .order("created_at"),
    supabase.auth.getUser(),
  ]);

  const user = userRes.data.user;

  let submissionStatusByChallenge: Record<string, SubmissionStatus> = {};
  if (user) {
    const { data: submissions } = await supabase
      .from("challenge_submissions")
      .select("challenge_id, status, created_at")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false });

    for (const s of submissions ?? []) {
      if (!(s.challenge_id in submissionStatusByChallenge)) {
        submissionStatusByChallenge[s.challenge_id] = s.status as SubmissionStatus;
      }
    }
  }

  return (
    <div>
      <section style={{ padding: "56px 24px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <div className="tag tag-outline" style={{ width: "fit-content", marginBottom: 16 }}>
          ⚡ Nouveaux défis chaque semaine
        </div>
        <h1 style={{ fontSize: "clamp(28px,4.5vw,42px)", marginBottom: 10 }}>Relève un défi, débloque ta récompense</h1>
        <p className="text-muted" style={{ maxWidth: 620, fontSize: 16, marginBottom: 28 }}>
          Remplis les conditions dans la partie, envoie ta preuve (capture ou replay), et récupère tes points StreetGame.
        </p>

        <DefisList
          challenges={(challenges ?? []) as ChallengeWithGame[]}
          games={(games ?? []) as Game[]}
          submissionStatusByChallenge={submissionStatusByChallenge}
          isAuthenticated={Boolean(user)}
        />
      </section>

      <Footer />
    </div>
  );
}
