import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { AnalysisResults } from '@/components/AnalysisResults';
import { analyzeExcelFile } from '@/utils/excelAnalyzer';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, FileSpreadsheet } from 'lucide-react';

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

const Index = () => {
  const [analysisResult, setAnalysisResult] = useState<{
    result: AnalysisResult;
    summary: string;
    fileName: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    
    try {
      const { result, summary } = await analyzeExcelFile(file);
      setAnalysisResult({
        result,
        summary,
        fileName: file.name
      });
      
      toast({
        title: "Analysis Complete",
        description: summary,
        variant: "default",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze the Excel file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-soft">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <BarChart3 className="text-primary-foreground" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Excel Action Analyzer</h1>
                <p className="text-muted-foreground">Analyze action assignments and due dates</p>
              </div>
            </div>
            {analysisResult && (
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                New Analysis
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {!analysisResult ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <FileSpreadsheet className="text-primary" size={48} />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Upload Your Excel File
              </h2>
              <p className="text-lg text-muted-foreground">
                Get instant analysis of your action assignments and due dates
              </p>
            </div>
            
            <FileUpload onFileUpload={handleFileUpload} isProcessing={isProcessing} />
            
            <div className="mt-8 text-center">
              <h3 className="text-lg font-semibold text-foreground mb-4">What we analyze:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="p-4 bg-card border border-border rounded-lg shadow-soft">
                  <h4 className="font-medium text-foreground mb-2">Action Column</h4>
                  <p className="text-sm text-muted-foreground">
                    Identifies assigned vs unassigned actions based on values like "yes", "done", "assigned" or non-empty entries
                  </p>
                </div>
                <div className="p-4 bg-card border border-border rounded-lg shadow-soft">
                  <h4 className="font-medium text-foreground mb-2">Due Date Column</h4>
                  <p className="text-sm text-muted-foreground">
                    Checks for overdue items using Asia/Kolkata timezone and supports multiple date formats
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <AnalysisResults
            result={analysisResult.result}
            summary={analysisResult.summary}
            fileName={analysisResult.fileName}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
