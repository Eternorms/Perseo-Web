import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Toaster } from "@/components/ui/toast";
import { ClientShell } from "@/components/client/shell";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const { appUser, client } = await requireClient();

  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("client_notifications")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <ClientShell
      clientId={client.id}
      clientName={client.name}
      userName={appUser.name || appUser.email}
      notifications={notifications ?? []}
    >
      {children}
      <Toaster />
    </ClientShell>
  );
}
