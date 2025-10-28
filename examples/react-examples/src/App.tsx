import { Route, Routes } from "react-router";
import { FlowGallery } from "./components/FlowGallery";
import { SideNav } from "./components/SideNav";
import { BranchingFlowDemo } from "./flows/branching/FlowDemo";
import { SimpleFlowDemo } from "./flows/simple/FlowDemo";
import { SurveyFlowDemo } from "./flows/survey/FlowDemo";
import { TaskFlowDemo } from "./flows/task/FlowDemo";

function App() {
  return (
    <div className="flex">
      <SideNav />
      <div className="flex-1 ml-16">
        <Routes>
          <Route path="/" element={<FlowGallery />} />
          <Route path="/simple" element={<SimpleFlowDemo />} />
          <Route path="/branching" element={<BranchingFlowDemo />} />
          <Route path="/task" element={<TaskFlowDemo />} />
          <Route path="/survey" element={<SurveyFlowDemo />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
