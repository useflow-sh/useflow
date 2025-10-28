import { Route, Routes } from "react-router";
import { FlowGallery } from "./components/FlowGallery";
import { AdvancedFlowDemo } from "./flows/advanced/FlowDemo";
import { SimpleFlowDemo } from "./flows/simple/FlowDemo";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<FlowGallery />} />
      <Route path="/simple" element={<SimpleFlowDemo />} />
      <Route path="/advanced" element={<AdvancedFlowDemo />} />
    </Routes>
  );
}

export default App;
