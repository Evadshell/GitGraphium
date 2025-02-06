import Image from "next/image";
// import { RepoVisualizer } from "./components/RepoVisualizer";
import FileTree from "./components/FileTree";

export default function Home() {
  return <>GitGraphium
  <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Repository Visualizer</h1>
      <FileTree />
    </div>
  </>;
}
