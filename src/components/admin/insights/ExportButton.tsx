import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet } from 'lucide-react';
import { exportToCSV, ExportColumn } from '@/lib/exportCsv';

interface ExportOption {
  label: string;
  data: any[];
  columns: ExportColumn[];
  filename: string;
}

interface ExportButtonProps {
  options: ExportOption[];
  disabled?: boolean;
}

export function ExportButton({ options, disabled }: ExportButtonProps) {
  const handleExport = (option: ExportOption) => {
    exportToCSV(option.data, option.columns, option.filename);
  };

  const handleExportAll = () => {
    options.forEach(option => {
      exportToCSV(option.data, option.columns, option.filename);
    });
  };

  if (options.length === 1) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport(options[0])}
        disabled={disabled || !options[0].data || options[0].data.length === 0}
      >
        <Download className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => handleExport(option)}
            disabled={!option.data || option.data.length === 0}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {option.label}
          </DropdownMenuItem>
        ))}
        {options.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportAll}>
              <Download className="mr-2 h-4 w-4" />
              Export All
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
