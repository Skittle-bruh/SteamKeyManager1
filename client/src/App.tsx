// Импортируем необходимые компоненты
import React from "react";
import Dashboard from "@/pages/dashboard";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { useAppContext } from "./context/app-context";
import { useNavigation } from "./context/navigation-context";

// Главный компонент приложения
function App() {
  // Получаем активный раздел из нового контекста
  const { activeSection } = useNavigation();
  
  console.log('App rendering with activeSection from NavigationContext:', activeSection);
  
  // Рендерим соответствующий компонент в зависимости от активного раздела
  console.log('Switch statement evaluating:', activeSection);
  
  switch (activeSection) {
    case "dashboard":
      console.log('Rendering Dashboard');
      return <Dashboard />;
    case "settings":
      console.log('Rendering Settings');
      return <Settings />;
    default:
      console.log('Rendering NotFound for:', activeSection);
      return <NotFound />;
  }
}

export default App;
