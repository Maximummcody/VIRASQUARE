import { useAuth } from "@/_core/hooks/useAuth";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { LayoutDashboard, Loader2 } from "lucide-react";

export const NAVY_PROOF_TOKENS = {
  ink: "#0B1220",
  electricBlue: "#2563EB",
  skyBlue: "#60A5FA",
  paper: "#FFFFFF",
  workspace: "#F5F7FA",
  text: "#111827",
} as const;

export default function DesignProof() {
  const { loading, isAuthenticated } = useAuth();
  const initialView = window.location.pathname.endsWith("/products") ? "products" : "brief";

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#F5F7FA]"><Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" /></main>;
  if (!isAuthenticated) return <main className="grid min-h-screen place-items-center bg-[#F5F7FA] p-6"><section className="max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm"><LayoutDashboard className="mx-auto h-8 w-8 text-[#2563EB]" /><h1 className="mt-4 text-2xl font-black text-[#0B1220]">Sign in to view this private theme proof.</h1><p className="mt-3 text-sm leading-6 text-[#64748B]">This private route preserves the established ViraSquare workflow and changes only its visual theme.</p><Button onClick={() => startLogin()} className="mt-6 bg-[#2563EB] hover:bg-[#1D4ED8]">Sign in</Button></section></main>;

  return <WorkspaceShell initialView={initialView} theme="navy-proof" onEditProfile={() => window.location.assign("/")} />;
}
