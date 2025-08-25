import React from "react";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/context/app-context";
import { useNavigation } from "@/context/navigation-context";
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
  const { activeSection, setActiveSection } = useNavigation();

  const navItems = [
    { id: "dashboard", icon: Home, label: "Дашборд" },
    { id: "settings", icon: Settings, label: "Настройки" },
  ];

  return (
    <div className={cn("w-64 bg-card border-r border-border flex flex-col h-screen", className)}>
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <Cloud className="h-6 w-6 text-primary" />
          Парсер Стим
        </h1>
      </div>

      <nav className="p-2 flex-1">
        <ul>
          {navItems.map((item) => (
            <li key={item.id} className="mb-1">
              <Link 
                href={`/${item.id}`}
                data-testid={`button-${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  alert('Кликнули на: ' + item.id);
                  console.log('Navigating to section:', item.id);
                  setActiveSection(item.id);
                }}
                className={cn(
                  "flex items-center px-4 py-2 text-sm rounded-md transition-colors",
                  activeSection === item.id
                    ? "text-primary-foreground bg-primary hover:bg-primary/90"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center text-sm text-muted-foreground">
          <span className="flex h-2 w-2 mr-2 rounded-full bg-green-500"></span>
          База данных: Подключена
        </div>
      </div>
    </div>
  );
}
