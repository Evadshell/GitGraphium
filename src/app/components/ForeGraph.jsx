"use client"

import { useEffect, useRef } from "react"
import ForceGraph2D from "react-force-graph-2d"

function flattenFileStructure(data, nodes = [], links = [], parent = null) {
  const node = { id: data.name, name: data.name, val: 1 }
  nodes.push(node)

  if (parent) {
    links.push({ source: parent.name, target: data.name })
  }

  if (data.children) {
    data.children.forEach((child) => flattenFileStructure(child, nodes, links, node))
  }

  return { nodes, links }
}

export default function ForceGraph({ data, selectedFile }) {
  const graphData = flattenFileStructure(data)
  const graphRef = useRef()

  useEffect(() => {
    if (graphRef.current && selectedFile) {
      graphRef.current.centerAt(0, 0, 1000)
      graphRef.current.zoom(2, 2000)
    }
  }, [selectedFile])

  return (
    <ForceGraph2D
      ref={graphRef}
      graphData={graphData}
      nodeLabel="name"
      nodeColor={(node) => (node.name === selectedFile?.name ? "#ff0000" : "#00ff00")}
      linkColor={() => "#999999"}
      nodeCanvasObject={(node, ctx, globalScale) => {
        const label = node.name
        const fontSize = 12 / globalScale
        ctx.font = `${fontSize}px Sans-Serif`
        const textWidth = ctx.measureText(label).width
        const bckgDimensions = [textWidth, fontSize].map((n) => n + fontSize * 0.2)

        ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
        ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions)

        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillStyle = node.color
        ctx.fillText(label, node.x, node.y)
      }}
      width={800}
      height={600}
    />
  )
}

