"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useUserStore } from "@/lib/store";
import { useConfiguracoes } from "@/lib/hooks/useConfiguracoes";
import { useVisaoGeralUnidades } from "@/lib/hooks/useVisaoGeralUnidades";
import { useHomeStats } from "@/lib/hooks/useHomeStats";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import VisaoGeralView, { type PendenciaItem } from "@/components/visao-geral/VisaoGeralView";

export default function VisaoGeralPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);
  const { data: configs } = useConfiguracoes();
  const { data, isLoading, error } = useVisaoGeralUnidades();
  const stats = useHomeStats();

  // Pendências = itens não finalizados por módulo (rascunho/em andamento).
  const pendencias: PendenciaItem[] = [
    { label: "Inspeções (Painel SST)", pendente: stats.painel?.pendente ?? 0, href: "/dashboard" },
    { label: "Conformidade", pendente: stats.conformidade?.pendente ?? 0, href: "/relatorio-conformidade" },
    { label: "Não Conformidade", pendente: stats.nao_conformidade?.pendente ?? 0, href: "/relatorio-nao-conformidade" },
    { label: "Psicossocial (DRPS)", pendente: stats.psicossocial?.pendente ?? 0, href: "/psicossocial" },
    { label: "Apreciação NR-12", pendente: stats.apreciacao_maquinas?.pendente ?? 0, href: "/apreciacao-maquinas" },
    { label: "AET", pendente: stats.aet?.pendente ?? 0, href: "/aet" },
    { label: "AEP", pendente: stats.aep?.pendente ?? 0, href: "/aep" },
  ]
    .filter((p) => p.pendente > 0)
    .sort((a, b) => b.pendente - a.pendente);

  // Cliente não acessa o painel interno — vai pro portal.
  useEffect(() => {
    if (user?.perfil === "Cliente") router.replace("/portal-cliente/inicio");
  }, [user?.perfil, router]);

  async function handleLogout() {
    try {
      await createSupabaseBrowserClient().auth.signOut();
    } catch {
      /* segue mesmo offline */
    }
    logout();
    toast.success("Sessão encerrada");
    router.replace("/login");
  }

  return (
    <VisaoGeralView
      logoUrl={configs?.logo_url}
      userNome={user?.nome}
      userPerfil={user?.perfil}
      isAdmin={user?.perfil === "Admin"}
      vinculadasCount={user?.empresas_vinculadas?.length ?? 0}
      data={data}
      isLoading={isLoading}
      hasError={!!error}
      atividade={stats.atividadeRecente}
      pendencias={pendencias}
      statsLoading={stats.isLoading}
      onLogout={handleLogout}
    />
  );
}
