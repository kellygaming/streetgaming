"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/defis", label: "Défis" },
  { href: "/recompenses", label: "Récompenses" },
  { href: "/communautes", label: "Communautés" },
  { href: "/#classement", label: "Classement" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="sg-nav flex gap-5 mr-auto">
      {LINKS.map((link) => {
        const isCurrent =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href.split("#")[0]) && link.href !== "/#classement";
        return (
          <Link key={link.href} href={link.href} aria-current={isCurrent ? "page" : undefined}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
