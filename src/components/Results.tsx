import React from 'react';
import { Award, Download, BarChart, Eye, TrendingUp } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { saveAs } from 'file-saver';
import { ModelResults, VisualizationData } from '../types';

interface ResultsProps {
  results: ModelResults;
  visualizationData?: VisualizationData;
  onDownloadPredictions: () => void;
}

const Results: React.FC<ResultsProps> = ({ results, visualizationData, onDownloadPredictions }) => {
  const downloadResults = () => {
    const csvContent = [
      ['Actual', 'Predicted', ...(results.problemType === 'regression' ? ['Residual'] : [])],
      ...results.actualValues!.map((actual, idx) => [
        actual,
        results.predictions[idx],
        ...(results.problemType === 'regression' ? [actual - results.predictions[idx]] : [])
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `ml_results_${results.model.toLowerCase().replace(' ', '_')}.csv`);
  };

  const getMetricColor = (metric: string, value: number) => {
    if (metric.includes('Error') || metric.includes('MSE') || metric.includes('MAE')) {
      return value < 0.1 ? 'text-green-600' : value < 0.5 ? 'text-yellow-600' : 'text-red-600';
    }
    return value > 0.8 ? 'text-green-600' : value > 0.6 ? 'text-yellow-600' : 'text-red-600';
  };

  const confusionMatrixData = results.confusionMatrix ? 
    results.confusionMatrix.flatMap((row, i) => 
      row.map((value, j) => ({ actual: i, predicted: j, value }))
    ) : [];

  const featureImportanceData = visualizationData?.featureImportance?.slice(0, 10) || [];

  return (
    <div className="space-y-6">
      {/* Model Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Training Results</h2>
              <p className="text-gray-600">{results.model}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Training Time</div>
            <div className="text-lg font-semibold text-gray-900">
              {(results.trainingTime / 1000).toFixed(2)}s
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(results.metrics).map(([metric, value]) => (
            <div key={metric} className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">{metric}</div>
              <div className={`text-2xl font-bold ${getMetricColor(metric, value)}`}>
                {typeof value === 'number' ? value.toFixed(4) : value}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={downloadResults}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Results</span>
          </button>
          <button
            onClick={onDownloadPredictions}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>View Predictions</span>
          </button>
        </div>
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix for Classification */}
        {results.problemType === 'classification' && results.confusionMatrix && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Confusion Matrix</h3>
            </div>
            <div className="space-y-4">
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${results.confusionMatrix.length}, 1fr)` }}>
                {results.confusionMatrix.map((row, i) =>
                  row.map((value, j) => (
                    <div
                      key={`${i}-${j}`}
                      className={`p-3 text-center rounded border ${
                        i === j ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'
                      }`}
                    >
                      <div className="font-bold text-gray-900">{value}</div>
                      <div className="text-xs text-gray-600">
                        A:{i} P:{j}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="text-sm text-gray-600">
                <p><strong>A:</strong> Actual class, <strong>P:</strong> Predicted class</p>
                <p>Green boxes show correct predictions, red boxes show misclassifications</p>
              </div>
            </div>
          </div>
        )}

        {/* Scatter Plot for Regression */}
        {results.problemType === 'regression' && results.actualValues && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Actual vs Predicted</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="x" 
                    name="Actual" 
                    label={{ value: 'Actual Values', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis 
                    dataKey="y" 
                    name="Predicted" 
                    label={{ value: 'Predicted Values', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [value, name === 'y' ? 'Predicted' : 'Actual']}
                  />
                  <Scatter 
                    data={results.actualValues.map((actual, idx) => ({ 
                      x: actual, 
                      y: results.predictions[idx] 
                    }))}
                    fill="#3B82F6"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Feature Importance */}
        {featureImportanceData.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-900">Feature Importance</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={featureImportanceData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="feature" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="importance" fill="#10B981" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Model Performance Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Award className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Performance Summary</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Model: {results.model}</h4>
              <p className="text-blue-800 text-sm">
                {results.problemType === 'classification' 
                  ? `Achieved ${(results.metrics['Accuracy'] * 100).toFixed(1)}% accuracy on the test set`
                  : `Achieved R² score of ${results.metrics['R² Score']?.toFixed(3)} with RMSE of ${results.metrics['Root Mean Squared Error']?.toFixed(3)}`
                }
              </p>
            </div>
            
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Dataset Size:</strong> {results.actualValues?.length} test samples</p>
              <p><strong>Problem Type:</strong> {results.problemType}</p>
              <p><strong>Training Duration:</strong> {(results.trainingTime / 1000).toFixed(2)} seconds</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;