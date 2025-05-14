// Импортируем необходимые компоненты
import React from "react";
import Dashboard from "@/pages/dashboard";
import Accounts from "@/pages/accounts";
import Settings from "@/pages/settings";
import Logs from "@/pages/logs";
import NotFound from "@/pages/not-found";
import { useAppContext } from "./context/app-context";

// Главный компонент приложения
function App() {
  // Получаем активный раздел из контекста
  const { activeSection } = useAppContext();
  
  // Рендерим соответствующий компонент в зависимости от активного раздела
  switch (activeSection) {
    case "dashboard":
      return <Dashboard />;
    case "accounts":
      return <Accounts />;
    case "settings":
      return <Settings />;
    case "logs":
      return <Logs />;
    default:
      return <NotFound />;
  }
}

export default App;
