"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Boxes,
  Building2,
  MapPin,
  LogOut,
  Shield,
  ClipboardList,
  FileText,
  ArrowRight,
  Loader2,
  Settings,
} from "lucide-react";
import type { UnidadeResumo, VisaoGeralData } from "@/lib/hooks/useVisaoGeralUnidades";
import { cn } from "@/lib/utils";

const VERDE_SIDEBAR = "#0f3d28";

export interface VisaoGeralViewProps {
  logoUrl?: string | null;
  userNome?: string;
  userPerfil?: string;
  isAdmin: boolean;
  /** Nº de empresas vinculadas (>0 só para Técnico com escopo restrito). */
  vinculadasCount: number;
  data?: VisaoGeralData;
  isLoading: boolean;
  hasError: boolean;
  onLogout: () => void;
}

/**
 * Apresentação pura da tela "Visão geral" (recebe tudo por props). A página
 * (app/(hub)/visao-geral) liga aos hooks reais; a rota de preview injeta mock.
 */
export default function VisaoGeralView({
  logoUrl,
  userNome,
  userPerfil,
  isAdmin,
  vinculadasCount,
  data,
  isLoading,
  hasError,
  onLogout,
}: VisaoGeralViewProps) {
  const totais = data?.totais;
  const unidades = data?.unidades ?? [];
  const escopoRestrito = userPerfil === "Tecnico" && vinculadasCount > 0;

  return (
    <div className="flex min-h-screen bg-[#f6f5f2]">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        className="hidden w-60 shrink-0 flex-col px-4 py-5 text-white md:flex"
        style={{ backgroundColor: VERDE_SIDEBAR }}
      >
        <div className="flex items-center gap-2.5 px-1">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Logo"
              className="h-9 w-auto max-w-[40px] rounded-md bg-white object-contain p-0.5"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex size-9 items-center justify-center rounded-md bg-white/15">
              <Shield className="size-5" />
            </div>
          )}
          <div className="leading-tight">
            <p className="text-sm font-bold">Chabra</p>
            <p className="text-[10px] uppercase tracking-wider text-white/55">Painel SST</p>
          </div>
        </div>

        <nav className="mt-7 space-y-0.5">
          <NavItem active icon={<LayoutDashboard className="size-[15px]" />} label="Visão geral" />
          <Link href="/inicio">
            <NavItem icon={<Boxes className="size-[15px]" />} label="Módulos" />
          </Link>
          <Link href="/empresas">
            <NavItem icon={<Building2 className="size-[15px]" />} label="Empresas" />
          </Link>
        </nav>

        <p className="mb-1 mt-7 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">
          Unidades
        </p>
        <div className="space-y-0.5 overflow-y-auto">
          {unidades
            .filter((u) => u.id_unidade)
            .map((u) => (
              <Link key={u.id_unidade} href="/empresas">
                <NavItem icon={<MapPin className="size-[15px]" />} label={u.nome} badge={u.empresas} />
              </Link>
            ))}
        </div>

        <div className="mt-auto border-t border-white/10 pt-3">
          {userNome && (
            <div className="px-3 pb-2 leading-tight">
              <p className="truncate text-sm font-semibold text-white/90">{userNome}</p>
              <p className="text-[11px] text-white/50">{userPerfil}</p>
            </div>
          )}
          {isAdmin && (
            <Link href="/usuarios">
              <NavItem icon={<Settings className="size-[15px]" />} label="Sistema" />
            </Link>
          )}
          <button type="button" onClick={onLogout} className="w-full">
            <NavItem icon={<LogOut className="size-[15px]" />} label="Sair" />
          </button>
        </div>
      </aside>

      {/* ── Conteúdo ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-x-hidden px-5 py-7 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Visão geral</h1>
              <p className="mt-1 max-w-xl text-sm text-gray-500">
                Panorama por unidade — empresas, inspeções e laudos em cada base.
              </p>
            </div>
            <div
              className="w-full rounded-2xl p-4 text-white shadow-sm md:w-72"
              style={{ background: "linear-gradient(135deg, #0f3d28 0%, #006B54 100%)" }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                Seu acesso
              </p>
              <p className="mt-1 text-lg font-bold">
                {escopoRestrito ? `${vinculadasCount} empresa(s) vinculada(s)` : "Acesso total"}
              </p>
              <p className="mt-1 text-xs text-white/70">
                {escopoRestrito
                  ? "Você vê os dados das empresas vinculadas e das sem unidade."
                  : `Todas as ${totais?.unidades ?? 0} unidade(s) e empresas.`}
              </p>
            </div>
          </div>

          {hasError ? (
            <div className="mt-8 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              Erro ao carregar os dados. Tente recarregar a página.
            </div>
          ) : (
            <>
              <p className="mb-2 mt-8 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Resumo
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <ResumoCard label="Unidades" valor={totais?.unidades} icon={<MapPin className="size-4" />} loading={isLoading} />
                <ResumoCard label="Empresas" valor={totais?.empresas} icon={<Building2 className="size-4" />} loading={isLoading} />
                <ResumoCard label="Inspeções" valor={totais?.inspecoes} icon={<ClipboardList className="size-4" />} loading={isLoading} />
                <ResumoCard label="Laudos" valor={totais?.laudos} icon={<FileText className="size-4" />} loading={isLoading} />
              </div>

              <p className="mb-2 mt-9 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Unidades
              </p>
              {isLoading ? (
                <div className="flex items-center gap-2 py-10 text-sm text-gray-400">
                  <Loader2 className="size-4 animate-spin" /> Carregando unidades…
                </div>
              ) : unidades.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white py-10 text-center text-sm text-gray-500">
                  Nenhuma unidade cadastrada. Crie unidades ou vincule empresas a uma unidade.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {unidades.map((u) => (
                    <UnidadeCard key={u.id_unidade ?? "sem"} u={u} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-sm font-medium transition-colors",
        active ? "bg-white/[0.14] text-white" : "text-white/65 hover:bg-white/[0.08] hover:text-white/90",
      )}
    >
      <span className={active ? "text-white" : "text-white/40"}>{icon}</span>
      <span className="flex-1 truncate text-left">{label}</span>
      {badge !== undefined && (
        <span className="rounded-full bg-white/10 px-1.5 text-[10px] font-semibold text-white/70">{badge}</span>
      )}
    </div>
  );
}

function ResumoCard({
  label,
  valor,
  icon,
  loading,
}: {
  label: string;
  valor?: number;
  icon: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-gray-400">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">
        {loading ? <span className="inline-block h-7 w-10 animate-pulse rounded bg-gray-100" /> : valor ?? 0}
      </p>
    </div>
  );
}

function UnidadeCard({ u }: { u: UnidadeResumo }) {
  const semUnidade = u.id_unidade === null;
  return (
    <Link
      href="/empresas"
      className="group flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-verde-primary hover:shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              semUnidade ? "bg-gray-100 text-gray-400" : "bg-verde-light text-verde-primary",
            )}
          >
            <MapPin className="size-4" />
          </span>
          <span className="font-semibold text-gray-900">{u.nome}</span>
        </div>
        <ArrowRight className="size-4 text-gray-300 transition-colors group-hover:text-verde-primary" />
      </div>
      <div className="mt-3 flex items-center gap-4 text-sm">
        <Metric label="empresas" valor={u.empresas} />
        <span className="text-gray-200">·</span>
        <Metric label="inspeções" valor={u.inspecoes} />
        <span className="text-gray-200">·</span>
        <Metric label="laudos" valor={u.laudos} />
      </div>
    </Link>
  );
}

function Metric({ label, valor }: { label: string; valor: number }) {
  return (
    <span className="text-gray-600">
      <span className="font-bold text-gray-900">{valor}</span> {label}
    </span>
  );
}
