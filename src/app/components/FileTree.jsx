"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import ForceGraph3D from "react-force-graph-3d";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import {
  X,
  RotateCcw,
  Menu,
  Github,
  Settings,
  Bot,
  Search,
  Maximize2,
  MinusCircle,
  PlusCircle,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from "lucide-react";
import * as THREE from "three";
import SpriteText from "three-spritetext";
import { Button } from "../../components/ui/button";
import ChatInterface from "./ChatInterface";
import FileTreeSidebar from "./FileTreeSideBar";
import { Input } from "../../components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";

const FileTree = () => {
  const [success, setSuccess] = useState(null);

  const fgRef = useRef();
  const [selectedNode, setSelectedNode] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("dark"); // Added theme state
  const fetchRepoTree = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a valid GitHub repository URL");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Parse GitHub URL
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\s]+)(\.git)?/);
      if (!match) {
        setError(
          "Invalid GitHub repository URL. Please use a valid GitHub repository URL."
        );
        return;
      }

      const [_, owner, repo] = match;
      const branches = ["main", "master"];

      // Fetch from GitHub API for visualization
      const githubResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`
      );

      if (!githubResponse.ok) {
        throw new Error(`GitHub API error: ${githubResponse.statusText}`);
      }

      const githubData = await githubResponse.json();

      if (!githubData.tree) {
        throw new Error("Invalid repository structure from GitHub");
      }

      // Process GitHub data for visualization
      const { nodes, links } = processGitHubTree(githubData.tree);
      setGraphData({ nodes, links });

      // Send to backend for processing
      const backendResponse = await fetch("http://localhost:8000/clone_repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repo_url: repoUrl }),
      });

      if (!backendResponse.ok) {
        throw new Error(
          `Backend processing error: ${backendResponse.statusText}`
        );
      }

      const backendData = await backendResponse.json();

      // You might want to store the backend response data in state if needed
      // setBackendData(backendData);

      // Optional: Show success message
      setSuccess("Repository processed successfully!");
    } catch (error) {
      console.error("Error processing repository:", error);
      setError(error.message || "Failed to process repository");

      // Clear graph data if there's an error
      setGraphData({ nodes: [], links: [] });
    } finally {
      setLoading(false);
    }
  };

  const processGitHubTree = (tree) => {
    const nodes = [];
    const links = [];
    const nodeMap = {};

    // Create root node
    const rootNode = {
      id: "root",
      name: "root",
      children: [],
      type: "folder",
      size: 2,
    };
    nodeMap["root"] = rootNode;
    nodes.push(rootNode);

    tree.forEach((item) => {
      const pathParts = item.path.split("/");
      let parentNode = rootNode;

      pathParts.forEach((part, index) => {
        const isLastPart = index === pathParts.length - 1;
        const currentPath = pathParts.slice(0, index + 1).join("/");
        const nodeId = currentPath;

        if (!nodeMap[nodeId]) {
          const newNode = {
            id: nodeId,
            name: part,
            children: [],
            type: isLastPart && item.type === "blob" ? "file" : "folder",
            size: isLastPart && item.type === "blob" ? 1 : 1.5,
            collapsed: true,
          };
          nodeMap[nodeId] = newNode;
          nodes.push(newNode);
          parentNode.children.push(newNode);
          links.push({ source: parentNode.id, target: nodeId });
        }

        parentNode = nodeMap[nodeId];
      });
    });

    return { nodes, links };
  };

  const getPrunedTree = useCallback(() => {
    const visibleNodes = [];
    const visibleLinks = [];

    const traverseTree = (node) => {
      if (!node) return;

      visibleNodes.push(node);
      if (node.collapsed) return;

      node.children.forEach((childNode) => {
        visibleLinks.push({ source: node.id, target: childNode.id });
        traverseTree(childNode);
      });
    };
    traverseTree(graphData.nodes.find((n) => n.id === "root"));
    return { nodes: visibleNodes, links: visibleLinks };
  }, [graphData]);

  const handleNodeClick = useCallback(
    (node) => {
      if (!node) return;

      node.collapsed = !node.collapsed;
      setGraphData(getPrunedTree());
      setSelectedNode(node);

      const distance = 40;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
      fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
        node,
        1000
      );
    },
    [getPrunedTree, graphData]
  );

  const handleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const getNodeColor = useCallback(
    (node) => {
      const colors = {
        dark: {
          folder: "#60A5FA",
          typescript: "#34D399",
          default: "#F87171",
        },
        light: {
          folder: "#3B82F6",
          typescript: "#10B981",
          default: "#EF4444",
        },
      };

      const colorSet = colors[theme];

      switch (node.type) {
        case "folder":
          return colorSet.folder;
        case "file":
          if (node.name.endsWith(".tsx") || node.name.endsWith(".ts")) {
            return colorSet.typescript;
          }
          return colorSet.default;
      }
    },
    [theme]
  );

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
  }, []);

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

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const bgColor = theme === "dark" ? "bg-zinc-950" : "bg-slate-50";
  const textColor = theme === "dark" ? "text-white" : "text-zinc-800";
  const borderColor = theme === "dark" ? "border-zinc-800" : "border-zinc-200";
  const buttonHoverBg =
    theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-100";
  const inputBg = theme === "dark" ? "bg-zinc-900" : "bg-white";
  const panelBg = theme === "dark" ? "bg-zinc-900/90" : "bg-white/90";

  return (
    <TooltipProvider>
      <div className={`h-screen w-screen ${bgColor} flex flex-col overflow-hidden`}>
        {/* Elegant Navbar */}
        <nav
          className={`h-16 border-b ${borderColor} ${bgColor} flex items-center px-6 shrink-0`}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Github className="h-6 w-6 text-blue-500" />
              <span className={`text-xl font-semibold ${textColor}`}>
                CodeVis
              </span>
            </div>
          </div>
          <div className="flex-1 max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center">
                <Search
                  className={`h-4 w-4 ${
                    theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                  }`}
                />
              </div>
              <Input
                placeholder="Enter GitHub repository URL"
                className={`w-full h-10 pl-10 ${inputBg} ${textColor} border-${borderColor} focus:border-blue-500 focus:ring-blue-500 rounded-lg`}
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchRepoTree()}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              variant="ghost"
              size="icon"
              className={buttonHoverBg}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </Button>
            <Button variant="ghost" size="icon" className={buttonHoverBg}>
              <Bot className="h-5 w-5 text-zinc-400" />
            </Button>
            <Button variant="ghost" size="icon" className={buttonHoverBg}>
              <Settings className="h-5 w-5 text-zinc-400" />
            </Button>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 flex min-h-0">
          <FileTreeSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            theme={theme}
          />

          <div className="flex-1 flex min-h-0">
            {/* Graph View */}
            <div
              className={`${
                isFullScreen ? "w-full" : "w-7/12"
              } relative transition-all duration-300`}
            >
              {/* Graph Controls */}
              <div
                className={`absolute top-4 left-4 z-10 flex gap-1 ${panelBg} backdrop-blur-xl p-2 rounded-lg border ${borderColor}`}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomIn}
                      className={`h-8 w-8 ${buttonHoverBg}`}
                    >
                      <PlusCircle size={16} className={textColor} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom In</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomOut}
                      className={`h-8 w-8 ${buttonHoverBg}`}
                    >
                      <MinusCircle size={16} className={textColor} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom Out</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleReset}
                      className={`h-8 w-8 ${buttonHoverBg}`}
                    >
                      <RotateCcw size={16} className={textColor} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset View</TooltipContent>
                </Tooltip>
                <div className={`w-px h-4 ${borderColor} my-auto mx-1`} />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleFullScreen}
                      className={`h-8 w-8 ${buttonHoverBg}`}
                    >
                      <Maximize2 size={16} className={textColor} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isFullScreen ? "Exit Full Screen" : "Full Screen"}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Force Graph */}
              <ForceGraph3D
                ref={fgRef}
                graphData={graphData}
                nodeLabel="name"
                backgroundColor={theme === "dark" ? "#000000" : "#f8fafc"}
                linkOpacity={0.5}
                linkDirectionalParticles={2}
                linkDirectionalParticleWidth={1.5}
                nodeRelSize={6}
                onNodeClick={handleNodeClick}
                linkWidth={1}
                nodeThreeObject={(node) => {
                  const group = new THREE.Group();
                  const sphere = new THREE.Mesh(
                    new THREE.SphereGeometry(node.size),
                    new THREE.MeshStandardMaterial({
                      color: getNodeColor(node),
                      emissive: getNodeColor(node),
                      emissiveIntensity: 0.2,
                      roughness: 0.5,
                      metalness: 0.3,
                    })
                  );
                  group.add(sphere);

                  const sprite = new SpriteText(node.name);
                  sprite.color = theme === "dark" ? "white" : "black";
                  sprite.textHeight = 4;
                  sprite.position.y = node.size + 2;
                  group.add(sprite);

                  return group;
                }}
                width={dimensions.width}
                height={dimensions.height}
              />

              {/* Loading Overlay */}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-3"></div>
                    <div className={textColor}>Loading repository...</div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="absolute top-4 right-4 max-w-xs bg-red-500/90 text-white backdrop-blur-xl p-3 rounded-lg border border-red-400 z-50">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <h3 className="text-sm font-medium">Error</h3>
                    <Button
                      onClick={() => setError(null)}
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-red-600"
                    >
                      <X size={14} className="text-white" />
                    </Button>
                  </div>
                  <p className="text-xs">{error}</p>
                </div>
              )}

              {/* Node Info Panel */}
              {selectedNode && (
                <div
                  className={`absolute top-4 right-4 ${panelBg} backdrop-blur-xl p-3 rounded-lg border ${borderColor}`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <h3 className={`text-sm font-medium ${textColor}`}>
                      {selectedNode.name}
                    </h3>
                    <Button
                      onClick={() => setSelectedNode(null)}
                      variant="ghost"
                      size="icon"
                      className={`h-6 w-6 ${buttonHoverBg}`}
                    >
                      <X size={14} className={textColor} />
                    </Button>
                  </div>
                  <p
                    className={`text-xs ${
                      theme === "dark" ? "text-neutral-400" : "text-neutral-600"
                    }`}
                  >
                    Type: {selectedNode.type}
                  </p>
                </div>
              )}

              {/* Empty State */}
              {graphData.nodes.length <= 1 && !loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center max-w-md p-6">
                    <Github className="h-14 w-14 text-blue-500 mb-6 mx-auto opacity-50" />
                    <h2 className={`text-xl font-semibold mb-2 ${textColor}`}>
                      No Repository Loaded
                    </h2>
                    <p
                      className={`${
                        theme === "dark"
                          ? "text-neutral-400"
                          : "text-neutral-600"
                      } mb-6`}
                    >
                      Enter a GitHub repository URL below to visualize its
                      structure in 3D.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Interface */}

            {/* Chat Interface */}
            <div className="w-5/12 flex flex-col h-full z-0 absolute right-0 overflow-hidden">
              <Card className={`flex-1 h-screen border-l ${borderColor}`}>
                <ChatInterface theme={theme} />
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default FileTree;
