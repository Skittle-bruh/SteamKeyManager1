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
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  // Отладка: принудительно обновляем компонент каждую секунду
  React.useEffect(() => {
    const interval = setInterval(forceUpdate, 1000);
    return () => clearInterval(interval);
  }, []);
  
  console.log('App rendering with activeSection:', activeSection);
  
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
