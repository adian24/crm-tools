"use client";

import React, { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Save, X, Loader2, Palette } from 'lucide-react';

interface ConnectionEditDialogStrukturProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromId: Id<"strukturDivisiCrp">;
  toId: Id<"strukturDivisiCrp">;
  fromName: string;
  toName: string;
  currentConnection?: {
    targetId: Id<"strukturDivisiCrp">;
    type?: string;
    label?: string;
    color?: string;
    routing?: string;
    controlPoints?: Array<{ x: number; y: number }>;
    verticalOffset?: number;
  };
  onSuccess?: () => void;
}

// Connection type options with descriptions
const CONNECTION_TYPES = [
  { value: "solid", label: "Solid", description: "Hubungan langsung" },
  { value: "dashed", label: "Dashed", description: "Hubungan tidak langsung" },
  { value: "dotted", label: "Dotted", description: "Hubungan longgar" },
];

// Routing style options
const ROUTING_STYLES = [
  {
    value: "straight",
    label: "Straight",
    description: "Garis lurus langsung",
    icon: "╶"
  },
  {
    value: "orgchart",
    label: "Org Chart",
    description: "Garis struktur organisasi (bawah → samping → bawah)",
    icon: "┴"
  },
  {
    value: "free",
    label: "Free/Curve",
    description: "Garis melengkung bebas",
    icon: "〜"
  },
  {
    value: "siku",
    label: "Siku/Orthogonal",
    description: "Garis siku dengan elbow yang bisa ditambah/digeser",
    icon: "└"
  },
  {
    value: "custom",
    label: "Custom",
    description: "Garis custom dengan control points",
    icon: "✥"
  },
];

// Connection label options
const CONNECTION_LABELS = [
  { value: "reporting", label: "Reporting", color: "#3b82f6", description: "Hubungan pelaporan" },
  { value: "collaboration", label: "Collaboration", color: "#8b5cf6", description: "Hubungan kolaborasi" },
  { value: "communication", label: "Communication", color: "#ec4899", description: "Hubungan komunikasi" },
  { value: "dependency", label: "Dependency", color: "#f59e0b", description: "Hubungan ketergantungan" },
];

