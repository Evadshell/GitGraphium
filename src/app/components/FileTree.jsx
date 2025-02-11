"use client";
import { useRef, useCallback, useState, useMemo, useEffect } from "react";
import ForceGraph3D from "react-force-graph-3d";
import { Card } from "@/components/ui/card";
import { 
  X, 
  Folder, 
  FileCode, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Menu,
  Github,
  Settings,
  Bot,
  Search
} from "lucide-react";import * as THREE from "three";
import SpriteText from "three-spritetext";
import { Button } from "@/components/ui/button";
import ChatInterface from "./ChatInterface";
import FileTreeSidebar from "./FileTreeSideBar";
import { Input } from "@/components/ui/input";

const FileTree = () => {
  const fgRef = useRef();
  const [selectedNode, setSelectedNode] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("");

  const initialData = {
    nodes: [
      {
        id: "root",
        name: "project",
        type: "folder",
        content: "Root project directory",
        size: 2,
      },
      {
        id: "src",
        name: "src",
        type: "folder",
        content: "Source files",
        size: 1.8,
      },
      {
        id: "components",
        name: "components",
        type: "folder",
        content: "React components",
        size: 1.8,
      },
      {
        id: "pages",
        name: "pages",
        type: "folder",
        content: "Next.js pages",
        size: 1.8,
      },
      {
        id: "auth",
        name: "auth",
        type: "folder",
        content: "Authentication components",
        size: 1.6,
      },
      {
        id: "login",
        name: "Login.tsx",
        type: "file",
        size: 1.4,
        content: `export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form className="space-y-4">
      <Input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
      />
      <Input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
      />
      <Button type="submit">Login</Button>
    </form>
  );
};`,
      },
    ],
    links: [
      { source: "root", target: "src" },
      { source: "src", target: "components" },
      { source: "src", target: "pages" },
      { source: "components", target: "auth" },
      { source: "auth", target: "login" },
    ],
  };

  const getNodeColor = useCallback((node) => {
    switch (node.type) {
      case "folder":
        return "#60A5FA";
      case "file":
        if (node.name.endsWith(".tsx") || node.name.endsWith(".ts")) {
          return "#34D399";
        }
        return "#F87171";
    }
  }, []);

  const nodesById = useMemo(() => {
    const nodesById = Object.fromEntries(
      initialData.nodes.map((node) => [
        node.id,
        {
          ...node,
          collapsed: true,
          childLinks: [],
          color: getNodeColor(node),
        },
      ])
    );

    initialData.links.forEach((link) => {
      const source = nodesById[link.source];
      if (source) {
        source.childLinks = source.childLinks || [];
        source.childLinks.push(link);
      }
    });

    if (nodesById["root"]) {
      nodesById["root"].collapsed = false;
    }

    return nodesById;
  }, [getNodeColor]);

  const getPrunedTree = useCallback(() => {
    const visibleNodes = [];
    const visibleLinks = [];

    const traverseTree = (nodeId) => {
      const node = nodesById[nodeId];
      if (!node) return;

      visibleNodes.push(node);
      if (node.collapsed) return;

      node.childLinks.forEach((link) => {
        visibleLinks.push(link);
        traverseTree(link.target.id || link.target);
      });
    };

    traverseTree("root");
    return { nodes: visibleNodes, links: visibleLinks };
  }, [nodesById]);

  const [graphData, setGraphData] = useState(getPrunedTree());

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setGraphData(getPrunedTree());
  }, [getPrunedTree]);

  const handleNodeClick = useCallback(
    (node) => {
      if (!node) return;

      node.collapsed = !node.collapsed;
      setGraphData(getPrunedTree());
      setSelectedNode(node);

      const distance = 40;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

      fgRef.current.cameraPosition(
        {
          x: node.x * distRatio,
          y: node.y * distRatio,
          z: node.z * distRatio,
        },
        node,
        1000
      );
    },
    [getPrunedTree]
  );

  const handleZoomIn = () => {
    const { x, y, z } = fgRef.current.cameraPosition();
    fgRef.current.cameraPosition(
      { x: x * 0.8, y: y * 0.8, z: z * 0.8 },
      null,
      500
    );
  };

  const handleZoomOut = () => {
    const { x, y, z } = fgRef.current.cameraPosition();
    fgRef.current.cameraPosition(
      { x: x * 1.2, y: y * 1.2, z: z * 1.2 },
      null,
      500
    );
  };

  const handleReset = () => {
    fgRef.current.cameraPosition(
      { x: 0, y: 0, z: 200 },
      { x: 0, y: 0, z: 0 },
      500
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
    {/* Modern Navbar */}
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-lg border-b border-[#1F1F1F]">
      <div className="px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-[#1F1F1F]"
          >
            <Menu size={20} className="text-gray-400" />
          </Button>
          <div className="flex items-center gap-2">
            <Github className="h-6 w-6 text-white" />
            <span className="text-lg font-semibold text-white">CodeVis</span>
          </div>
        </div>

        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search repository..."
              className="w-full bg-[#1F1F1F] border-0 pl-10 text-white placeholder:text-gray-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hover:bg-[#1F1F1F]">
            <Bot className="h-5 w-5 text-gray-400" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:bg-[#1F1F1F]">
            <Settings className="h-5 w-5 text-gray-400" />
          </Button>
        </div>
      </div>
    </nav>
   {/* Main Content */}
   <div className="pt-16 flex h-[calc(100vh-4rem)]">
        <FileTreeSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="flex-1 flex">
          {/* Graph Section */}
          <div className="w-1/2 p-6">
            <Card className="h-full bg-[#111111] border-[#1F1F1F] overflow-hidden relative">
            <ForceGraph3D
              ref={fgRef}
              graphData={graphData}
              nodeLabel="name"
              nodeRelSize={6}
              nodeOpacity={1}
              nodeResolution={16}
              linkWidth={1}
              linkOpacity={0.5}
              linkDirectionalParticles={2}
              linkDirectionalParticleSpeed={0.003}
              linkDirectionalParticleWidth={2}
              onNodeClick={handleNodeClick}
              nodeThreeObject={(node) => {
                const group = new THREE.Group()

                const sphereGeometry = new THREE.SphereGeometry(node.size || 1)
                const sphereMaterial = new THREE.MeshPhongMaterial({
                  color: node.color,
                  transparent: true,
                  opacity: 0.85,
                  shininess: 100,
                })
                const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
                group.add(sphere)

                const sprite = new SpriteText(node.name)
                sprite.color = "#ffffff"
                sprite.backgroundColor = "rgba(0,0,0,0.2)"
                sprite.padding = 2
                sprite.textHeight = 8
                sprite.position.y = node.size * 1.5 || 1.5
                group.add(sprite)

                return group
              }}
              backgroundColor="#080808FF"
              width={dimensions.width / 2 - 32}
              height={dimensions.height - 100}
            />

             {/* Controls */}
             <div className="absolute top-4 left-4 flex gap-2 bg-[#1F1F1F]/90 backdrop-blur-sm p-2 rounded-lg">
                <Button variant="ghost" size="icon" className="hover:bg-[#2D2D2D] text-gray-400">
                  <ZoomIn size={18} />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-[#2D2D2D] text-gray-400">
                  <ZoomOut size={18} />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-[#2D2D2D] text-gray-400">
                  <RotateCcw size={18} />
                </Button>
              </div>

           {/* Node Info Panel */}
           {selectedNode && (
                <div className="absolute top-4 right-4 w-72 bg-[#1F1F1F]/95 backdrop-blur-md rounded-xl border border-[#2D2D2D] shadow-2xl">
                  <div className="flex items-center justify-between p-4 border-b border-[#2D2D2D]">
                    <h3 className="font-medium text-gray-200 flex items-center gap-2">
                      {selectedNode.type === "folder" ? (
                        <Folder size={16} className="text-blue-400" />
                      ) : (
                        <FileCode size={16} className="text-green-400" />
                      )}
                      {selectedNode.name}
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setSelectedNode(null)}
                      className="hover:bg-[#2D2D2D] text-gray-400"
                    >
                      <X size={18} />
                    </Button>
                  </div>
                  <div className="p-4 max-h-[240px] overflow-auto custom-scrollbar">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-[#2D2D2D]/50 p-4 rounded-lg">
                      {selectedNode.content}
                    </pre>
                  </div>
                </div>
              )}
            </Card>
          </div>
        <div className="w-1/2 p-6">
          <ChatInterface />
        </div>
      </div>
    </div>
  </div>
  );
};

export default FileTree;
