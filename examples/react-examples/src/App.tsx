import { Route, Routes } from "react-router";
import { FlowGallery } from "./components/FlowGallery";
import { BranchingFlowDemo } from "./flows/branching/FlowDemo";
import { SimpleFlowDemo } from "./flows/simple/FlowDemo";

function App() {
  return (
    <Routes>
      <Route path="/" element={<FlowGallery />} />
      <Route path="/simple" element={<SimpleFlowDemo />} />
      <Route path="/branching" element={<BranchingFlowDemo />} />
    </Routes>
  );
}

export default App;
