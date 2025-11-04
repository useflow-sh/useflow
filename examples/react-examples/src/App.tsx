import { useState } from "react";
import { Route, Routes } from "react-router";
import { Header } from "./components/Header";
import { SideNav } from "./components/SideNav";
import { pages } from "./config/pages";

function App() {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);

  return (
    <div className="relative min-h-screen">
      <Header onMenuClick={() => setIsSideNavOpen(!isSideNavOpen)} />
      <SideNav isOpen={isSideNavOpen} onClose={() => setIsSideNavOpen(false)} />

      {/* Main content - add top padding for header */}
      <div className="w-full pt-16">
        <Routes>
          {pages.map((page) => {
            const Component = page.component;
            return (
              <Route key={page.id} path={page.path} element={<Component />} />
            );
          })}
        </Routes>
      </div>
    </div>
  );
}

export default App;
