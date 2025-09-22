import React, { useCallback, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Upload, FileSpreadsheet } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isProcessing }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find(file => 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    );
    
    if (excelFile) {
      onFileUpload(excelFile);
    }
  }, [onFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  return (
    <Card className={`
      relative overflow-hidden transition-all duration-300 ease-smooth
      ${isDragOver ? 'border-primary bg-primary/5 shadow-medium' : 'border-dashed border-2 border-muted-foreground/30 hover:border-primary/50'}
      ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
    `}>
      <div
        className="p-12 text-center cursor-pointer"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div className="flex flex-col items-center gap-6">
          <div className={`
            p-6 rounded-full transition-all duration-300 ease-smooth
            ${isDragOver ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}
          `}>
            {isProcessing ? (
              <div className="animate-spin">
                <FileSpreadsheet size={48} />
              </div>
            ) : (
              <Upload size={48} />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold text-foreground">
              {isProcessing ? 'Analyzing Excel File...' : 'Upload Excel File'}
            </h3>
            <p className="text-muted-foreground max-w-md">
              {isProcessing 
                ? 'Please wait while we analyze your Action and Due Date columns'
                : 'Drag and drop your Excel file here, or click to browse. We\'ll analyze the Action and Due Date columns.'
              }
            </p>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Supported formats: .xlsx, .xls
          </div>
        </div>
        
        <input
          id="file-input"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />
      </div>
    </Card>
  );
};