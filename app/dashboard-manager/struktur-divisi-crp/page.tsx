"use client";

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MarkerType,
  NodeTypes,
  MiniMap,
  Handle,
  Position,
  Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { StrukturDivisiCrpDialog } from '@/components/struktur-divisi-crp-dialog';
import { Plus, HelpCircle, Trash2, Pencil, Trash } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

// Custom Node Component - Matching the design from struktur-divisi-crp page
const StaffNode = ({ data }: { data: any }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 w-72 hover:border-blue-400 dark:hover:border-blue-500 transition-colors relative">
      {/* Visible handles for connecting - small blue dots */}
      {/* Top - Can receive connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white rounded-full hover:!scale-150 transition-transform"
      />

      {/* Bottom - Can start connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white rounded-full hover:!scale-150 transition-transform"
      />

      {/* Left - Can receive connections */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white rounded-full hover:!scale-150 transition-transform"
      />

      {/* Right - Can start connections */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white rounded-full hover:!scale-150 transition-transform"
      />

      {/* Card Header - Gradient Background */}
      <div className={`bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 p-6 relative ${data.keterangan ? 'rounded-t-xl' : 'rounded-xl'}`}>
        {/* Action Buttons - Top Right Corner */}
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={data.onEdit}
            className="w-7 h-7 bg-white/90 hover:bg-white text-blue-600 rounded-lg flex items-center justify-center shadow-lg cursor-pointer transition-all hover:scale-110"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={data.onDelete}
            className="w-7 h-7 bg-white/90 hover:bg-white text-red-600 rounded-lg flex items-center justify-center shadow-lg cursor-pointer transition-all hover:scale-110"
            title="Hapus"
          >
            <Trash className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          {data.fotoUrl ? (
            <div className="relative w-28 h-28">
              <Image
                src={data.fotoUrl}
                alt={data.label}
                fill
                className="rounded-full border-4 border-white shadow-2xl object-cover"
              />
            </div>
          ) : (
            <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30">
              <span className="text-white text-5xl font-bold">{data.label.charAt(0)}</span>
            </div>
          )}
          <div className="text-center flex-1 w-full">
            <h3 className="text-xl font-bold text-white truncate">{data.label}</h3>
            <p className="text-sm text-emerald-100 truncate">{data.jabatan}</p>
          </div>
        </div>
      </div>

      {/* Card Body - Keterangan */}
      {data.keterangan && (
        <div className="p-4 pt-2 rounded-b-xl">
          <div className="text-xs text-slate-600 dark:text-slate-400 italic text-center">
            "{data.keterangan}"
          </div>
        </div>
      )}
    </div>
  );
};

export default function StrukturDivisiCrpReactFlowPage() {
  const nodeTypes: NodeTypes = useMemo(() => ({
    staff: StaffNode,
  }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  // Fetch data from Convex
  const allStaff = useQuery(api.strukturDivisiCrp.getAllStaff);
  const createMutation = useMutation(api.strukturDivisiCrp.createStaff);
  const updateMutation = useMutation(api.strukturDivisiCrp.updateStaff);
  const deleteMutation = useMutation(api.strukturDivisiCrp.deleteStaff);
  const addConnectionMutation = useMutation(api.strukturDivisiCrp.addConnection);
  const removeConnectionMutation = useMutation(api.strukturDivisiCrp.removeConnection);
  const updatePositionMutation = useMutation(api.strukturDivisiCrp.updateStaffPosition);
  const clearAllConnectionsMutation = useMutation(api.strukturDivisiCrp.clearAllConnections);

  useEffect(() => {
    if (allStaff) {
      const newNodes: Node[] = allStaff.map((staff) => ({
        id: staff._id,
        type: 'staff',
        position: { x: staff.positionX, y: staff.positionY },
        data: {
          id: staff._id,
          label: staff.nama,
          jabatan: staff.jabatan,
          fotoUrl: staff.fotoUrl,
          keterangan: staff.keterangan,
          onEdit: () => handleEdit(staff),
          onDelete: () => handleDelete(staff._id, staff.nama),
        },
      }));

      const newEdges: Edge[] = [];
      allStaff.forEach((staff) => {
        if (staff.connections) {
          staff.connections.forEach((connection) => {
            const connectionId = typeof connection === 'object' ? connection.targetId : connection;
            const connectionData = typeof connection === 'object' ? connection : undefined;

            // Render edge in the direction it was stored (unidirectional)
            const edgeId = `${staff._id}-${connectionId}`;
            newEdges.push({
              id: edgeId,
              source: staff._id,
              target: connectionId,
              sourceHandle: connectionData?.fromConnector || 'bottom',
              targetHandle: connectionData?.toConnector || 'top',
              type: 'smoothstep',
              animated: false,
              style: {
                stroke: '#10b981',
                strokeWidth: 3,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#10b981',
              },
            });
          });
        }
      });

      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [allStaff, setNodes, setEdges]);

  const onNodeDragStop = useCallback((_: any, node: Node) => {
    updatePositionMutation({
      id: node.id as Id<"strukturDivisiCrp">,
      positionX: node.position.x,
      positionY: node.position.y,
    })
      .then(() => {
        // Optional: show success toast
      })
      .catch(() => {
        toast.error('❌ Gagal menyimpan posisi!');
      });
  }, [updatePositionMutation]);

  const isValidConnection = useCallback((connection: Connection) => {
    // Allow all connections including source-to-source
    // Only prevent self-connections
    return connection.source !== connection.target;
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    console.log('🔗 Creating connection:', connection);

    const newEdge: Edge = {
      id: `${connection.source}-${connection.target}`,
      source: connection.source || '',
      target: connection.target || '',
      sourceHandle: connection.sourceHandle || undefined,
      targetHandle: connection.targetHandle || undefined,
      type: 'smoothstep',
      animated: false,
      style: {
        stroke: '#10b981',
        strokeWidth: 3,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#10b981',
      },
    };

    // Add edge locally first
    setEdges((eds) => [...eds, newEdge]);

    // Then save to Convex
    addConnectionMutation({
      fromId: connection.source as Id<"strukturDivisiCrp">,
      toId: connection.target as Id<"strukturDivisiCrp">,
      fromConnector: connection.sourceHandle || 'bottom',
      toConnector: connection.targetHandle || 'top',
      type: 'solid',
      label: 'reporting',
      color: '#10b981',
      routing: 'smoothstep',
    })
      .then((result) => {
        if (result?.alreadyExists) {
          toast.info('ℹ️ Koneksi sudah ada!');
          setEdges((eds) => eds.filter((e) => e.id !== newEdge.id));
        } else {
          toast.success('✅ Koneksi berhasil dibuat!');
        }
      })
      .catch((error) => {
        console.error('❌ Connection failed:', error);
        toast.error('❌ Gagal membuat koneksi: ' + error.message);
        setEdges((eds) => eds.filter((e) => e.id !== newEdge.id));
      });
  }, [addConnectionMutation, setEdges]);

  const handleAdd = () => {
    setDialogMode('add');
    setSelectedStaff(null);
    setDialogOpen(true);
  };

  const handleEdit = (staff: any) => {
    setDialogMode('edit');
    setSelectedStaff(staff);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    setDialogOpen(false);
  };

  const showHelp = () => {
    toast.info('📌 Cara Menggunakan:', {
      description: '✨ DRAG CARD: Geser card untuk atur posisi\n✨ CONNECT: Drag dari titik biru di KANAN/BAWAH card ke KIRI/ATAS card lain\n❌ DELETE EDGE: Double-click pada garis koneksi',
      duration: 8000,
    });
  };

  const handleClearAllConnections = async () => {
    const confirmed = confirm('⚠️ Hapus SEMUA koneksi?');
    if (!confirmed) return;

    try {
      await clearAllConnectionsMutation();
      toast.success('✅ Semua koneksi berhasil dihapus!');
      setEdges([]);
    } catch (error) {
      console.error('Error clearing connections:', error);
      toast.error('❌ Gagal menghapus koneksi!');
    }
  };

  const onEdgeDoubleClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    const sourceId = edge.source as Id<"strukturDivisiCrp">;
    const targetId = edge.target as Id<"strukturDivisiCrp">;

    const confirmed = confirm(`Hapus koneksi ini?`);
    if (!confirmed) return;

    removeConnectionMutation({
      fromId: sourceId,
      toId: targetId,
    })
      .then(() => {
        toast.success('✅ Koneksi berhasil dihapus!');
      })
      .catch(() => {
        toast.error('❌ Gagal menghapus koneksi!');
      });
  }, [removeConnectionMutation]);

  const handleDelete = async (id: Id<"strukturDivisiCrp">, nama: string) => {
    const confirmed = confirm(`Yakin ingin menghapus ${nama}?`);
    if (!confirmed) return;

    try {
      await deleteMutation({ id });
      toast.success(`✅ ${nama} berhasil dihapus!`);
    } catch (error) {
      toast.error('❌ Gagal menghapus staff!');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="max-w-10xl mx-auto p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                Struktur Divisi CRP
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={showHelp}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                title="Cara menggunakan"
              >
                ❓
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllConnections}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                title="Hapus semua koneksi"
              >
                🗑️
              </Button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              ✨ Drag card untuk geser • Drag dari titik ke titik untuk connect • Double-click garis untuk hapus
            </p>
          </div>
          <Button
            onClick={handleAdd}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Staff
          </Button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="max-w-full mx-5 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700" style={{ height: 'calc(100vh - 160px)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onEdgeDoubleClick={onEdgeDoubleClick}
          nodeTypes={nodeTypes}
          isValidConnection={isValidConnection}
          fitView
          attributionPosition="bottom-left"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls />
          <MiniMap
            nodeColor={() => '#10b981'}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>

      {/* Dialog Add/Edit Staff */}
      <StrukturDivisiCrpDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staff={selectedStaff}
        mode={dialogMode}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
