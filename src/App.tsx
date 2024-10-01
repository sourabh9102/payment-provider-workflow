import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./App.css";
import google from "./assets/images/google.png";
import apple from "./assets/images/apple.webp";
import stripe from "./assets/images/stripe.jpg";
import paypal from "./assets/images/paypal.png";
import amazon from "./assets/images/amazon.webp";

interface CustomNodeData {
  icon?: string;
  label: string;
  amount?: number;
  country?: string;
  currency?: string;
  [key: string]: unknown;
}

interface NodeProps<T> {
  id: string;
  data: T;
  deleteNode: (nodeId: string) => void;
}

interface StyledEdge extends Connection {
  style?: {
    stroke: string;
    strokeDasharray: string;
    strokeDashoffset: number;
  };
}

type CustomNode = Node<CustomNodeData>;

const initialNodes: CustomNode[] = [
  {
    id: "1",
    data: { label: "Google Pay", icon: google },
    position: { x: 400, y: 100 },
    type: "paymentProvider",
  },
  {
    id: "2",
    data: { label: "Stripe", icon: stripe },
    position: { x: 400, y: 200 },
    type: "paymentProvider",
  },
  {
    id: "3",
    data: { label: "Paypal", icon: paypal },
    position: { x: 400, y: 300 },
    type: "paymentProvider",
  },
  {
    id: "4",
    data: { label: "Apple Pay", icon: apple },
    position: { x: 400, y: 400 },
    type: "paymentProvider",
  },
  {
    id: "5",
    data: { label: "Amazon Pay", icon: amazon },
    position: { x: 400, y: 400 },
    type: "paymentProvider",
  },
  {
    id: "us",
    data: { label: "United States", country: "us", currency: "$" },
    position: { x: 50, y: 200 },
    type: "countryNode",
  },
  {
    id: "uk",
    data: { label: "England", country: "gb", currency: "£" },
    position: { x: 50, y: 300 },
    type: "countryNode",
  },
];

const initialEdges: Edge[] = [];

