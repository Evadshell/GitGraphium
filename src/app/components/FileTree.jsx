"use client"

import { useRef, useCallback, useState, useEffect } from "react"
import ForceGraph3D from "react-force-graph-3d"
import { Card } from "@/components/ui/card"
import Particles from "react-tsparticles"
import { X, RotateCcw, Menu, Github, Settings, Bot, Search, Maximize2, MinusCircle, PlusCircle } from "lucide-react"
import * as THREE from "three"
import SpriteText from "three-spritetext"
import { Button } from "@/components/ui/button"
import ChatInterface from "./ChatInterface"
import FileTreeSidebar from "./FileTreeSideBar"
import { Input } from "@/components/ui/input"

const FileTree = () => {
  const fgRef = useRef()
  const [selectedNode, setSelectedNode] = useState(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [repoUrl, setRepoUrl] = useState("")
  const [graphData, setGraphData] = useState({ nodes: [], links: [] })
  const [loading, setLoading] = useState(false)

  const fetchRepoTree = async () => {
    try {
      setLoading(true)
      const match = repoUrl.match(/github\.com\/(.*)\/(.*)/)
      if (!match) {
        alert("Invalid GitHub repository URL")
        return
      }

      const [_, owner, repo] = match
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`)
      const data = await res.json()

      if (!data.tree) throw new Error("Invalid repository structure")

      const { nodes, links } = processGitHubTree(data.tree)
      setGraphData({ nodes, links })
    } catch (error) {
      console.error("Error fetching repository:", error)
      alert("Failed to fetch repository")
    } finally {
      setLoading(false)
    }
  }

  const processGitHubTree = (tree) => {
    const nodes = []
    const links = []
    const nodeMap = {}

    // Create root node
    const rootNode = { id: "root", name: "root", children: [], type: "folder", size: 2 }
    nodeMap["root"] = rootNode
    nodes.push(rootNode)

    tree.forEach((item) => {
      const pathParts = item.path.split("/")
      let parentNode = rootNode

      pathParts.forEach((part, index) => {
        const isLastPart = index === pathParts.length - 1
        const currentPath = pathParts.slice(0, index + 1).join("/")
        const nodeId = currentPath

        if (!nodeMap[nodeId]) {
          const newNode = {
            id: nodeId,
            name: part,
            children: [],
            type: isLastPart && item.type === "blob" ? "file" : "folder",
            size: isLastPart && item.type === "blob" ? 1 : 1.5,
            collapsed: true,
          }
          nodeMap[nodeId] = newNode
          nodes.push(newNode)
          parentNode.children.push(newNode)
          links.push({ source: parentNode.id, target: nodeId })
        }

        parentNode = nodeMap[nodeId]
      })
    })

    return { nodes, links }
  }
 const getPrunedTree = useCallback(() => {
    const visibleNodes = []
    const visibleLinks = []

    const traverseTree = (node) => {
      if (!node) return

      visibleNodes.push(node)
      if (node.collapsed) return

      node.children.forEach((childNode) => {
        visibleLinks.push({ source: node.id, target: childNode.id })
        traverseTree(childNode)
      })
    }

    traverseTree(graphData.nodes.find((n) => n.id === "root"))
    return { nodes: visibleNodes, links: visibleLinks }
  }, [graphData])
  const handleNodeClick = useCallback(
    (node) => {
      if (!node) return

      // Toggle node expansion
      node.collapsed = !node.collapsed

      // Update visible nodes and links
      setGraphData(getPrunedTree())

      // Update selected node
      setSelectedNode(node)

      // Focus camera on clicked node
      const distance = 40
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z)
      fgRef.current.cameraPosition({ x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, node, 1000)
    },
    [getPrunedTree],
  )

 

  const handleFullScreen = () => {
    setIsFullScreen(!isFullScreen)
  }

  const getNodeColor = useCallback((node) => {
    switch (node.type) {
      case "folder":
        return "#60A5FA"
      case "file":
        if (node.name.endsWith(".tsx") || node.name.endsWith(".ts")) {
          return "#34D399"
        }
        return "#F87171"
    }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    setGraphData(getPrunedTree())
  }, [])

  const handleZoomIn = () => {
    const { x, y, z } = fgRef.current.cameraPosition()
    fgRef.current.cameraPosition({ x: x * 0.8, y: y * 0.8, z: z * 0.8 }, null, 500)
  }

  const handleZoomOut = () => {
    const { x, y, z } = fgRef.current.cameraPosition()
    fgRef.current.cameraPosition({ x: x * 1.2, y: y * 1.2, z: z * 1.2 }, null, 500)
  }

  const handleReset = () => {
    fgRef.current.cameraPosition({ x: 0, y: 0, z: 200 }, { x: 0, y: 0, z: 0 }, 500)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] relative overflow-hidden">
      {/* Particle Background */}
      <div className="absolute inset-0 pointer-events-none">
        <Particles
          options={{
            background: {
              color: {
                value: "transparent",
              },
            },
            particles: {
              number: {
                value: 30,
                density: {
                  enable: true,
                  value_area: 1000,
                },
              },
              color: {
                value: "#1F1F1F",
              },
              line_linked: {
                enable: true,
                color: "#2D3748",
                opacity: 0.2,
              },
              move: {
                enable: true,
                speed: 0.5,
              },
              size: {
                value: 2,
              },
              opacity: {
                value: 0.3,
              },
            },
          }}
        />
      </div>

      {/* Modern Navbar with Glassmorphism */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-[#1F1F1F] shadow-lg">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-[#1F1F1F] transition-colors duration-200"
            >
              <Menu size={20} className="text-gray-400" />
            </Button>
            <div className="flex items-center gap-3">
              <Github className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-semibold text-white tracking-tight">CodeVis</span>
            </div>
          </div>

          <div className="flex-1 max-w-3xl mx-12">
            <div className="relative group flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-colors group-hover:text-blue-400" />
              <Input
                placeholder="Enter GitHub repo URL"
                className="pl-10 pr-24 py-2 w-full bg-[#1F1F1F] text-white border-[#2D2D2D] focus:border-blue-400 focus:ring-blue-400"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
              <Button
                onClick={fetchRepoTree}
                className="absolute right-0 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r"
                disabled={loading}
              >
                {loading ? "Fetching..." : "Fetch"}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="hover:bg-[#1F1F1F] transition-colors">
              <Bot className="h-5 w-5 text-gray-400 hover:text-blue-400 transition-colors" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-[#1F1F1F] transition-colors">
              <Settings className="h-5 w-5 text-gray-400 hover:text-blue-400 transition-colors" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-16 flex h-[calc(100vh-4rem)]">
        <FileTreeSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6">
          {/* Graph Section */}
          <div className={`${isFullScreen ? "w-full" : "lg:w-1/2"} transition-all duration-300 ease-out`}>
            <Card className="h-full bg-[#111111]/80 backdrop-blur-md border-[#1F1F1F] overflow-hidden relative">
              <div className="absolute top-4 left-4 flex gap-2 bg-[#1F1F1F]/90 backdrop-blur-xl p-2 rounded-lg border border-[#2D2D2D] shadow-xl z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  className="hover:bg-[#2D2D2D] text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <PlusCircle size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  className="hover:bg-[#2D2D2D] text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <MinusCircle size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  className="hover:bg-[#2D2D2D] text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <RotateCcw size={18} />
                </Button>
                <div className="w-px h-4 bg-[#2D2D2D] my-auto" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFullScreen}
                  className="hover:bg-[#2D2D2D] text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <Maximize2 size={18} />
                </Button>
              </div>
              <ForceGraph3D
                ref={fgRef}
                graphData={graphData}
                nodeLabel="name"
                nodeAutoColorBy="type"
                linkOpacity={0.5}
                linkDirectionalParticles={2}
                onNodeClick={handleNodeClick}
                nodeThreeObject={(node) => {
                  const group = new THREE.Group()
                  const sphere = new THREE.Mesh(
                    new THREE.SphereGeometry(node.size),
                    new THREE.MeshStandardMaterial({ color: getNodeColor(node) }),
                  )
                  group.add(sphere)

                  const sprite = new SpriteText(node.name)
                  sprite.color = "white"
                  sprite.textHeight = 4
                  sprite.position.y = node.size + 2
                  group.add(sprite)

                  return group
                }}
                width={dimensions.width}
                height={dimensions.height}
              />

              {/* Node Info Panel */}
              {selectedNode && (
                <div className="absolute top-4 right-4 bg-[#1F1F1F]/90 backdrop-blur-xl p-4 rounded-lg shadow-lg border border-[#2D2D2D]">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-white">{selectedNode.name}</h3>
                    <Button
                      onClick={() => setSelectedNode(null)}
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-white"
                    >
                      <X size={18} />
                    </Button>
                  </div>
                  <p className="text-gray-400">Type: {selectedNode.type}</p>
                </div>
              )}
            </Card>
          </div>
          {!isFullScreen && (
            <div className="lg:w-1/2">
              <ChatInterface />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FileTree

