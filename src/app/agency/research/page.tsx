import ResearchTool from './research-tool'

export default function ResearchPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Pesquisa de Criativos</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Analise anúncios ativos de concorrentes e gere roteiros UGC com IA.
        </p>
      </div>
      <ResearchTool />
    </div>
  )
}
