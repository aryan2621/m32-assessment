import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/utils/cn";

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function Layout({ children, showSidebar = true }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!showSidebar) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto p-4">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div
        className={cn(
          "flex flex-col min-w-0 transition-all duration-300",
          sidebarOpen ? "md:ml-64 ml-64" : "md:ml-16 ml-0"
        )}
      >
        <main className="flex-1 px-4 py-8">
          <div className="container mx-auto p-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
