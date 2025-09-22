import * as XLSX from 'xlsx';

interface AnalysisResult {
  total_rows: number;
  assigned_count: number;
  assigned_pct: number;
  overdue_count: number;
  overdue_pct_of_assigned: number;
  today_iso: string;
  timezone: string;
  columns_used: {
    action: string;
    due_date: string;
  };
  notes: string[];
}

// Get today's date in Asia/Kolkata timezone
const getTodayInKolkata = (): Date => {
  const now = new Date();
  // Convert to Asia/Kolkata timezone
  const kolkataTime = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
  
  return new Date(kolkataTime + 'T00:00:00');
};

// Check if action is assigned
const isActionAssigned = (value: any): boolean => {
  if (value === null || value === undefined || value === '') return false;
  
  const stringValue = String(value).toLowerCase().trim();
  
  // Check for positive indicators
  const positiveIndicators = ['yes', 'true', 'assigned', 'done', '1'];
  if (positiveIndicators.includes(stringValue)) return true;
  
  // Check for negative indicators
  const negativeIndicators = ['no', 'false', 'unassigned', '0'];
  if (negativeIndicators.includes(stringValue)) return false;
  
  // If it's not empty and not a negative indicator, treat as assigned
  return stringValue !== '';
};

// Parse date from various formats
const parseDate = (value: any): Date | null => {
  if (!value) return null;
  
  // If it's already a Date object
  if (value instanceof Date) return value;
  
  // If it's an Excel serial number
  if (typeof value === 'number') {
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Try to parse string dates
  const stringValue = String(value).trim();
  if (!stringValue) return null;
  
  // Common date formats
  const dateFormats = [
    // ISO format
    /^\d{4}-\d{2}-\d{2}$/,
    // US format
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    // European format
    /^\d{1,2}-\d{1,2}-\d{4}$/,
    // Dot format
    /^\d{1,2}\.\d{1,2}\.\d{4}$/
  ];
  
  const parsedDate = new Date(stringValue);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }
  
  return null;
};

// Find column indices by looking for headers
const findColumns = (worksheet: XLSX.WorkSheet): { action: string; due_date: string } => {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z1');
  let actionCol = '';
  let dueDateCol = '';
  
  // Look in the first few rows for headers
  for (let row = 0; row <= Math.min(5, range.e.r); row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      
      if (cell && cell.v) {
        const headerValue = String(cell.v).toLowerCase().trim();
        const colLetter = XLSX.utils.encode_col(col);
        
        // Look for action column
        if (!actionCol && (
          headerValue.includes('action') ||
          headerValue.includes('assigned') ||
          headerValue.includes('status') ||
          headerValue.includes('task')
        )) {
          actionCol = colLetter;
        }
        
        // Look for due date column
        if (!dueDateCol && (
          headerValue.includes('due') ||
          headerValue.includes('date') ||
          headerValue.includes('deadline') ||
          headerValue.includes('target')
        )) {
          dueDateCol = colLetter;
        }
      }
    }
  }
  
  // Default to A and B if not found
  return {
    action: actionCol || 'A',
    due_date: dueDateCol || 'B'
  };
};

export const analyzeExcelFile = async (file: File): Promise<{ result: AnalysisResult; summary: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        if (!worksheet) {
          throw new Error('No worksheet found in the Excel file');
        }
        
        // Find column indices
        const columns = findColumns(worksheet);
        
        // Convert worksheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Remove empty rows and header row(s)
        const dataRows = jsonData.slice(1).filter((row: any) => 
          row && row.length > 0 && row.some((cell: any) => cell !== null && cell !== undefined && cell !== '')
        ) as any[][];
        
        const today = getTodayInKolkata();
        const todayISO = today.toISOString().split('T')[0];
        
        let assignedCount = 0;
        let overdueCount = 0;
        const notes: string[] = [];
        
        // Get column indices
        const actionColIndex = XLSX.utils.decode_col(columns.action);
        const dueDateColIndex = XLSX.utils.decode_col(columns.due_date);
        
        // Check if Action column exists
        const hasActionData = dataRows.some(row => 
          row[actionColIndex] !== undefined && row[actionColIndex] !== null && row[actionColIndex] !== ''
        );
        
        if (!hasActionData) {
          throw new Error('Action column is missing or empty');
        }
        
        // Check if Due Date column exists
        const hasDueDateData = dataRows.some(row => 
          row[dueDateColIndex] !== undefined && row[dueDateColIndex] !== null && row[dueDateColIndex] !== ''
        );
        
        if (!hasDueDateData) {
          notes.push('Due Date column is missing or empty - only computing assigned percentage');
        }
        
        // Process each row
        dataRows.forEach((row, index) => {
          const actionValue = row[actionColIndex];
          const dueDateValue = row[dueDateColIndex];
          
          const isAssigned = isActionAssigned(actionValue);
          
          if (isAssigned) {
            assignedCount++;
            
            // Check for overdue only if we have due date data
            if (hasDueDateData) {
              const dueDate = parseDate(dueDateValue);
              
              if (dueDate && dueDate < today) {
                overdueCount++;
              } else if (dueDateValue && !dueDate) {
                // Invalid date format
                if (notes.filter(n => n.includes('Invalid date')).length === 0) {
                  notes.push('Some due dates could not be parsed - they are excluded from overdue calculation');
                }
              }
            }
          }
        });
        
        const totalRows = dataRows.length;
        const assignedPct = totalRows > 0 ? (assignedCount / totalRows) * 100 : 0;
        const overduePctOfAssigned = assignedCount > 0 ? (overdueCount / assignedCount) * 100 : 0;
        
        if (totalRows === 0) {
          notes.push('No data rows found in the Excel file');
        }
        
        const result: AnalysisResult = {
          total_rows: totalRows,
          assigned_count: assignedCount,
          assigned_pct: Math.round(assignedPct * 10) / 10,
          overdue_count: overdueCount,
          overdue_pct_of_assigned: Math.round(overduePctOfAssigned * 10) / 10,
          today_iso: todayISO,
          timezone: 'Asia/Kolkata',
          columns_used: columns,
          notes
        };
        
        const summary = `Total: ${totalRows} | Assigned: ${assignedCount} (${result.assigned_pct}%) | Overdue: ${overdueCount} (${result.overdue_pct_of_assigned}%)`;
        
        resolve({ result, summary });
        
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the Excel file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};