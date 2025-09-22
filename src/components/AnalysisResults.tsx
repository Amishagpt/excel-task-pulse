import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Calendar, FileText, TrendingUp, Clock } from 'lucide-react';

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

interface AnalysisResultsProps {
  result: AnalysisResult;
  summary: string;
  fileName: string;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ 
  result, 
  summary, 
  fileName 
}) => {
  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'destructive';
  };

  const getOverdueColor = (percentage: number) => {
    if (percentage === 0) return 'success';
    if (percentage <= 20) return 'warning';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-card shadow-medium">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="text-primary" size={28} />
                Analysis Complete
              </CardTitle>
              <p className="text-muted-foreground mt-1">{fileName}</p>
            </div>
            <Badge variant="outline" className="text-sm">
              {result.timezone}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-lg font-medium text-foreground">{summary}</p>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Items */}
        <Card className="shadow-soft hover:shadow-medium transition-all duration-300 ease-smooth">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-3xl font-bold text-foreground mt-1">{result.total_rows}</p>
              </div>
              <div className="p-3 bg-info/10 rounded-full">
                <TrendingUp className="text-info" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Count */}
        <Card className="shadow-soft hover:shadow-medium transition-all duration-300 ease-smooth">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned</p>
                <p className="text-3xl font-bold text-foreground mt-1">{result.assigned_count}</p>
                <Badge variant="outline" className={`mt-2 text-${getStatusColor(result.assigned_pct)}`}>
                  {result.assigned_pct.toFixed(1)}%
                </Badge>
              </div>
              <div className={`p-3 bg-${getStatusColor(result.assigned_pct)}/10 rounded-full`}>
                <CheckCircle className={`text-${getStatusColor(result.assigned_pct)}`} size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Count */}
        <Card className="shadow-soft hover:shadow-medium transition-all duration-300 ease-smooth">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-3xl font-bold text-foreground mt-1">{result.overdue_count}</p>
                {result.assigned_count > 0 && (
                  <Badge variant="outline" className={`mt-2 text-${getOverdueColor(result.overdue_pct_of_assigned)}`}>
                    {result.overdue_pct_of_assigned.toFixed(1)}%
                  </Badge>
                )}
              </div>
              <div className={`p-3 bg-${getOverdueColor(result.overdue_pct_of_assigned)}/10 rounded-full`}>
                <AlertTriangle className={`text-${getOverdueColor(result.overdue_pct_of_assigned)}`} size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Date */}
        <Card className="shadow-soft hover:shadow-medium transition-all duration-300 ease-smooth">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Analysis Date</p>
                <p className="text-lg font-semibold text-foreground mt-1">{result.today_iso}</p>
                <p className="text-sm text-muted-foreground mt-1">{result.timezone}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Calendar className="text-primary" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Column Information */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="text-primary" size={20} />
            Column Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-accent/5 rounded-lg">
              <span className="font-medium">Action Column:</span>
              <Badge variant="secondary">Column {result.columns_used.action}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-accent/5 rounded-lg">
              <span className="font-medium">Due Date Column:</span>
              <Badge variant="secondary">Column {result.columns_used.due_date}</Badge>
            </div>
          </div>
          
          {result.notes.length > 0 && (
            <div className="mt-4 p-4 bg-warning/5 border border-warning/20 rounded-lg">
              <h4 className="font-medium text-warning mb-2">Notes:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {result.notes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* JSON Output */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>JSON Output</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm text-foreground font-mono">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};