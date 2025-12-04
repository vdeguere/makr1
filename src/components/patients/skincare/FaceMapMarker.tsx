import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { X, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { iconMap } from "@/components/ui/icon-picker";
import { MarkerTypeManagementDialog } from "../ttm/MarkerTypeManagementDialog";

export interface FaceMarker {
  id: string;
  x: number;
  y: number;
  type: string;
  type_id?: string;
  label: string;
  severity?: number;
}

interface MarkerType {
  id: string;
  name: string;
  icon_name: string;
  color: string;
  description: string | null;
}

interface FaceMapMarkerProps {
  markers: FaceMarker[];
  onChange: (markers: FaceMarker[]) => void;
  side: 'front' | 'left' | 'right';
  disabled?: boolean;
}

// Simple face SVG - front view
const FaceFrontSVG = () => (
  <svg viewBox="0 0 200 250" className="w-full h-auto">
    {/* Face outline */}
    <ellipse cx="100" cy="125" rx="70" ry="90" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground/20" />
    {/* Forehead zone */}
    <ellipse cx="100" cy="60" rx="50" ry="25" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-primary/30" />
    {/* Left cheek */}
    <ellipse cx="60" cy="120" rx="25" ry="35" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-primary/30" />
    {/* Right cheek */}
    <ellipse cx="140" cy="120" rx="25" ry="35" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-primary/30" />
    {/* Nose */}
    <ellipse cx="100" cy="130" rx="8" ry="20" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-primary/30" />
    {/* Chin */}
    <ellipse cx="100" cy="190" rx="30" ry="20" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-primary/30" />
    {/* Jawline */}
    <path d="M 50 160 Q 50 200 100 210 Q 150 200 150 160" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-primary/30" />
  </svg>
);

// Simple face SVG - side profile view
const FaceSideSVG = () => (
  <svg viewBox="0 0 200 250" className="w-full h-auto">
    {/* Face outline - side profile */}
    <path d="M 50 50 Q 50 30 70 20 Q 90 15 110 20 Q 130 25 140 40 Q 145 60 140 80 Q 135 100 130 120 Q 125 140 120 160 Q 115 180 110 200 Q 105 220 100 230 Q 95 235 90 230 Q 85 220 80 200 Q 75 180 70 160 Q 65 140 60 120 Q 55 100 50 80 Q 45 60 50 50 Z" 
      fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground/20" />
    {/* Forehead zone */}
    <ellipse cx="100" cy="50" rx="30" ry="20" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-primary/30" />
    {/* Cheek zone */}
    <ellipse cx="110" cy="120" rx="25" ry="35" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-primary/30" />
    {/* Nose */}
    <ellipse cx="130" cy="100" rx="8" ry="15" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-primary/30" />
    {/* Chin */}
    <ellipse cx="100" cy="200" rx="20" ry="15" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-primary/30" />
    {/* Jawline */}
    <path d="M 70 160 Q 80 200 100 210 Q 120 200 130 160" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-primary/30" />
  </svg>
);

export function FaceMapMarker({ markers, onChange, side, disabled }: FaceMapMarkerProps) {
  const [markerTypes, setMarkerTypes] = useState<MarkerType[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [showDialog, setShowDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [pendingMarker, setPendingMarker] = useState<{ x: number; y: number } | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newSeverity, setNewSeverity] = useState<number>(5);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetchMarkerTypes();
  }, []);

  const fetchMarkerTypes = async () => {
    const { data } = await supabase
      .from('body_marker_types')
      .select('*')
      .order('is_system_default', { ascending: false })
      .order('name');

    if (data && data.length > 0) {
      setMarkerTypes(data);
      if (!selectedType) {
        setSelectedType(data[0].id);
      }
    }
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (disabled) return;
    
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPendingMarker({ x, y });
    setShowDialog(true);
  };

  const handleAddMarker = () => {
    if (!pendingMarker || !newLabel.trim() || !selectedType) return;

    const selectedMarkerType = markerTypes.find(t => t.id === selectedType);
    if (!selectedMarkerType) return;

    const newMarker: FaceMarker = {
      id: crypto.randomUUID(),
      x: pendingMarker.x,
      y: pendingMarker.y,
      type: selectedMarkerType.name,
      type_id: selectedMarkerType.id,
      label: newLabel.trim(),
      severity: newSeverity,
    };

    onChange([...markers, newMarker]);
    setShowDialog(false);
    setNewLabel('');
    setNewSeverity(5);
    setPendingMarker(null);
  };

  const handleRemoveMarker = (id: string) => {
    onChange(markers.filter(m => m.id !== id));
  };

  const getMarkerTypeFromMarker = (marker: FaceMarker) => {
    // Try to find by type_id first, then fall back to name matching
    if (marker.type_id) {
      return markerTypes.find(t => t.id === marker.type_id);
    }
    return markerTypes.find(t => t.name.toLowerCase() === marker.type.toLowerCase());
  };

  const getMarkerIcon = (marker: FaceMarker) => {
    const markerType = getMarkerTypeFromMarker(marker);
    const Icon = markerType ? iconMap[markerType.icon_name as keyof typeof iconMap] : iconMap.Circle;
    return Icon || iconMap.Circle;
  };

  const getMarkerColor = (marker: FaceMarker) => {
    const markerType = getMarkerTypeFromMarker(marker);
    return markerType?.color || 'text-red-500';
  };

  const getViewLabel = () => {
    switch (side) {
      case 'front':
        return 'Front View';
      case 'left':
        return 'Left Profile';
      case 'right':
        return 'Right Profile';
      default:
        return 'Face View';
    }
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
        {/* Left Column - Controls & Markers List */}
        <div className="space-y-4">
          {/* Marker Type Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Marker Type:</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowManageDialog(true)}
                disabled={disabled}
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Types
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {markerTypes.map((markerType) => {
                const Icon = iconMap[markerType.icon_name as keyof typeof iconMap] || iconMap.Circle;
                return (
                  <Button
                    key={markerType.id}
                    type="button"
                    variant={selectedType === markerType.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(markerType.id)}
                    disabled={disabled}
                    className="gap-2"
                  >
                    <Icon className={cn("h-4 w-4", selectedType === markerType.id ? "" : markerType.color)} />
                    {markerType.name}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Markers List */}
          {markers.length > 0 && (
            <div className="space-y-2">
              <Label>Marked Conditions:</Label>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {markers.map((marker) => {
                  const Icon = getMarkerIcon(marker);
                  const color = getMarkerColor(marker);
                  return (
                    <div
                      key={marker.id}
                      className="flex items-start gap-2 p-2 bg-muted rounded-lg"
                    >
                      <Icon className={cn("h-4 w-4 mt-0.5", color)} />
                      <div className="flex-1 text-sm">
                        <div className="font-medium">{marker.type}</div>
                        <div className="text-muted-foreground">{marker.label}</div>
                        {marker.severity && (
                          <div className="text-xs text-muted-foreground">Severity: {marker.severity}/10</div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMarker(marker.id)}
                        disabled={disabled}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {markers.length === 0 && (
            <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
              Click on the face diagram to add skin condition markers
            </div>
          )}
        </div>

        {/* Right Column - Face Diagram */}
        <div className="flex flex-col items-center justify-start">
          <div className="relative border border-border rounded-lg overflow-hidden bg-muted/30 w-full max-w-md">
            <svg
              ref={svgRef}
              viewBox="0 0 200 250"
              className="w-full h-auto cursor-crosshair max-h-[70vh]"
              onClick={handleSvgClick}
              style={{ aspectRatio: '4/5' }}
            >
              {/* Face diagram */}
              {side === 'front' ? <FaceFrontSVG /> : <FaceSideSVG />}

              {/* Render markers */}
              {markers.map((marker) => {
                const Icon = getMarkerIcon(marker);
                const color = getMarkerColor(marker);
                return (
                  <Tooltip key={marker.id} delayDuration={200}>
                    <TooltipTrigger asChild>
                      <g className="cursor-pointer">
                        <circle
                          cx={marker.x * 2}
                          cy={marker.y * 2.5}
                          r="8"
                          className={cn("fill-current", color)}
                          opacity="0.7"
                        />
                        <foreignObject
                          x={marker.x * 2 - 8}
                          y={marker.y * 2.5 - 8}
                          width="16"
                          height="16"
                          className="pointer-events-none"
                        >
                          <Icon className={cn("h-4 w-4", color)} />
                        </foreignObject>
                      </g>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-3 w-3", color)} />
                          <span className="text-xs font-semibold">{marker.type}</span>
                        </div>
                        <p className="text-xs">{marker.label}</p>
                        {marker.severity && (
                          <p className="text-xs text-muted-foreground">
                            Severity: {marker.severity}/10
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </svg>
            
            <div className="absolute top-2 left-2 bg-background/90 p-2 rounded text-xs font-medium">
              {getViewLabel()}
            </div>
          </div>
        </div>
      </div>

      {/* Add Marker Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Skin Condition Marker</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="marker-label">Description *</Label>
              <Textarea
                id="marker-label"
                placeholder="Describe the skin condition (e.g., Active breakout on left cheek)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity">Severity: {newSeverity}/10</Label>
              <Input
                id="severity"
                type="range"
                min="1"
                max="10"
                value={newSeverity}
                onChange={(e) => setNewSeverity(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddMarker} disabled={!newLabel.trim()}>
              Add Marker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Marker Type Management Dialog */}
      <MarkerTypeManagementDialog
        open={showManageDialog}
        onOpenChange={setShowManageDialog}
        onTypesUpdated={fetchMarkerTypes}
      />
    </TooltipProvider>
  );
}

