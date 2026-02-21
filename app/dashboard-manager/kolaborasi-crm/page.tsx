"use client";

import React, { useState, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { KolaborasiCrmDialog } from '@/components/kolaborasi-crm-dialog';
import { ConnectionEditDialog } from '@/components/connection-edit-dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Users, Settings } from 'lucide-react';

// Draggable Card Component
interface DraggableCardProps {
  staff: Staff;
  onEdit: (staff: Staff) => void;
  onDelete: (id: Id<"kolaborasiCrm">, nama: string) => void;
  onDragEnd: (id: Id<"kolaborasiCrm">, position: { x: number; y: number }) => void;
  onCardClick?: (id: Id<"kolaborasiCrm">) => void;
  isConnectMode?: boolean;
  isSelected?: boolean;
}

function DraggableCard({ staff, onEdit, onDelete, onDragEnd, onCardClick, isConnectMode, isSelected }: DraggableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: staff.positionX, y: staff.positionY });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on header, not buttons
    if ((e.target as HTMLElement).closest('button')) return;

    if (!isConnectMode) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleCardClick = () => {
    if (isConnectMode && onCardClick) {
      onCardClick(staff._id);
    }
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onDragEnd(staff._id, position);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, position, staff._id, onDragEnd, isConnectMode]);

  // Update position when staff prop changes
  React.useEffect(() => {
    setPosition({ x: staff.positionX, y: staff.positionY });
  }, [staff.positionX, staff.positionY]);

  return (
    <div
      ref={cardRef}
      onMouseDown={handleMouseDown}
      onClick={handleCardClick}
      className={`absolute bg-white dark:bg-slate-800 rounded-xl shadow-xl border-2 transition-all duration-200 w-72 ${
        isConnectMode
          ? 'cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-2xl hover:scale-105'
          : 'cursor-move'
      } ${
        isDragging ? 'shadow-2xl scale-105 z-50' : ''
      } ${
        isSelected
          ? 'border-purple-500 ring-4 ring-purple-200 dark:ring-purple-800 z-40'
          : 'border-slate-200 dark:border-slate-700'
      }`}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Card Header - Draggable area */}
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-t-xl p-6 cursor-move">
        <div className="flex flex-col items-center gap-4">
          {staff.fotoUrl ? (
            <img
              src={staff.fotoUrl}
              alt={staff.nama}
              className="w-28 h-28 rounded-full border-4 border-white shadow-2xl object-cover"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30">
              <Users className="w-14 h-14 text-white" />
            </div>
          )}
          <div className="text-center flex-1 w-full">
            <h3 className="text-xl font-bold text-white truncate">{staff.nama}</h3>
            <p className="text-sm text-blue-100 truncate">{staff.jabatan}</p>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3">
        {/* Job Desk */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Job Deskripsi ({staff.jobDesk.length})
          </h4>
          <ul className="space-y-1">
            {staff.jobDesk.map((jd, idx) => (
              <li
                key={idx}
                className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2"
              >
                <span className="text-blue-500 font-bold">•</span>
                <span className="flex-1">{jd}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Keterangan */}
        {staff.keterangan && (
          <div className="text-xs text-slate-500 dark:text-slate-500 italic">
            "{staff.keterangan}"
          </div>
        )}
      </div>

      {/* Card Footer - Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(staff);
          }}
          className="flex-1 cursor-pointer text-xs h-8"
        >
          <Edit className="w-3 h-3 mr-1" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(staff._id, staff.nama);
          }}
          className="flex-1 cursor-pointer text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Hapus
        </Button>
      </div>
    </div>
  );
}

interface Staff {
  _id: Id<"kolaborasiCrm">;
  nama: string;
  fotoUrl?: string;
  jabatan: string;
  jobDesk: string[];
  positionX: number;
  positionY: number;
  connections: Array<{
    targetId: Id<"kolaborasiCrm">;
    type?: string;
    label?: string;
    color?: string;
    routing?: string;
  }>;
  keterangan?: string;
  isActive: boolean;
  createdAt: string | number;
  updatedAt: string | number;
}

export default function KolaborasiCrmPage() {
  const allStaff = useQuery(api.kolaborasiCrm.getAllStaff);
  const deleteMutation = useMutation(api.kolaborasiCrm.deleteStaff);
  const updatePositionMutation = useMutation(api.kolaborasiCrm.updateStaffPosition);
  const addConnectionMutation = useMutation(api.kolaborasiCrm.addConnection);
  const removeConnectionMutation = useMutation(api.kolaborasiCrm.removeConnection);
  const migrateMutation = useMutation(api.kolaborasiCrm.migrateConnections);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isConnectMode, setIsConnectMode] = useState(false);
  const [selectedForConnection, setSelectedForConnection] = useState<Id<"kolaborasiCrm"> | null>(null);

  // Connection edit dialog state
  const [connectionEditOpen, setConnectionEditOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<{
    fromId: Id<"kolaborasiCrm">;
    toId: Id<"kolaborasiCrm">;
    fromName: string;
    toName: string;
    connection?: {
      targetId: Id<"kolaborasiCrm">;
      type?: string;
      label?: string;
      color?: string;
    };
  } | null>(null);

  const handleAdd = () => {
    setDialogMode('add');
    setSelectedStaff(null);
    setDialogOpen(true);
  };

  const handleEdit = (staff: Staff) => {
    setDialogMode('edit');
    setSelectedStaff(staff);
    setDialogOpen(true);
  };

  const handleDelete = async (id: Id<"kolaborasiCrm">, nama: string) => {
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

  const handleDragStop = async (staffId: Id<"kolaborasiCrm">, newPosition: { x: number; y: number }) => {
    try {
      await updatePositionMutation({
        id: staffId,
        positionX: newPosition.x,
        positionY: newPosition.y,
      });
    } catch (error) {
      toast.error('❌ Gagal menyimpan posisi!');
      console.error(error);
    }
  };

  const handleCardClick = async (staffId: Id<"kolaborasiCrm">) => {
    if (!isConnectMode) return;

    if (!selectedForConnection) {
      // First card selected
      setSelectedForConnection(staffId);
      toast.info('🔗 Pilih card kedua untuk membuat garis');
    } else {
      // Second card selected - create connection
      if (selectedForConnection === staffId) {
        toast.error('❌ Tidak bisa connect ke diri sendiri!');
        setSelectedForConnection(null);
        return;
      }

      try {
        await addConnectionMutation({
          fromId: selectedForConnection,
          toId: staffId,
          type: 'solid',
          label: 'collaboration',
          color: '#8b5cf6',
          routing: 'straight',
        });
        toast.success('✅ Garis berhasil dibuat!');
        setSelectedForConnection(null);
      } catch (error: any) {
        toast.error(`❌ ${error.message}`);
        setSelectedForConnection(null);
      }
    }
  };

  const handleEditConnection = (
    fromId: Id<"kolaborasiCrm">,
    toId: Id<"kolaborasiCrm">,
    connection?: any
  ) => {
    const fromStaff = allStaff?.find(s => s._id === fromId);
    const toStaff = allStaff?.find(s => s._id === toId);

    if (!fromStaff || !toStaff) return;

    setSelectedConnection({
      fromId,
      toId,
      fromName: fromStaff.nama,
      toName: toStaff.nama,
      connection,
    });
    setConnectionEditOpen(true);
  };

  const handleRemoveConnection = async (fromId: Id<"kolaborasiCrm">, toId: Id<"kolaborasiCrm">) => {
    try {
      await removeConnectionMutation({ fromId, toId });
      toast.success('✅ Garis berhasil dihapus!');
    } catch (error) {
      toast.error('❌ Gagal menghapus garis!');
      console.error(error);
    }
  };

  // Helper function to calculate path based on routing style
  const calculatePath = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    routing: string
  ) => {
    switch (routing) {
      case 'free':
        // Bezier curve
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2 - 50; // Curve upward
        return `M ${fromX} ${fromY} Q ${midX} ${midY}, ${toX} ${toY}`;

      case 'siku':
        // Orthogonal: horizontal then vertical (or vice versa)
        const midPointX = (fromX + toX) / 2;
        return `M ${fromX} ${fromY} L ${midPointX} ${fromY} L ${midPointX} ${toY} L ${toX} ${toY}`;

      case 'straight':
      default:
        // Straight line - return null to use line element
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              Kolaborasi CRM
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Atur struktur tim dan job deskripsi • Geser card untuk mengatur posisi
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={async () => {
                try {
                  const result = await migrateMutation();
                  toast.success(`✅ Migration berhasil! ${result.migrated} staff di-update`);
                } catch (error) {
                  toast.error('❌ Migration gagal!');
                  console.error(error);
                }
              }}
              variant="outline"
              className="cursor-pointer border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              🔄 Migrate Data
            </Button>
            <Button
              onClick={() => {
                setIsConnectMode(!isConnectMode);
                setSelectedForConnection(null);
                toast.info(isConnectMode ? '❌ Mode Connect dimatikan' : '🔗 Mode Connect aktif - Klik 2 card untuk membuat garis');
              }}
              variant={isConnectMode ? "default" : "outline"}
              className={isConnectMode
                ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg cursor-pointer"
                : "cursor-pointer border-purple-300 text-purple-700 hover:bg-purple-50"
              }
            >
              🔗 {isConnectMode ? 'Mode Connect Aktif' : 'Connect Mode'}
            </Button>
            <Button
              onClick={handleAdd}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Staff
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
            <div className="text-xs font-semibold text-blue-100 mb-1">Total Staff</div>
            <div className="text-2xl font-bold">{allStaff?.length || 0}</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
            <div className="text-xs font-semibold text-emerald-100 mb-1">Total Job Desk</div>
            <div className="text-2xl font-bold">
              {allStaff?.reduce((acc, staff) => acc + staff.jobDesk.length, 0) || 0}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <div className="text-xs font-semibold text-purple-100 mb-1">Jabatan Unik</div>
            <div className="text-2xl font-bold">
              {new Set(allStaff?.map(s => s.jabatan) || []).size}
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Area for Draggable Cards */}
      <div className="max-w-full mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div
          className="relative"
          style={{
            width: '100%',
            height: '800px',
            backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          {/* SVG Lines Layer */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }}
          >
            {allStaff?.map((staff) =>
              staff.connections?.map((connection) => {
                // Handle both old format (ID) and new format (object)
                const connectionId = typeof connection === 'object' ? connection.targetId : connection;
                const connectionData = typeof connection === 'object' ? connection : undefined;

                const connectedStaff = allStaff.find(s => s._id === connectionId);
                if (!connectedStaff) return null;

                // Only draw line once (from lower ID to higher ID)
                if (staff._id > connectionId) return null;

                // Calculate center points of cards
                const fromX = staff.positionX + 144; // 288px card width / 2
                const fromY = staff.positionY + 100; // Approximate center
                const toX = connectedStaff.positionX + 144;
                const toY = connectedStaff.positionY + 100;

                // Get connection style properties
                const lineType = connectionData?.type || 'solid';
                const lineColor = connectionData?.color || '#8b5cf6';
                const lineLabel = connectionData?.label || 'collaboration';
                const routing = connectionData?.routing || 'straight';

                // Calculate stroke dasharray based on type
                const strokeDasharray =
                  lineType === 'dashed' ? '10,5' :
                  lineType === 'dotted' ? '2,4' :
                  'none';

                // Calculate path based on routing
                const pathData = calculatePath(fromX, fromY, toX, toY, routing);

                // Calculate midpoint for buttons and labels
                const midX = (fromX + toX) / 2;
                const midY = (fromY + toY) / 2;

                return (
                  <g key={`${staff._id}-${connectionId}`}>
                    {/* Line or Path */}
                    {pathData ? (
                      <path
                        d={pathData}
                        stroke={lineColor}
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray={strokeDasharray}
                      />
                    ) : (
                      <line
                        x1={fromX}
                        y1={fromY}
                        x2={toX}
                        y2={toY}
                        stroke={lineColor}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={strokeDasharray}
                      />
                    )}

                    {/* Remove button on line */}
                    <foreignObject
                      x={midX - 30}
                      y={midY - 12}
                      width="60"
                      height="24"
                      className="pointer-events-auto"
                    >
                      <div className="flex gap-1 items-center justify-center">
                        {/* Edit button */}
                        <button
                          onClick={() => handleEditConnection(staff._id, connectionId, connectionData)}
                          className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg cursor-pointer"
                          title="Edit koneksi"
                        >
                          <Settings className="w-3 h-3" />
                        </button>
                        {/* Delete button */}
                        <button
                          onClick={() => handleRemoveConnection(staff._id, connectionId)}
                          className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg cursor-pointer"
                          title="Hapus garis"
                        >
                          ×
                        </button>
                      </div>
                    </foreignObject>

                    {/* Connection label badge */}
                    {lineLabel && (
                      <foreignObject
                        x={midX - 40}
                        y={midY - 40}
                        width="80"
                        height="20"
                        className="pointer-events-auto"
                      >
                        <div
                      className="text-[10px] font-semibold text-white px-2 py-0.5 rounded-full text-center whitespace-nowrap"
                      style={{ backgroundColor: lineColor }}
                    >
                      {lineLabel}
                    </div>
                  </foreignObject>
                )}
                  </g>
                );
              })
            )}
          </svg>

          {allStaff && allStaff.length > 0 ? (
            allStaff.map((staff) => (
              <DraggableCard
                key={staff._id}
                staff={staff}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDragEnd={handleDragStop}
                onCardClick={handleCardClick}
                isConnectMode={isConnectMode}
                isSelected={selectedForConnection === staff._id}
              />
            ))
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Belum ada data staff
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
                  Klik tombol "Tambah Staff" untuk memulai
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog */}
      <KolaborasiCrmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staff={selectedStaff}
        mode={dialogMode}
        onSuccess={() => {
          setDialogOpen(false);
          setSelectedStaff(null);
        }}
      />

      {/* Connection Edit Dialog */}
      {selectedConnection && (
        <ConnectionEditDialog
          open={connectionEditOpen}
          onOpenChange={setConnectionEditOpen}
          fromId={selectedConnection.fromId}
          toId={selectedConnection.toId}
          fromName={selectedConnection.fromName}
          toName={selectedConnection.toName}
          currentConnection={selectedConnection.connection}
          onSuccess={() => {
            setConnectionEditOpen(false);
            setSelectedConnection(null);
          }}
        />
      )}
    </div>
  );
}