const ConnectionEditDialogStruktur = ({
  open,
  onOpenChange,
  fromId,
  toId,
  fromName,
  toName,
  currentConnection,
  onSuccess
}: ConnectionEditDialogStrukturProps) => {
  const updateMutation = useMutation(api.strukturDivisiCrp.updateConnection);

  // Form state
  const [formData, setFormData] = useState({
    type: 'solid',
    label: 'reporting',
    color: '#3b82f6',
    routing: 'straight' as 'straight' | 'orgchart' | 'free' | 'siku' | 'custom',
    controlPoints: [] as Array<{ x: number; y: number }>,
    verticalOffset: 0,
  });

  const [isSaving, setIsSaving] = useState(false);

  // Reset form when dialog opens or currentConnection changes
  useEffect(() => {
    if (open) {
      setFormData({
        type: currentConnection?.type || 'solid',
        label: currentConnection?.label || 'reporting',
        color: currentConnection?.color || '#3b82f6',
        routing: (currentConnection?.routing as any) || 'straight',
        controlPoints: currentConnection?.controlPoints || [],
        verticalOffset: currentConnection?.verticalOffset || 0,
      });
    }
  }, [open, currentConnection]);

  // Update color when label changes
  useEffect(() => {
    const selectedLabel = CONNECTION_LABELS.find(l => l.value === formData.label);
    if (selectedLabel && !currentConnection?.color) {
      setFormData(prev => ({ ...prev, color: selectedLabel.color }));
    }
  }, [formData.label, currentConnection]);

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await updateMutation({
        fromId,
        toId,
        type: formData.type,
        label: formData.label,
        color: formData.color,
        routing: formData.routing,
        controlPoints: formData.routing === 'custom' ? formData.controlPoints : undefined,
        verticalOffset: formData.routing === 'orgchart' ? formData.verticalOffset : undefined,
      });

      toast.success('✅ Koneksi berhasil diupdate!');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('❌ Gagal mengupdate koneksi!');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper functions for control points
  const addControlPoint = () => {
    setFormData(prev => ({
      ...prev,
      controlPoints: [...prev.controlPoints, { x: 0, y: 0 }],
    }));
  };

  const removeControlPoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      controlPoints: prev.controlPoints.filter((_, i) => i !== index),
    }));
  };

  const updateControlPoint = (index: number, field: 'x' | 'y', value: number) => {
    setFormData(prev => ({
      ...prev,
      controlPoints: prev.controlPoints.map((cp, i) =>
        i === index ? { ...cp, [field]: value } : cp
      ),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            🔗 Edit Koneksi
          </DialogTitle>
          <DialogDescription>
            {fromName} ↔ {toName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Tipe Garis */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Tipe Garis
            </Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Pilih tipe garis" />
              </SelectTrigger>
              <SelectContent>
                {CONNECTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-16 h-0.5 border-t-2 ${
                        type.value === 'solid' ? 'border-solid' :
                        type.value === 'dashed' ? 'border-dashed' :
                        'border-dotted'
                      }`} />
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-slate-500">{type.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Routing Style */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Gaya Routing
            </Label>
            <Select value={formData.routing} onValueChange={(value) => setFormData(prev => ({ ...prev, routing: value as any }))}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Pilih gaya routing" />
              </SelectTrigger>
              <SelectContent>
                {ROUTING_STYLES.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-mono">{style.icon}</div>
                      <div>
                        <div className="font-medium">{style.label}</div>
                        <div className="text-xs text-slate-500">{style.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Label Koneksi */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Jenis Hubungan
            </Label>
            <Select value={formData.label} onValueChange={(value) => setFormData(prev => ({ ...prev, label: value }))}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Pilih jenis hubungan" />
              </SelectTrigger>
              <SelectContent>
                {CONNECTION_LABELS.map((label) => (
                  <SelectItem key={label.value} value={label.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-slate-200"
                        style={{ backgroundColor: label.color }}
                      />
                      <div>
                        <div className="font-medium">{label.label}</div>
                        <div className="text-xs text-slate-500">{label.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vertical Offset - Only show for orgchart routing */}
          {formData.routing === 'orgchart' && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Tinggi Garis Org Chart
              </Label>
              <div className="flex gap-4 items-center">
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={formData.verticalOffset || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, verticalOffset: Number(e.target.value) }))}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                />
                <Input
                  type="number"
                  value={formData.verticalOffset || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, verticalOffset: Number(e.target.value) }))}
                  className="w-24 text-sm text-center"
                  min="0"
                  max="5000"
                  step="10"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atur tinggi garis horizontal. 0 = otomatis di tengah. Bisa diatur 10-5000px.
              </p>
            </div>
          )}

          {/* Custom Color */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Warna Garis
            </Label>
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                placeholder="#3b82f6"
                className="flex-1 text-sm"
              />
              {/* Preview */}
              <div className="w-24 h-10 rounded border-2 border-slate-200" style={{ backgroundColor: formData.color }} />
            </div>

            {/* Quick color presets */}
            <div className="flex gap-2 flex-wrap mt-2">
              {CONNECTION_LABELS.map((label) => (
                <button
                  key={label.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: label.color }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === label.color
                      ? 'border-slate-900 scale-110 shadow-lg'
                      : 'border-slate-200 hover:scale-105'
                  }`}
                  style={{ backgroundColor: label.color }}
                  title={label.label}
                />
              ))}
            </div>
          </div>

          {/* Control Points - Only show for custom routing */}
          {formData.routing === 'custom' && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  Control Points
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addControlPoint}
                  className="cursor-pointer text-xs"
                >
                  + Tambah Point
                </Button>
              </div>

              {formData.controlPoints.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Belum ada control points. Klik "Tambah Point" untuk menambahkan.
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {formData.controlPoints.map((point, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <span className="text-xs font-semibold text-slate-600 w-16">Point {index + 1}</span>
                      <div className="flex-1 flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs text-slate-500">X</Label>
                          <Input
                            type="number"
                            value={point.x}
                            onChange={(e) => updateControlPoint(index, 'x', Number(e.target.value))}
                            className="text-sm h-8"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-slate-500">Y</Label>
                          <Input
                            type="number"
                            value={point.y}
                            onChange={(e) => updateControlPoint(index, 'y', Number(e.target.value))}
                            className="text-sm h-8"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeControlPoint(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer h-8 w-8 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preview Line */}
          <div className="pt-4 border-t">
            <Label className="text-sm font-semibold mb-2 block">
              Preview
            </Label>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
              <svg className="w-full h-16" viewBox="0 0 200 50">
                {/* Straight */}
                {formData.routing === 'straight' && (
                  <line
                    x1="10" y1="25" x2="190" y2="25"
                    stroke={formData.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={
                      formData.type === 'dashed' ? '10,5' :
                      formData.type === 'dotted' ? '2,4' :
                      'none'
                    }
                  />
                )}
                {/* Org Chart */}
                {formData.routing === 'orgchart' && (
                  <path
                    d={
                      formData.verticalOffset && formData.verticalOffset > 0
                        ? `M 10 25 L 10 ${25 + Math.min(formData.verticalOffset / 10, 20)} L 190 ${25 + Math.min(formData.verticalOffset / 10, 20)} L 190 25`
                        : `M 10 25 L 10 32 L 190 32 L 190 25` // Default: 70/30 ratio
                    }
                    stroke={formData.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={
                      formData.type === 'dashed' ? '10,5' :
                      formData.type === 'dotted' ? '2,4' :
                      'none'
                    }
                  />
                )}
                {/* Free/Curve */}
                {formData.routing === 'free' && (
                  <path
                    d="M 10 25 Q 100 5, 190 25"
                    stroke={formData.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={
                      formData.type === 'dashed' ? '10,5' :
                      formData.type === 'dotted' ? '2,4' :
                      'none'
                    }
                  />
                )}
                {/* Siku/Orthogonal */}
                {formData.routing === 'siku' && (
                  <path
                    d="M 10 25 L 100 25 L 100 5 L 190 5"
                    stroke={formData.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={
                      formData.type === 'dashed' ? '10,5' :
                      formData.type === 'dotted' ? '2,4' :
                      'none'
                    }
                  />
                )}
                {/* Custom with Control Points */}
                {formData.routing === 'custom' && formData.controlPoints.length > 0 && (
                  <path
                    d={`M 10 25 ${formData.controlPoints.map((p, i) => {
                      // Scale control points to preview coordinates
                      const x = 10 + (p.x / 1000) * 180;
                      const y = 25 + (p.y / 600) * 0;
                      return `L ${x} ${y}`;
                    }).join(' ')} L 190 25`}
                    stroke={formData.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={
                      formData.type === 'dashed' ? '10,5' :
                      formData.type === 'dotted' ? '2,4' :
                      'none'
                    }
                  />
                )}
                {formData.routing === 'custom' && formData.controlPoints.length > 0 && (
                  formData.controlPoints.map((p, i) => {
                    const x = 10 + (p.x / 1000) * 180;
                    const y = 25;
                    return <circle key={i} cx={x} cy={y} r="4" fill={formData.color} />;
                  })
                )}
                <circle cx="10" cy={formData.routing === 'orgchart' ? 25 : formData.routing === 'siku' ? 25 : 25} r="6" fill={formData.color} />
                <circle cx="190" cy={formData.routing === 'orgchart' ? 25 : formData.routing === 'siku' ? 5 : 25} r="6" fill={formData.color} />
              </svg>
              <div className="text-center text-xs text-slate-600 dark:text-slate-400 mt-2">
                {fromName} ↔ {toName}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="cursor-pointer"
          >
            <X className="w-4 h-4 mr-2" />
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="cursor-pointer bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Simpan
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { ConnectionEditDialogStruktur };
