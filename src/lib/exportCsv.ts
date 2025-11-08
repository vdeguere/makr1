// CSV Export Utilities

export interface ExportColumn {
  key: string;
  header: string;
  formatter?: (value: any) => string;
}

export const exportToCSV = (
  data: any[],
  columns: ExportColumn[],
  filename: string
) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Create CSV header
  const headers = columns.map(col => col.header).join(',');
  
  // Create CSV rows
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key];
      
      // Apply formatter if provided
      if (col.formatter) {
        value = col.formatter(value);
      }
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }
      
      // Convert to string and escape quotes
      const stringValue = String(value);
      
      // Wrap in quotes if contains comma, newline, or quote
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    }).join(',');
  });
  
  // Combine header and rows
  const csv = [headers, ...rows].join('\n');
  
  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Format currency for export
export const formatCurrencyForExport = (value: number, currency: string = 'THB'): string => {
  return `${value.toFixed(2)} ${currency}`;
};

// Format date for export
export const formatDateForExport = (date: string | Date): string => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format percentage for export
export const formatPercentageForExport = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

// Export multiple sheets (creates separate files)
export const exportMultipleToCSV = (
  exports: Array<{
    data: any[];
    columns: ExportColumn[];
    filename: string;
  }>
) => {
  exports.forEach(exp => {
    exportToCSV(exp.data, exp.columns, exp.filename);
  });
};
