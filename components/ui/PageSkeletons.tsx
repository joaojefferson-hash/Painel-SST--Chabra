// Skeletons ESTRUTURAIS genéricos, reutilizáveis entre módulos — para a transição
// de página aterrissar na estrutura (não em barras chapadas), sem "pulo" quando os
// dados chegam. Presentational puro (sem hooks) → serve em loading.tsx e no isLoading.

/** Página de detalhe: Voltar + cabeçalho rico + abas + KPIs + bloco de conteúdo. */
export function DetalheSkeleton() {
  return (
    <div className="space-y-5">
      <div className="skeleton-shimmer h-4 w-20" />

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="skeleton-shimmer size-12 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton-shimmer h-7 w-56 rounded" />
            <div className="skeleton-shimmer h-4 w-40 rounded" />
            <div className="flex gap-2 pt-1">
              <div className="skeleton-shimmer h-4 w-24 rounded-full" />
              <div className="skeleton-shimmer h-4 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 border-b border-gray-200 pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-4 w-24 rounded" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-20 rounded-xl" />
        ))}
      </div>

      <div className="skeleton-shimmer h-32 rounded-xl" />
    </div>
  );
}

/** Tabela/lista: cabeçalho + N linhas (espelha listas em tabela). */
export function TabelaSkeleton({ linhas = 6 }: { linhas?: number }) {
  return (
    <div className="space-y-2.5">
      <div className="skeleton-shimmer h-9 w-full rounded-lg" />
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="skeleton-shimmer h-12 w-full rounded" style={{ opacity: 1 - i * 0.06 }} />
      ))}
    </div>
  );
}

/** Página de lista completa (com barra de busca) — para loading.tsx de rotas de lista. */
export function ListaSkeleton({ linhas = 6 }: { linhas?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="skeleton-shimmer h-11 max-w-md flex-1 rounded-xl" />
        <div className="skeleton-shimmer h-11 w-40 rounded-xl" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <TabelaSkeleton linhas={linhas} />
      </div>
    </div>
  );
}
