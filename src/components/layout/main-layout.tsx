import { ReactNode } from "react";
import StarBackground from "@/components/star-background";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar h-full w-full relative">
      <StarBackground />
      <div className="relative z-0 h-full w-full">
        {children}
      </div>
    </main>
  );
}
