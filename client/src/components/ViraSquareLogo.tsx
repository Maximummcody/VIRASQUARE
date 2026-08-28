import { cn } from "@/lib/utils";
export function ViraSquareLogo({ small = false, className }: { small?: boolean; className?: string }) {
  const iconSize = small ? "h-8 w-8" : "h-10 w-10";
  const wordmarkSize = small ? "text-base" : "text-lg";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg aria-hidden="true" viewBox="0 0 512 512" className={cn("shrink-0", iconSize)}>
        <rect width="512" height="512" rx="104" fill="#F5F7FA" />
        <rect x="40" y="40" width="432" height="432" rx="96" fill="#FFFFFF" stroke="#D8E5F5" strokeWidth="9" />
        <path d="M126 153H212L282 322L232 389Z" fill="#0B1220" />
        <path d="M299 153H386L282 322L232 389Z" fill="#2563EB" />
        <rect x="327" y="76" width="102" height="102" rx="26" fill="#2563EB" />
        <path d="M92 423H420" stroke="#D8E5F5" strokeWidth="10" strokeLinecap="round" />
      </svg>
      <span className={cn("whitespace-nowrap font-bold tracking-[-.055em]", wordmarkSize)} aria-label="ViraSquare">
        <span className="text-[#0B1220]">Vira</span><span className="text-[#2563EB]">Square</span>
      </span>
    </div>
  );
}
