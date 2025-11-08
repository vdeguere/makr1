import { cn } from "@/lib/utils";

interface PulseGridCell {
  selected: boolean;
  state: 'normal' | 'excess' | 'deficient' | 'slippery' | 'wiry' | 'choppy';
  notes?: string;
}

export interface PulseGridData {
  gridType: string;
  cells: Record<string, PulseGridCell>;
  labels: {
    rows: string[];
    cols: string[];
  };
}

interface PulseGridInputProps {
  value: PulseGridData;
  onChange: (value: PulseGridData) => void;
  label: string;
  disabled?: boolean;
}

const stateColors = {
  normal: 'bg-muted hover:bg-muted/80',
  excess: 'bg-red-500/20 hover:bg-red-500/30 border-red-500',
  deficient: 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500',
  slippery: 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-500',
  wiry: 'bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500',
  choppy: 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-500',
};

export function PulseGridInput({ value, onChange, label, disabled }: PulseGridInputProps) {
  const handleCellClick = (row: number, col: number) => {
    if (disabled) return;
    
    const cellKey = `${row}-${col}`;
    const currentCell = value.cells[cellKey] || { selected: false, state: 'normal' };
    
    // Cycle through states
    const states: PulseGridCell['state'][] = ['normal', 'excess', 'deficient', 'slippery', 'wiry', 'choppy'];
    const currentIndex = states.indexOf(currentCell.state);
    const nextState = currentCell.selected ? states[(currentIndex + 1) % states.length] : 'excess';
    
    const updatedCells = {
      ...value.cells,
      [cellKey]: {
        ...currentCell,
        selected: true,
        state: nextState,
      },
    };

    onChange({
      ...value,
      cells: updatedCells,
    });
  };

  const handleCellRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    if (disabled) return;
    
    const cellKey = `${row}-${col}`;
    const updatedCells = { ...value.cells };
    delete updatedCells[cellKey];
    
    onChange({
      ...value,
      cells: updatedCells,
    });
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="inline-block border border-border rounded-lg p-4 bg-background">
        <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${value.labels.cols.length}, 1fr)` }}>
          {/* Header row */}
          <div className="w-20" />
          {value.labels.cols.map((col, idx) => (
            <div key={idx} className="text-center text-xs font-medium p-2 min-w-[60px]">
              {col}
            </div>
          ))}
          
          {/* Grid rows */}
          {value.labels.rows.map((row, rowIdx) => (
            <>
              <div key={`label-${rowIdx}`} className="text-xs font-medium p-2 flex items-center justify-end pr-3">
                {row}
              </div>
              {value.labels.cols.map((_, colIdx) => {
                const cellKey = `${rowIdx}-${colIdx}`;
                const cell = value.cells[cellKey];
                const state = cell?.state || 'normal';
                
                return (
                  <button
                    key={cellKey}
                    type="button"
                    onClick={() => handleCellClick(rowIdx, colIdx)}
                    onContextMenu={(e) => handleCellRightClick(e, rowIdx, colIdx)}
                    disabled={disabled}
                    className={cn(
                      "aspect-square rounded border-2 transition-all min-w-[60px]",
                      cell?.selected ? stateColors[state] : "bg-muted/50 hover:bg-muted border-border",
                      disabled && "cursor-not-allowed opacity-50"
                    )}
                    title={cell?.selected ? state : "Click to mark"}
                  />
                );
              })}
            </>
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs font-medium mb-2">Legend (Right-click to clear):</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {Object.entries(stateColors).map(([state, color]) => (
              <div key={state} className="flex items-center gap-2">
                <div className={cn("w-4 h-4 rounded border-2", color)} />
                <span className="capitalize">{state}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
