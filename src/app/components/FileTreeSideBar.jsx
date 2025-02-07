import { File, Folder, Tree } from "@/components/file-tree"
import { X } from "lucide-react"

const ELEMENTS = [
  { id: "1", type: "folder", name: "src" },
  { id: "2", type: "folder", name: "app", parentId: "1" },
  { id: "3", type: "file", name: "layout.tsx", parentId: "2" },
  { id: "4", type: "file", name: "page.tsx", parentId: "2" },
  { id: "5", type: "folder", name: "components", parentId: "1" },
  { id: "6", type: "file", name: "header.tsx", parentId: "5" },
  { id: "7", type: "file", name: "footer.tsx", parentId: "5" },
  { id: "8", type: "folder", name: "lib", parentId: "1" },
  { id: "9", type: "file", name: "utils.ts", parentId: "8" },
]

const FileTreeSidebar = ({ isOpen, onClose }) => {
  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 shadow-lg transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out`}
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-gray-100">File Structure</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-100">
          <X size={24} />
        </button>
      </div>
      <div className="p-4">
        <Tree
          className="overflow-hidden rounded-md bg-gray-900 text-gray-100"
          initialSelectedId="7"
          initialExpandedItems={["1", "2", "3", "4", "5", "6", "7", "8", "9"]}
          elements={ELEMENTS}
        >
          <Folder element="src" value="1">
            <Folder value="2" element="app">
              <File value="3">
                <p>layout.tsx</p>
              </File>
              <File value="4">
                <p>page.tsx</p>
              </File>
            </Folder>
            <Folder value="5" element="components">
              <File value="6">
                <p>header.tsx</p>
              </File>
              <File value="7">
                <p>footer.tsx</p>
              </File>
            </Folder>
            <Folder value="8" element="lib">
              <File value="9">
                <p>utils.ts</p>
              </File>
            </Folder>
          </Folder>
        </Tree>
      </div>
    </div>
  )
}

export default FileTreeSidebar

