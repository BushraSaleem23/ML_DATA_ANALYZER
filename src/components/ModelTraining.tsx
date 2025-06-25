import React, { useState } from 'react';
import { Brain, Play, Settings, Clock, TrendingUp } from 'lucide-react';

interface ModelTrainingProps {
  problemType: 'classification' | 'regression';
  onTrain: (modelType: string) => void;
  isTraining: boolean;
}

const ModelTraining: React.FC<ModelTrainingProps> = ({ 
  problemType, 
  onTrain, 
  isTraining 
}) => {
  const [selectedModel, setSelectedModel] = useState('auto');

  const models = problemType === 'classification' ? [
    { id: 'auto', name: 'Auto Select', description: 'Automatically choose the best model' },
    { id: 'logistic', name: 'Logistic Regression', description: 'Linear model for classification' },
    { id: 'decisiontree', name: 'Decision Tree', description: 'Tree-based classification model' },
    { id: 'randomforest', name: 'Random Forest', description: 'Ensemble of decision trees' }
  ] : [
    { id: 'auto', name: 'Auto Select', description: 'Automatically choose the best model' },
    { id: 'linear', name: 'Linear Regression', description: 'Linear model for continuous values' },
    { id: 'randomforest', name: 'Random Forest', description: 'Ensemble regression model' }
  ];

  const handleTrain = () => {
    onTrain(selectedModel);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Model Training</h2>
          <p className="text-gray-600">
            Problem Type: <span className="font-semibold capitalize text-purple-600">{problemType}</span>
          </p>
        </div>
      </div>

      {/* Problem Type Indicator */}
      <div className={`p-4 rounded-lg border-2 ${
        problemType === 'classification' 
          ? 'bg-blue-50 border-blue-200' 
          : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center space-x-2 mb-2">
          <TrendingUp className={`w-5 h-5 ${
            problemType === 'classification' ? 'text-blue-600' : 'text-green-600'
          }`} />
          <h3 className={`font-semibold ${
            problemType === 'classification' ? 'text-blue-900' : 'text-green-900'
          }`}>
            {problemType === 'classification' ? 'Classification Task' : 'Regression Task'}
          </h3>
        </div>
        <p className={`text-sm ${
          problemType === 'classification' ? 'text-blue-700' : 'text-green-700'
        }`}>
          {problemType === 'classification' 
            ? 'Predicting discrete categories or classes'
            : 'Predicting continuous numerical values'
          }
        </p>
      </div>

      {/* Model Selection */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Choose Algorithm</h3>
        </div>
        
        <div className="grid gap-3">
          {models.map(model => (
            <label
              key={model.id}
              className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedModel === model.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="model"
                value={model.id}
                checked={selectedModel === model.id}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="mt-1 text-purple-600 focus:ring-purple-500"
                disabled={isTraining}
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{model.name}</div>
                <div className="text-sm text-gray-600">{model.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Training Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleTrain}
          disabled={isTraining}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-lg font-semibold transition-all duration-200 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isTraining ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Training Model...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Start Training</span>
            </>
          )}
        </button>
        
        {isTraining && (
          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center space-x-2 text-purple-800">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Training in progress... This may take a few moments.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelTraining;