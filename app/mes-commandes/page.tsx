import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { formatPoints } from "@/lib/format";
import { redirect } from "next/navigation";

export const metadata = { title: "Mes commandes — StreetGame" };
export const revalidate = 0;

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  sent: "Envoyée",
  received: "Reçue",
  cancelled: "Annulée",
};

export default async function MesCommandesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion?next=/mes-commandes");

  const { data: ordersRaw } = await supabase
    .from("reward_orders")
    .select("id, points_spent, status, created_at, rewards(title, icon)")
    .order("created_at", { ascending: false });

  const orders = ordersRaw as unknown as Array<{
    id: string;
    points_spent: number;
    status: string;
    created_at: string;
    rewards: { title: string; icon: string } | null;
  }> | null;

  return (
    <div>
      <section style={{ padding: "56px 24px 24px", maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: "clamp(28px,4.5vw,38px)", marginBottom: 24 }}>Mes commandes</h1>

        {!orders || orders.length === 0 ? (
          <p className="text-muted">Aucune commande pour l'instant — direction la page Récompenses.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {orders.map((o) => (
              <div key={o.id} className="card elev-sm" style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <i className={`ph-fill ${o.rewards?.icon ?? "ph-gift"}`} style={{ fontSize: 22, color: "var(--color-accent-300)" }} />
                <div style={{ flex: 1 }}>
                  <div className="card-title" style={{ fontSize: 15 }}>
                    {o.rewards?.title ?? "Récompense"}
                  </div>
                  <div className="card-meta">
                    {formatPoints(o.points_spent)} pts · {new Date(o.created_at).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <span className="tag tag-outline">{STATUS_LABEL[o.status] ?? o.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
