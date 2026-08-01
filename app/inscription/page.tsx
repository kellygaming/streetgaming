import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Rejoindre StreetGame" };

export default function InscriptionPage() {
  return (
    <Suspense>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
