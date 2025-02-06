"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { FileTree } from "./FileTree"
import repoData from "../repo-structure.json"

const ForceGraph = dynamic(() => import("./ForceGraph"), { ssr: false })

export function RepoVisualizer() {
  const [selectedFile, setSelectedFile] = useState(null)

  const handleFileSelect = (file) => {
    setSelectedFile(file)
  }

  return (
    <div className="flex h-screen">
      <div className="w-1/3 overflow-auto border-r border-gray-200 p-4">
        <h2 className="text-2xl font-bold mb-4">File Structure</h2>
        <FileTree data={repoData} onSelectFile={handleFileSelect} />
      </div>
      <div className="w-2/3 p-4">
        <h2 className="text-2xl font-bold mb-4">File Relationships</h2>
        <ForceGraph data={repoData} selectedFile={selectedFile} />
      </div>
    </div>
  )
}

