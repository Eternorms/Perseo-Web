import { requireAgency } from "@/lib/auth";
import { Toaster } from "@/components/ui/toast";
import { AgencyShell } from "@/components/agency/shell";

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  const { appUser } = await requireAgency();

  return (
    <AgencyShell userName={appUser.name || appUser.email} userType={appUser.user_type}>
      {children}
      <Toaster />
    </AgencyShell>
  );
}
