"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { Building2 } from "lucide-react";
import SidebarShell, { type NavSection } from "@/components/layout/SidebarShell";
import ModuleTopbar from "@/components/layout/ModuleTopbar";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRequireAdmin } from "@/lib/hooks/useRequireAdmin";

// Módulo administrativo interno (não é gated por ModuloPermitido — só isAdmin),
// no padrão do route group (admin). Fase 1: só a navegação de unidades.
const sections: NavSection[] = [
  {
    label: "Gestão Gerencial",
    items: [
      { href: "/gestao-gerencial", label: "Unidades", icon: Building2 },
    ],
  },
];

export default function GestaoGerencialLayout({ children }: { children: ReactNode }) {
  useAuth();
  useRequireAdmin();
  const pathname = usePathname();
  const titulo = pathname.startsWith("/gestao-gerencial/") ? "Escalas e Substituições" : "Gestão Gerencial";

  return (
    <div className="min-h-screen">
      <SidebarShell
        title="Gestão Gerencial"
        subtitle="Chabra"
        logoHref="/gestao-gerencial"
        sections={sections}
      />
      <div className="md:pl-[220px]">
        <ModuleTopbar title={titulo} />
        <main className="px-4 py-6 md:px-6" style={{ viewTransitionName: "content" }}>{children}</main>
      </div>
    </div>
  );
}
