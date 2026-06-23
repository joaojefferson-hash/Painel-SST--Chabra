"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useUserStore } from "@/lib/store";
import { useConfiguracoes } from "@/lib/hooks/useConfiguracoes";
import { useVisaoGeralUnidades } from "@/lib/hooks/useVisaoGeralUnidades";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import VisaoGeralView from "@/components/visao-geral/VisaoGeralView";

export default function VisaoGeralPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);
  const { data: configs } = useConfiguracoes();
  const { data, isLoading, error } = useVisaoGeralUnidades();

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
      onLogout={handleLogout}
    />
  );
}
