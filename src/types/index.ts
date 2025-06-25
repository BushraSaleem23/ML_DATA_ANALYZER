export interface DataPoint {
  [key: string]: any;
}

export interface DataAnalysis {
  shape: { rows: number; columns: number };
  columns: string[];
  dtypes: Record<string, string>;
  missingValues: Record<string, number>;
  numericalColumns: string[];
  categoricalColumns: string[];
  targetColumn?: string;
  problemType?: 'classification' | 'regression';
  classBalance?: Record<string, number>;
  statistics?: Record<string, any>;
}

export interface ModelResults {
  model: string;
  problemType: 'classification' | 'regression';
  metrics: Record<string, number>;
  predictions: number[];
  actualValues?: number[];
  confusionMatrix?: number[][];
  featureImportance?: Record<string, number>;
  trainingTime: number;
}

export interface VisualizationData {
  confusionMatrix?: number[][];
  featureImportance?: Array<{ feature: string; importance: number }>;
  scatterData?: Array<{ x: number; y: number; predicted?: number }>;
  residuals?: Array<{ actual: number; predicted: number; residual: number }>;
}