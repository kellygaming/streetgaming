import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = { title: "Mes soumissions — StreetGame" };
export const revalidate = 0;

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente de validation",
  approved: "Validée",
  rejected: "Refusée",
};

export default async function MesDefisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion?next=/mes-defis");

  const { data: submissionsRaw } = await supabase
    .from("challenge_submissions")
    .select("id, status, points_awarded, moderator_note, created_at, challenges(title, games(name))")
    .order("created_at", { ascending: false });

  const submissions = submissionsRaw as unknown as Array<{
    id: string;
    status: string;
    points_awarded: number | null;
    moderator_note: string | null;
    created_at: string;
    challenges: { title: string; games: { name: string } | null } | null;
  }> | null;

  return (
    <div>
      <section style={{ padding: "56px 24px 24px", maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: "clamp(28px,4.5vw,38px)", marginBottom: 24 }}>Mes soumissions</h1>

        {!submissions || submissions.length === 0 ? (
          <p className="text-muted">Aucune preuve envoyée pour l'instant — direction la page Défis.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {submissions.map((s) => (
              <div key={s.id} className="card elev-sm">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="tag tag-accent-2">{s.challenges?.games?.name}</span>
                  <span className="tag tag-outline">{STATUS_LABEL[s.status] ?? s.status}</span>
                </div>
                <div className="card-title" style={{ fontSize: 15 }}>
                  {s.challenges?.title}
                </div>
                {s.status === "approved" && s.points_awarded ? (
                  <p className="card-body">+{s.points_awarded} points crédités</p>
                ) : null}
                {s.status === "rejected" && s.moderator_note ? (
                  <p className="card-body">Motif : {s.moderator_note}</p>
                ) : null}
                <div className="card-meta">{new Date(s.created_at).toLocaleDateString("fr-FR")}</div>
              </div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
