export default function ClientMessagesPage() {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center mx-auto mb-4">
        <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h2 className="text-white font-semibold text-sm">Mensagens</h2>
      <p className="text-neutral-500 text-sm mt-1 max-w-xs">
        O chat com a equipe Perseo estará disponível em breve. Por agora entre em contato pelo WhatsApp.
      </p>
    </div>
  )
}
