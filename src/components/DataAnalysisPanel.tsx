import React, { useState } from 'react';
import { BarChart3, Database, AlertTriangle, Target, Hash, Type, ArrowRight } from 'lucide-react';
import { DataAnalysis } from '../types';

interface DataAnalysisPanelProps {
  analysis: DataAnalysis;
  onTargetSelect: (column: string) => void;
  selectedTarget?: string;
}

const DataAnalysisPanel: React.FC<DataAnalysisPanelProps> = ({ 
  analysis, 
  onTargetSelect, 
  selectedTarget 
}) => {
  const [customTarget, setCustomTarget] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleTargetSelection = (column: string) => {
    onTargetSelect(column);
  };

  const handleCustomTargetSubmit = () => {
    if (customTarget && analysis.columns.includes(customTarget)) {
      onTargetSelect(customTarget);
      setShowCustomInput(false);
      setCustomTarget('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Data Analysis</h2>
      </div>

      {/* Dataset Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Dataset Shape</h3>
          </div>
          <p className="text-2xl font-bold text-blue-800">
            {analysis.shape.rows.toLocaleString()} × {analysis.shape.columns}
          </p>
          <p className="text-sm text-blue-600">rows × columns</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-2 mb-2">
            <Hash className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900">Numerical Features</h3>
          </div>
          <p className="text-2xl font-bold text-purple-800">
            {analysis.numericalColumns.length}
          </p>
          <p className="text-sm text-purple-600">numeric columns</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200">
          <div className="flex items-center space-x-2 mb-2">
            <Type className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-emerald-900">Categorical Features</h3>
          </div>
          <p className="text-2xl font-bold text-emerald-800">
            {analysis.categoricalColumns.length}
          </p>
          <p className="text-sm text-emerald-600">categorical columns</p>
        </div>
      </div>

      {/* Missing Values Alert */}
      {Object.values(analysis.missingValues).some(count => count > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">Missing Values Detected</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {Object.entries(analysis.missingValues)
                  .filter(([, count]) => count > 0)
                  .map(([column, count]) => (
                    <div key={column} className="text-amber-800">
                      <span className="font-medium">{column}:</span> {count} missing
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Target Variable Selection */}
      <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Target className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-blue-900">Select Target Variable</h3>
          </div>
          <button
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showCustomInput ? 'Select from list' : 'Type column name'}
          </button>
        </div>

        <p className="text-blue-700 mb-4 text-sm">
          Choose the column you want to predict. This will be used as the target variable for machine learning.
        </p>

        {showCustomInput ? (
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={customTarget}
              onChange={(e) => setCustomTarget(e.target.value)}
              placeholder="Enter target column name..."
              className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleCustomTargetSubmit}
              disabled={!customTarget || !analysis.columns.includes(customTarget)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <span>Select</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {analysis.columns.map(column => (
              <button
                key={column}
                onClick={() => handleTargetSelection(column)}
                className={`p-4 text-left rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                  selectedTarget === column
                    ? 'border-blue-500 bg-blue-100 text-blue-900 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 text-gray-700 bg-white'
                }`}
              >
                <div className="font-semibold truncate text-lg">{column}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {analysis.dtypes[column]} • {analysis.missingValues[column] || 0} missing
                </div>
                {selectedTarget === column && (
                  <div className="mt-2 text-xs text-blue-600 font-medium">
                    ✓ Selected as target
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {selectedTarget && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-semibold text-green-900">
                Target Variable Selected: {selectedTarget}
              </span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              Ready to proceed to model training. Click "Continue" or the system will automatically advance.
            </p>
          </div>
        )}
      </div>

      {/* Column Statistics */}
      {analysis.statistics && Object.keys(analysis.statistics).length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Statistical Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-700">Column</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-700">Mean</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-700">Median</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-700">Min</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-700">Max</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(analysis.statistics).map(([column, stats]) => (
                  <tr key={column} className="border-b border-gray-100">
                    <td className="py-2 px-2 font-medium text-gray-900">{column}</td>
                    <td className="py-2 px-2 text-right text-gray-600">{stats.mean.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-gray-600">{stats.median.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-gray-600">{stats.min.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-gray-600">{stats.max.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Class Balance (for classification) */}
      {analysis.classBalance && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Class Distribution</h3>
          <div className="space-y-2">
            {Object.entries(analysis.classBalance).map(([className, count]) => (
              <div key={className} className="flex items-center justify-between">
                <span className="font-medium text-gray-700">{className}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                      style={{
                        width: `${(count / analysis.shape.rows) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {count} ({((count / analysis.shape.rows) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAnalysisPanel;