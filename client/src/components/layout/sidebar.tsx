import React from "react";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/context/app-context";
import { Link } from "wouter";
import { 
  Home, 
  Users, 
  Settings, 
  ClipboardList,
  Cloud 
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { activeSection, setActiveSection } = useAppContext();

  const navItems = [
    { id: "dashboard", icon: Home, label: "Dashboard" },
    { id: "accounts", icon: Users, label: "Accounts" },
    { id: "settings", icon: Settings, label: "Settings" },
    { id: "logs", icon: ClipboardList, label: "Logs" },
  ];

  return (
    <div className={cn("w-64 bg-white border-r border-neutral-200 flex flex-col h-screen", className)}>
      <div className="p-4 border-b border-neutral-200">
        <h1 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
          <Cloud className="h-6 w-6 text-primary" />
          Steam Parser
        </h1>
      </div>

      <nav className="p-2 flex-1">
        <ul>
          {navItems.map((item) => (
            <li key={item.id} className="mb-1">
              <Link href={`/${item.id}`}>
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSection(item.id);
                  }}
                  className={cn(
                    "flex items-center px-4 py-2 text-sm rounded-md transition-colors",
                    activeSection === item.id
                      ? "text-white bg-primary hover:bg-primary-dark"
                      : "text-neutral-700 hover:bg-neutral-100"
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center text-sm text-neutral-600">
          <span className="flex h-2 w-2 mr-2 rounded-full bg-green-500"></span>
          Database: Connected
        </div>
      </div>
    </div>
  );
}
