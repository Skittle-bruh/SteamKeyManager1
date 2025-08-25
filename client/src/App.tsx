// Импортируем необходимые компоненты
import React from "react";
import Dashboard from "@/pages/dashboard";
import Settings from "@/pages/settings";
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
    case "settings":
      return <Settings />;
    default:
      return <NotFound />;
  }
}

export default App;