const App: React.FC = () => {
  const [nodes, setNodes, onNodesChange] =
    useNodesState<CustomNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<
    { nodes: CustomNode[]; edges: Edge[] }[]
  >([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const paymentProviders = [
    { name: "Google Pay", icon: google },
    { name: "Apple Pay", icon: apple },
    { name: "Stripe", icon: stripe },
    { name: "Paypal", icon: paypal },
    { name: "Amazon Pay", icon: amazon },
  ];

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const updateHistory = (newNodes: CustomNode[], newEdges: Edge[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: newNodes, edges: newEdges });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const { source, target } = params;
      const sourceNode = nodes.find((node) => node.id === source);
      const targetNode = nodes.find((node) => node.id === target);

      if (
        (sourceNode?.data.label === "Payment Initialized" &&
          targetNode?.type === "countryNode") ||
        (targetNode?.data.label === "Payment Initialized" &&
          sourceNode?.type === "countryNode")
      ) {
        setErrorMessage(
          "Unable to connect to payment initializer. Please ensure the payment initializer only connect payment provider try again!"
        );
        return;
      }

      if (source && target && source !== target) {
        const newEdges = addEdge(
          {
            ...params,
            style: {
              stroke: "#000",
              strokeDasharray: "5,5",
              strokeDashoffset: 0,
            },
          } as StyledEdge,
          edges
        );
        setEdges(newEdges);
        updateHistory(nodes, newEdges);
        setErrorMessage(null);
      } else {
        setErrorMessage("Invalid connection");
      }
    },
    [nodes, edges, history, historyIndex]
  );

  const addNode = (provider: string) => {
    if (nodes.find((node) => node.data.label === provider)) {
      setErrorMessage("Provider already added");
      return;
    }

    const providerData = paymentProviders.find((p) => p.name === provider);

    const newNode: CustomNode = {
      id: provider,
      data: { label: provider, icon: providerData?.icon },
      position: { x: 400, y: nodes.length * 100 },
      type: "paymentProvider",
    };

    const newNodes = nodes.concat(newNode);
    setNodes(newNodes);
    updateHistory(newNodes, edges);
    setErrorMessage(null);
  };

  const deleteNode = (nodeId: string) => {
    setNodes((prevNodes) =>
      prevNodes.filter((node: CustomNode) => node.id !== nodeId)
    );
    setEdges((prevEdges) =>
      prevEdges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      )
    );
    setHistory((prevHistory) => [
      ...prevHistory.slice(0, historyIndex + 1),
      {
        nodes: nodes.filter((node: CustomNode) => node.id !== nodeId),
        edges: edges.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId
        ),
      },
    ]);
    setHistoryIndex((prevIndex) => prevIndex + 1);
  };

  const withDeleteNode = (Component: React.FC<NodeProps<CustomNode>>) => {
    return (props: any) => {
      const { id, data } = props;
      return <Component id={id} data={data} deleteNode={deleteNode} />;
    };
  };

  const handleStyle = {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#fff",
    border: "2px solid #000",
  };

  const PaymentProviderNode: React.FC<NodeProps<CustomNode>> = (props) => {
    const { id, data, deleteNode } = props;
    const nodeData = data as unknown as CustomNodeData;
    const isPaymentInitialized = nodeData.label === "Payment Initialized";

    return (
      <div
        style={{
          padding: "10px",
          border: "1px solid blue",
          borderRadius: "5px",
          backgroundColor: "white",
          position: "relative",
          width: "200px",
          height: isPaymentInitialized ? "80px" : "50px",
          display: "inline-block",
          textAlign: "center",
        }}
      >
        {isPaymentInitialized ? (
          <>
            <div
              style={{
                backgroundColor: "red",
                color: "black",
                padding: "5px",
                textAlign: "center",
              }}
            >
              {nodeData.label}
            </div>
            <div
              style={{
                backgroundColor: "white",
                color: "black",
                padding: "5px",
                textAlign: "center",
              }}
            >
              {nodeData.amount ? `$${nodeData.amount}` : "$0"}
            </div>
            <div style={{ position: "absolute", right: "0px", top: "50%" }}>
              <Handle
                type="target"
                position={Position.Right}
                id="right"
                style={handleStyle}
              />
            </div>
          </>
        ) : (
          <>
            <div style={{ position: "absolute", left: "0px", top: "50%" }}>
              <Handle
                type="source"
                position={Position.Left}
                id="left"
                style={handleStyle}
              />
            </div>
            {nodeData.icon && (
              <img
                src={nodeData.icon as string}
                alt={nodeData.label}
                style={{ width: "20px", marginRight: "5px" }}
              />
            )}
            {nodeData.label}
            <p
              onClick={() => deleteNode(id)}
              style={{
                float: "right",
                color: "red",
                marginLeft: "10px",
                cursor: "pointer",
              }}
            >
              X
            </p>
          </>
        )}
      </div>
    );
  };

  const CountryNode: React.FC<NodeProps<CustomNode>> = ({ data }) => {
    const nodeData = data as unknown as CustomNodeData;
    return (
      <div
        style={{
          padding: "10px",
          border: "1px solid grey",
          borderRadius: "5px",
          backgroundColor: "white",
          display: "flex",
          alignItems: "center",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", left: "0px", top: "50%" }}>
          <Handle
            type="source"
            position={Position.Left}
            id="left"
            style={handleStyle}
          />
        </div>
        <img
          src={`https://flagcdn.com/24x18/${nodeData.country}.png`}
          alt={nodeData.label}
          style={{ marginRight: "5px" }}
        />
        {nodeData.label} ({nodeData.currency})
        <div style={{ position: "absolute", right: "0px", top: "50%" }}>
          <Handle
            type="target"
            position={Position.Right}
            id="right"
            style={handleStyle}
          />
        </div>
      </div>
    );
  };

  const nodeTypes = useMemo(
    () => ({
      paymentProvider: withDeleteNode(PaymentProviderNode),
      countryNode: withDeleteNode(CountryNode),
    }),
    []
  );

  const addPaymentInitializationNode = () => {
    const newNode: CustomNode = {
      id: "payment-initialized",
      data: { label: "Payment Initialized", amount: 10 },
      position: { x: 600, y: 150 },
      type: "paymentProvider",
    };

    const newNodes = nodes.concat(newNode);
    setNodes(newNodes);
    updateHistory(newNodes, edges);
    setErrorMessage(null);
  };

  const saveWorkflow = () => {
    localStorage.setItem("workflow", JSON.stringify({ nodes, edges }));
    setErrorMessage(null);
    setSuccessMessage("Workflow saved successfully");
  };

  const loadWorkflow = () => {
    const savedWorkflow = JSON.parse(localStorage.getItem("workflow") || "{}");
    if (savedWorkflow.nodes && savedWorkflow.edges) {
      setNodes(savedWorkflow.nodes);
      setEdges(savedWorkflow.edges);
      updateHistory(savedWorkflow.nodes, savedWorkflow.edges);
      setErrorMessage(null);
    } else {
      setErrorMessage("No saved workflow found");
    }
  };

  const autoLayout = () => {
    const paymentInitializedNode = nodes.find(
      (node) => node.data.label === "Payment Initialized"
    );
    const countryNodes = nodes.filter((node) => node.type === "countryNode");
    const paymentProviderNodes = nodes.filter(
      (node) =>
        node.type === "paymentProvider" &&
        node.data.label !== "Payment Initialized"
    );

    const gap = 30;

    const updatedNodes = nodes.map((node) => {
      if (node === paymentInitializedNode) {
        return {
          ...node,
          position: { x: 100, y: 100 },
        };
      } else if (countryNodes.includes(node)) {
        const index = countryNodes.indexOf(node);
        return {
          ...node,
          position: { x: 100, y: 200 + index * 100 },
        };
      } else if (paymentProviderNodes.includes(node)) {
        const index = paymentProviderNodes.indexOf(node);
        return {
          ...node,
          position: { x: 300 + gap, y: 100 + index * 100 },
        };
      } else {
        return node;
      }
    });

    setNodes(updatedNodes);
    updateHistory(updatedNodes, edges);
  };

  const panToCenter = () => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const paymentInitializedNode = nodes.find(
      (node) => node.data.label === "Payment Initialized"
    );
    const countryNodes = nodes.filter((node) => node.type === "countryNode");
    const paymentProviderNodes = nodes.filter(
      (node) =>
        node.type === "paymentProvider" &&
        node.data.label !== "Payment Initialized"
    );

    const gap = 30;
    const columnWidth = 200;
    const columnGap = 100;

    const updatedNodes = nodes.map((node) => {
      if (node === paymentInitializedNode) {
        return {
          ...node,
          position: {
            x: centerX - columnWidth - columnGap / 2,
            y: centerY - (countryNodes.length * 100) / 2,
          },
        };
      } else if (countryNodes.includes(node)) {
        const index = countryNodes.indexOf(node);
        return {
          ...node,
          position: {
            x: centerX - columnWidth - columnGap / 2,
            y: centerY - (countryNodes.length * 100) / 2 + (index + 1) * 100,
          },
        };
      } else if (paymentProviderNodes.includes(node)) {
        const index = paymentProviderNodes.indexOf(node);
        return {
          ...node,
          position: {
            x: centerX + columnGap / 2,
            y: centerY - (paymentProviderNodes.length * 100) / 2 + index * 100,
          },
        };
      } else {
        return node;
      }
    });

    setNodes(updatedNodes);
    updateHistory(updatedNodes, edges);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const exportWorkflow = () => {
    const workflow = JSON.stringify({ nodes, edges });
    const blob = new Blob([workflow], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importWorkflow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const importedWorkflow = JSON.parse(content);
        if (importedWorkflow.nodes && importedWorkflow.edges) {
          setNodes(importedWorkflow.nodes);
          setEdges(importedWorkflow.edges);
          updateHistory(importedWorkflow.nodes, importedWorkflow.edges);
          setErrorMessage(null);
        } else {
          setErrorMessage("Invalid workflow file");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div style={{ height: "100vh" }}>
      <ReactFlowProvider>
        <div className="d-flex justify-content-center align-items-start mt-3">
          <div className="dropdown">
            <button
              className="btn btn-light dropdown-toggle"
              type="button"
              id="dropdownMenuButton"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{ border: "1px solid lightgray" }}
            >
              Add Payment Provider
            </button>
            <ul
              className="dropdown-menu"
              aria-labelledby="dropdownMenuButton"
              style={{ width: "100%" }}
            >
              {paymentProviders.map((provider) => (
                <li key={provider.name}>
                  <div
                    className="dropdown-item"
                    onClick={() => addNode(provider.name)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <img
                      src={provider.icon}
                      alt={provider.name}
                      style={{ width: "20px", marginRight: "10px" }}
                    />
                    {provider.name}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <button
            className="btn btn-light me-2"
            onClick={addPaymentInitializationNode}
            style={{ border: "1px solid lightgray" }}
          >
            Add Payment Initialization
          </button>
          <button
            className="btn btn-light me-2"
            style={{ border: "1px solid lightgray" }}
            onClick={autoLayout}
          >
            Auto Layout
          </button>
          <button
            className="btn btn-light me-2"
            style={{ border: "1px solid lightgray" }}
            onClick={panToCenter}
          >
            Pan to Center
          </button>
          <button
            className="btn btn-light me-2"
            style={{ border: "1px solid lightgray" }}
            onClick={loadWorkflow}
          >
            Load Workflow
          </button>
          <button
            className="btn btn-light me-2"
            style={{ border: "1px solid lightgray" }}
            onClick={undo}
            disabled={historyIndex <= 0}
          >
            Undo
          </button>
          <button
            className="btn btn-light me-2"
            style={{ border: "1px solid lightgray" }}
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            Redo
          </button>
          <button
            type="button"
            className="btn btn-light me-2"
            style={{ border: "1px solid lightgray" }}
            onClick={exportWorkflow}
          >
            <i className="bi bi-download"></i>
          </button>
          <input
            type="file"
            accept=".json"
            onChange={importWorkflow}
            style={{ display: "none" }}
            id="importWorkflowInput"
          />
          <label
            htmlFor="importWorkflowInput"
            className="btn btn-light me-2"
            style={{ border: "1px solid lightgray", cursor: "pointer" }}
          >
            <i className="bi bi-upload"></i>
          </label>
          <button
            type="button"
            className="btn btn-primary me-2"
            onClick={saveWorkflow}
          >
            Save
          </button>
        </div>
        {errorMessage && (
          <div
            className="alert alert-danger alert-dismissible fade show"
            role="alert"
            style={{
              backgroundColor: "white",
              display: "inline-block",
              position: "fixed",
              top: "70px",
              left: "50%",
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
              padding: "10px 20px",
              borderRadius: "5px",
              boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
            }}
          >
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div
            className="alert alert-success alert-dismissible fade show"
            role="alert"
            style={{
              backgroundColor: "white",
              borderColor: "#c3e6cb",
              color: "#155724",
              display: "inline-block",
              position: "fixed",
              top: "70px",
              left: "50%",
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
              padding: "10px 20px",
              borderRadius: "5px",
              boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
            }}
          >
            {successMessage}
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
        />
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlowProvider>
    </div>
  );
};

export default App;
