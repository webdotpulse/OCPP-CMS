import { AppShell } from "@/components/layout/AppShell";
import { EmsGatewayForm } from "@/components/ems-gateways/EmsGatewayForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewEmsGatewayPage() {
  return (
    <AppShell>
      <div className="mb-6 space-y-4">
        <Link href="/ems-gateways">
          <Button variant="ghost" size="sm" className="-ml-4 text-muted-foreground">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to EMS Gateways
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Register Gateway</h1>
          <p className="text-muted-foreground">Register a new EMS Gateway device.</p>
        </div>
      </div>
      <EmsGatewayForm />
    </AppShell>
  );
}
