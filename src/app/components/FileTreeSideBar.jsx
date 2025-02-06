import { File, Folder, Tree } from "@/components/file-tree";
import { X } from "lucide-react"

const ELEMENTS = [
  {
    id: "1",
    isSelectable: true,
    name: "src",
    children: [
      {
        id: "2",
        isSelectable: true,
        name: "app",
        children: [
          {
            id: "3",
            isSelectable: true,
            name: "layout.tsx",
          },
          {
            id: "4",
            isSelectable: true,
            name: "page.tsx",
          },
        ],
      },
      {
        id: "5",
        isSelectable: true,
        name: "components",
        children: [
          {
            id: "6",
            isSelectable: true,
            name: "header.tsx",
          },
          {
            id: "7",
            isSelectable: true,
            name: "footer.tsx",
          },
        ],
      },
      {
        id: "8",
        isSelectable: true,
        name: "lib",
        children: [
          {
            id: "9",
            isSelectable: true,
            name: "utils.ts",
          },
        ],
      },
    ],
  },
]

const FileTreeSidebar = ({ isOpen, onClose }) => {
  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out`}
    >
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">File Structure</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>
      <div className="p-4">
        <Tree
          className="overflow-hidden rounded-md bg-background"
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

