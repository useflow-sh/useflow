import { Route, Routes } from "react-router";
import { SideNav } from "./components/SideNav";
import { pages } from "./config/pages";

function App() {
  return (
    <div className="flex">
      <SideNav />
      <div className="flex-1 ml-16">
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
