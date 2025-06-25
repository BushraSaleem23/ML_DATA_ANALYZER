import React, { useState, useEffect } from 'react';
import { Brain, Database, TrendingUp, AlertCircle } from 'lucide-react';
import FileUpload from './components/FileUpload';
import DataAnalysisPanel from './components/DataAnalysisPanel';
import ModelTraining from './components/ModelTraining';
import Results from './components/Results';
import PredictionsTable from './components/PredictionsTable';
import { parseFile, analyzeData, detectProblemType, getClassBalance, prepareFeatures } from './utils/dataProcessor';
import { trainModel } from './utils/mlModels';
import { DataPoint, DataAnalysis, ModelResults } from './types';

type AppStep = 'upload' | 'analyze' | 'train' | 'results';

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('upload');
  const [data, setData] = useState<DataPoint[]>([]);
  const [analysis, setAnalysis] = useState<DataAnalysis | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [results, setResults] = useState<ModelResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPredictionsTable, setShowPredictionsTable] = useState(false);

  // Auto-advance to training when target is selected
  useEffect(() => {
    if (selectedTarget && analysis && currentStep === 'analyze') {
      const timer = setTimeout(() => {
        setCurrentStep('train');
      }, 1500); // Give user time to see the selection
      return () => clearTimeout(timer);
    }
  }, [selectedTarget, analysis, currentStep]);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError('');
    
    try {
      const parsedData = await parseFile(file);
      if (parsedData.length === 0) {
        throw new Error('No data found in the uploaded file');
      }
      
      setData(parsedData);
      const dataAnalysis = analyzeData(parsedData);
      setAnalysis(dataAnalysis);
      setCurrentStep('analyze');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTargetSelect = (column: string) => {
    if (!analysis || !data) return;
    
    setSelectedTarget(column);
    const problemType = detectProblemType(data, column);
    const classBalance = problemType === 'classification' ? getClassBalance(data, column) : undefined;
    
    setAnalysis({
      ...analysis,
      targetColumn: column,
      problemType,
      classBalance
    });
  };

  const handleModelTrain = async (modelType: string) => {
    if (!data || !analysis || !selectedTarget) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const featureColumns = analysis.columns.filter(col => col !== selectedTarget);
      const { features, targets } = prepareFeatures(data, featureColumns, selectedTarget);
      
      if (features.length === 0) {
        throw new Error('No valid feature data found after preprocessing');
      }
      
      const modelResults = await trainModel(features, targets, analysis.problemType!, modelType);
      setResults(modelResults);
      setCurrentStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to train model');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPredictions = () => {
    setShowPredictionsTable(true);
  };

  const resetApp = () => {
    setCurrentStep('upload');
    setData([]);
    setAnalysis(null);
    setSelectedTarget('');
    setResults(null);
    setError('');
    setShowPredictionsTable(false);
  };

  const steps = [
    { id: 'upload', name: 'Upload Data', icon: Database },
    { id: 'analyze', name: 'Analyze', icon: TrendingUp },
    { id: 'train', name: 'Train Model', icon: Brain },
    { id: 'results', name: 'Results', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ML Data Analyzer</h1>
                <p className="text-sm text-gray-600">Intelligent Data Analysis Platform</p>
              </div>
            </div>
            {currentStep !== 'upload' && (
              <button
                onClick={resetApp}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Start Over
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isActive 
                    ? 'border-blue-500 bg-blue-500 text-white' 
                    : isCompleted 
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 bg-white text-gray-400'
                }`}>
                  <StepIcon className="w-5 h-5" />
                </div>
                <div className="ml-3">
                  <div className={`text-sm font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">Error</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-8">
          {currentStep === 'upload' && (
            <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
          )}

          {currentStep === 'analyze' && analysis && (
            <DataAnalysisPanel
              analysis={analysis}
              onTargetSelect={handleTargetSelect}
              selectedTarget={selectedTarget}
            />
          )}

          {currentStep === 'train' && analysis && (
            <ModelTraining
              problemType={analysis.problemType!}
              onTrain={handleModelTrain}
              isTraining={isLoading}
            />
          )}

          {currentStep === 'results' && results && (
            <Results
              results={results}
              onDownloadPredictions={handleDownloadPredictions}
            />
          )}
        </div>

        {/* Predictions Table Modal */}
        {showPredictionsTable && results && results.actualValues && (
          <PredictionsTable
            actualValues={results.actualValues}
            predictions={results.predictions}
            problemType={results.problemType}
            onClose={() => setShowPredictionsTable(false)}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p>Built with React, TypeScript, and ML.js • Advanced Machine Learning Made Simple</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;