import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Connexion — StreetGame" };

export default function ConnexionPage() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
