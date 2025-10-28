import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Node, Edge } from 'reactflow';
import { FlowCanvas } from '@/components/flowchart/FlowCanvas';
import { NodeEditPanel } from '@/components/flowchart/NodeEditPanel';
import { Toolbar } from '@/components/flowchart/Toolbar';
import {
  getFlowchart,
  saveFlowchart,
  defaultStyles,
  NodeStyle,
  createNewFlowchart,
} from '@/lib/storage';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function FlowchartEditor() {
  const { id, version } = useParams();
  const navigate = useNavigate();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [styles, setStyles] = useState<NodeStyle[]>(defaultStyles);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);

  useEffect(() => {
    if (id && version) {
      const flowchart = getFlowchart(Number(id), Number(version));
      if (flowchart) {
        setNodes(
          flowchart.nodes.map((node) => ({
            ...node,
            type: 'custom',
            data: {
              ...node.data,
              style: flowchart.styles.find((s) => s.id === node.data.styleId),
            },
          }))
        );
        setEdges(flowchart.edges);
        setStyles(flowchart.styles);
        setCurrentId(flowchart.id);
        setCurrentVersion(flowchart.version);
      } else {
        toast.error('Flowchart not found');
        navigate('/');
      }
    } else {
      // Create new flowchart
      const { id: newId, version: newVersion } = createNewFlowchart();
      setCurrentId(newId);
      setCurrentVersion(newVersion);
      navigate(`/${newId}/${newVersion}/edit`, { replace: true });
      toast.success('New flowchart created');
    }
  }, [id, version, navigate]);

  const handleAddNode = useCallback(() => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'custom',
      position: { x: Math.random() * 300, y: Math.random() * 300 },
      data: {
        label: 'New Node',
        description: '',
        styleId: styles[0].id,
        style: styles[0],
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setHasChanges(true);
  }, [styles]);

  const handleNodesChange = useCallback((newNodes: Node[]) => {
    setNodes(newNodes);
    setHasChanges(true);
  }, []);

  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    setEdges(newEdges);
    setHasChanges(true);
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const handleSaveNode = useCallback(
    (label: string, description: string, styleId: string) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  label,
                  description,
                  styleId,
                  style: styles.find((s) => s.id === styleId),
                },
              }
            : node
        )
      );
      setSelectedNodeId(null);
      setHasChanges(true);
    },
    [selectedNodeId, styles]
  );

  const handleCreateStyle = useCallback((newStyle: NodeStyle) => {
    setStyles((prevStyles) => [...prevStyles, newStyle]);
    setHasChanges(true);
    toast.success('New style created');
  }, []);

  const handleSave = useCallback(() => {
    if (currentId !== null) {
      const cleanNodes = nodes.map(({ data, ...node }) => ({
        ...node,
        data: {
          label: data.label,
          description: data.description,
          styleId: data.styleId,
        },
      }));

      const newVersion = saveFlowchart(currentId, cleanNodes, edges, styles);
      setCurrentVersion(newVersion);
      setHasChanges(false);
      toast.success(`Saved as version ${newVersion}`);
      navigate(`/${currentId}/${newVersion}/edit`, { replace: true });
    }
  }, [currentId, nodes, edges, styles, navigate]);

  const handleExportJson = useCallback(() => {
    const data = {
      id: currentId,
      version: currentVersion,
      nodes: nodes.map(({ data, ...node }) => ({
        ...node,
        data: {
          label: data.label,
          description: data.description,
          styleId: data.styleId,
        },
      })),
      edges,
      styles,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowchart-${currentId}-v${currentVersion}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON exported');
  }, [currentId, currentVersion, nodes, edges, styles]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-2 p-3 bg-card border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Button>
        <div className="flex-1">
          <h1 className="text-sm font-medium">
            Flowchart #{currentId} - Version {currentVersion}
          </h1>
        </div>
      </div>

      <Toolbar
        isPreviewMode={isPreviewMode}
        onToggleMode={() => setIsPreviewMode(!isPreviewMode)}
        onAddNode={handleAddNode}
        onSave={handleSave}
        onExportJson={handleExportJson}
        canSave={hasChanges}
      />

      <div className="flex-1 relative">
        <FlowCanvas
          initialNodes={nodes}
          initialEdges={edges}
          styles={styles}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onNodeClick={handleNodeClick}
          isEditable={!isPreviewMode}
        />

        {selectedNode && !isPreviewMode && (
          <NodeEditPanel
            nodeId={selectedNode.id}
            label={selectedNode.data.label}
            description={selectedNode.data.description}
            styleId={selectedNode.data.styleId}
            styles={styles}
            onClose={() => setSelectedNodeId(null)}
            onSave={handleSaveNode}
            onCreateStyle={handleCreateStyle}
          />
        )}
      </div>
    </div>
  );
}
