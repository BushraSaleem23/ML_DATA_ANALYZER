import { Matrix } from 'ml-matrix';
import { SimpleLinearRegression, MultivariateLinearRegression } from 'ml-regression';
import { RandomForestRegression, RandomForestClassifier } from 'ml-random-forest';
import { ModelResults } from '../types';

// Logistic Regression Implementation
class LogisticRegression {
  private weights: number[] = [];
  private bias: number = 0;
  private learningRate: number = 0.01;
  private iterations: number = 1000;

  fit(X: number[][], y: number[]) {
    const numFeatures = X[0].length;
    this.weights = new Array(numFeatures).fill(0);
    this.bias = 0;

    for (let iter = 0; iter < this.iterations; iter++) {
      const predictions = X.map(row => this.sigmoid(this.predict(row)));
      
      // Update weights and bias
      const dw = new Array(numFeatures).fill(0);
      let db = 0;
      
      for (let i = 0; i < X.length; i++) {
        const error = predictions[i] - y[i];
        db += error;
        for (let j = 0; j < numFeatures; j++) {
          dw[j] += error * X[i][j];
        }
      }
      
      for (let j = 0; j < numFeatures; j++) {
        this.weights[j] -= (this.learningRate * dw[j]) / X.length;
      }
      this.bias -= (this.learningRate * db) / X.length;
    }
  }

  predict(x: number[]): number {
    return x.reduce((sum, val, idx) => sum + val * this.weights[idx], this.bias);
  }

  predictProba(x: number[]): number {
    return this.sigmoid(this.predict(x));
  }

  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, z))));
  }
}

// Decision Tree Implementation (simplified)
class DecisionTree {
  private tree: any = null;
  private maxDepth: number = 10;
  private minSamplesSplit: number = 2;

  fit(X: number[][], y: number[]) {
    this.tree = this.buildTree(X, y, 0);
  }

  predict(X: number[][]): number[] {
    return X.map(row => this.predictSingle(row, this.tree));
  }

  private buildTree(X: number[][], y: number[], depth: number): any {
    if (depth >= this.maxDepth || X.length < this.minSamplesSplit || new Set(y).size === 1) {
      return this.getMostCommonValue(y);
    }

    const bestSplit = this.findBestSplit(X, y);
    if (!bestSplit) {
      return this.getMostCommonValue(y);
    }

    const { feature, threshold, leftIndices, rightIndices } = bestSplit;
    
    return {
      feature,
      threshold,
      left: this.buildTree(
        leftIndices.map(i => X[i]),
        leftIndices.map(i => y[i]),
        depth + 1
      ),
      right: this.buildTree(
        rightIndices.map(i => X[i]),
        rightIndices.map(i => y[i]),
        depth + 1
      )
    };
  }

  private findBestSplit(X: number[][], y: number[]) {
    let bestGini = Infinity;
    let bestSplit = null;

    for (let feature = 0; feature < X[0].length; feature++) {
      const values = X.map(row => row[feature]);
      const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
      
      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
        const leftIndices: number[] = [];
        const rightIndices: number[] = [];
        
        X.forEach((row, idx) => {
          if (row[feature] <= threshold) {
            leftIndices.push(idx);
          } else {
            rightIndices.push(idx);
          }
        });
        
        if (leftIndices.length === 0 || rightIndices.length === 0) continue;
        
        const gini = this.calculateWeightedGini(
          leftIndices.map(i => y[i]),
          rightIndices.map(i => y[i])
        );
        
        if (gini < bestGini) {
          bestGini = gini;
          bestSplit = { feature, threshold, leftIndices, rightIndices };
        }
      }
    }
    
    return bestSplit;
  }

  private calculateWeightedGini(leftY: number[], rightY: number[]): number {
    const totalSamples = leftY.length + rightY.length;
    const leftWeight = leftY.length / totalSamples;
    const rightWeight = rightY.length / totalSamples;
    
    return leftWeight * this.calculateGini(leftY) + rightWeight * this.calculateGini(rightY);
  }

  private calculateGini(y: number[]): number {
    const counts: Record<number, number> = {};
    y.forEach(val => counts[val] = (counts[val] || 0) + 1);
    
    let gini = 1;
    Object.values(counts).forEach(count => {
      const probability = count / y.length;
      gini -= probability * probability;
    });
    
    return gini;
  }

  private getMostCommonValue(y: number[]): number {
    const counts: Record<number, number> = {};
    y.forEach(val => counts[val] = (counts[val] || 0) + 1);
    
    return Number(Object.keys(counts).reduce((a, b) => counts[Number(a)] > counts[Number(b)] ? a : b));
  }

  private predictSingle(x: number[], node: any): number {
    if (typeof node === 'number') {
      return node;
    }
    
    if (x[node.feature] <= node.threshold) {
      return this.predictSingle(x, node.left);
    } else {
      return this.predictSingle(x, node.right);
    }
  }
}

export const trainModel = async (
  X: number[][],
  y: number[],
  problemType: 'classification' | 'regression',
  modelType: string = 'auto'
): Promise<ModelResults> => {
  const startTime = Date.now();
  
  // Split data into train/test
  const splitIndex = Math.floor(X.length * 0.8);
  const XTrain = X.slice(0, splitIndex);
  const yTrain = y.slice(0, splitIndex);
  const XTest = X.slice(splitIndex);
  const yTest = y.slice(splitIndex);
  
  let model: any;
  let predictions: number[] = [];
  let modelName = '';
  
  try {
    if (problemType === 'regression') {
      if (modelType === 'linear' || modelType === 'auto') {
        if (XTrain[0].length === 1) {
          model = new SimpleLinearRegression(XTrain.map(row => row[0]), yTrain);
          predictions = XTest.map(row => model.predict(row[0]));
          modelName = 'Linear Regression';
        } else {
          model = new MultivariateLinearRegression(XTrain, yTrain);
          predictions = XTest.map(row => model.predict(row));
          modelName = 'Multivariate Linear Regression';
        }
      } else if (modelType === 'randomforest') {
        model = new RandomForestRegression({
          nEstimators: 10,
          maxFeatures: Math.floor(Math.sqrt(XTrain[0].length)),
          replacement: false
        });
        model.train(XTrain, yTrain);
        predictions = model.predict(XTest);
        modelName = 'Random Forest Regression';
      }
    } else {
      if (modelType === 'logistic' || modelType === 'auto') {
        model = new LogisticRegression();
        model.fit(XTrain, yTrain);
        predictions = XTest.map(row => Math.round(model.predictProba(row)));
        modelName = 'Logistic Regression';
      } else if (modelType === 'decisiontree') {
        model = new DecisionTree();
        model.fit(XTrain, yTrain);
        predictions = model.predict(XTest);
        modelName = 'Decision Tree';
      } else if (modelType === 'randomforest') {
        model = new RandomForestClassifier({
          nEstimators: 10,
          maxFeatures: Math.floor(Math.sqrt(XTrain[0].length)),
          replacement: false
        });
        model.train(XTrain, yTrain);
        predictions = model.predict(XTest);
        modelName = 'Random Forest Classifier';
      }
    }
  } catch (error) {
    console.error('Model training error:', error);
    throw new Error(`Failed to train ${modelName}: ${error}`);
  }
  
  const trainingTime = Date.now() - startTime;
  const metrics = calculateMetrics(yTest, predictions, problemType);
  const confusionMatrix = problemType === 'classification' ? 
    calculateConfusionMatrix(yTest, predictions) : undefined;
  
  return {
    model: modelName,
    problemType,
    metrics,
    predictions,
    actualValues: yTest,
    confusionMatrix,
    trainingTime
  };
};

const calculateMetrics = (actual: number[], predicted: number[], problemType: string): Record<string, number> => {
  if (problemType === 'regression') {
    const mse = actual.reduce((sum, val, idx) => sum + Math.pow(val - predicted[idx], 2), 0) / actual.length;
    const mae = actual.reduce((sum, val, idx) => sum + Math.abs(val - predicted[idx]), 0) / actual.length;
    const actualMean = actual.reduce((sum, val) => sum + val, 0) / actual.length;
    const totalSumSquares = actual.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
    const r2 = 1 - (mse * actual.length) / totalSumSquares;
    
    return {
      'Mean Squared Error': Number(mse.toFixed(4)),
      'Mean Absolute Error': Number(mae.toFixed(4)),
      'Root Mean Squared Error': Number(Math.sqrt(mse).toFixed(4)),
      'R² Score': Number(r2.toFixed(4))
    };
  } else {
    const correct = actual.filter((val, idx) => val === predicted[idx]).length;
    const accuracy = correct / actual.length;
    
    // Calculate precision, recall, F1 for binary classification
    const uniqueClasses = [...new Set([...actual, ...predicted])];
    let precision = 0, recall = 0, f1 = 0;
    
    if (uniqueClasses.length === 2) {
      const positiveClass = Math.max(...uniqueClasses);
      const tp = actual.filter((val, idx) => val === positiveClass && predicted[idx] === positiveClass).length;
      const fp = predicted.filter((val, idx) => val === positiveClass && actual[idx] !== positiveClass).length;
      const fn = actual.filter((val, idx) => val === positiveClass && predicted[idx] !== positiveClass).length;
      
      precision = tp / (tp + fp) || 0;
      recall = tp / (tp + fn) || 0;
      f1 = 2 * (precision * recall) / (precision + recall) || 0;
    }
    
    return {
      'Accuracy': Number(accuracy.toFixed(4)),
      'Precision': Number(precision.toFixed(4)),
      'Recall': Number(recall.toFixed(4)),
      'F1 Score': Number(f1.toFixed(4))
    };
  }
};

const calculateConfusionMatrix = (actual: number[], predicted: number[]): number[][] => {
  const uniqueClasses = [...new Set([...actual, ...predicted])].sort();
  const matrix: number[][] = Array(uniqueClasses.length).fill(0).map(() => Array(uniqueClasses.length).fill(0));
  
  actual.forEach((actualClass, idx) => {
    const actualIdx = uniqueClasses.indexOf(actualClass);
    const predictedIdx = uniqueClasses.indexOf(predicted[idx]);
    if (actualIdx >= 0 && predictedIdx >= 0) {
      matrix[actualIdx][predictedIdx]++;
    }
  });
  
  return matrix;
};