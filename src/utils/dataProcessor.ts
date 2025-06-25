import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { DataPoint, DataAnalysis } from '../types';

export const parseFile = async (file: File): Promise<DataPoint[]> => {
  return new Promise((resolve, reject) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
          } else {
            resolve(results.data as DataPoint[]);
          }
        },
        error: (error) => reject(error)
      });
    } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData as DataPoint[]);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read Excel file'));
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('Unsupported file format. Please upload CSV or Excel files.'));
    }
  });
};

export const analyzeData = (data: DataPoint[]): DataAnalysis => {
  if (!data || data.length === 0) {
    throw new Error('No data to analyze');
  }

  const columns = Object.keys(data[0]);
  const shape = { rows: data.length, columns: columns.length };
  
  // Determine data types and missing values
  const dtypes: Record<string, string> = {};
  const missingValues: Record<string, number> = {};
  const numericalColumns: string[] = [];
  const categoricalColumns: string[] = [];
  
  columns.forEach(col => {
    const values = data.map(row => row[col]);
    const nonNullValues = values.filter(val => val !== null && val !== undefined && val !== '');
    
    missingValues[col] = data.length - nonNullValues.length;
    
    // Determine if column is numerical or categorical
    const numericalValues = nonNullValues.filter(val => typeof val === 'number' || !isNaN(Number(val)));
    const isNumerical = numericalValues.length > nonNullValues.length * 0.8;
    
    if (isNumerical) {
      dtypes[col] = 'number';
      numericalColumns.push(col);
    } else {
      dtypes[col] = 'string';
      categoricalColumns.push(col);
    }
  });

  // Calculate basic statistics for numerical columns
  const statistics: Record<string, any> = {};
  numericalColumns.forEach(col => {
    const values = data.map(row => Number(row[col])).filter(val => !isNaN(val));
    if (values.length > 0) {
      const sorted = values.sort((a, b) => a - b);
      statistics[col] = {
        mean: values.reduce((sum, val) => sum + val, 0) / values.length,
        median: sorted[Math.floor(sorted.length / 2)],
        min: Math.min(...values),
        max: Math.max(...values),
        std: Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - statistics[col]?.mean || 0, 2), 0) / values.length)
      };
    }
  });

  return {
    shape,
    columns,
    dtypes,
    missingValues,
    numericalColumns,
    categoricalColumns,
    statistics
  };
};

export const detectProblemType = (data: DataPoint[], targetColumn: string): 'classification' | 'regression' => {
  const targetValues = data.map(row => row[targetColumn]).filter(val => val !== null && val !== undefined);
  const uniqueValues = new Set(targetValues);
  
  // If target has few unique values (< 10% of data or <= 20), likely classification
  if (uniqueValues.size <= 20 || uniqueValues.size < data.length * 0.1) {
    return 'classification';
  }
  
  // If most values are numbers, likely regression
  const numericalTargets = targetValues.filter(val => typeof val === 'number' || !isNaN(Number(val)));
  if (numericalTargets.length > targetValues.length * 0.8) {
    return 'regression';
  }
  
  return 'classification';
};

export const getClassBalance = (data: DataPoint[], targetColumn: string): Record<string, number> => {
  const classBalance: Record<string, number> = {};
  data.forEach(row => {
    const value = String(row[targetColumn]);
    classBalance[value] = (classBalance[value] || 0) + 1;
  });
  return classBalance;
};

export const prepareFeatures = (data: DataPoint[], featureColumns: string[], targetColumn: string) => {
  const features: number[][] = [];
  const targets: number[] = [];
  
  data.forEach(row => {
    const featureRow: number[] = [];
    let validRow = true;
    
    featureColumns.forEach(col => {
      const value = row[col];
      if (value === null || value === undefined || value === '') {
        validRow = false;
        return;
      }
      
      if (typeof value === 'number') {
        featureRow.push(value);
      } else if (!isNaN(Number(value))) {
        featureRow.push(Number(value));
      } else {
        // For categorical features, we'll use simple encoding
        featureRow.push(value.toString().charCodeAt(0) % 100);
      }
    });
    
    if (validRow && row[targetColumn] !== null && row[targetColumn] !== undefined) {
      features.push(featureRow);
      const targetValue = typeof row[targetColumn] === 'number' ? 
        row[targetColumn] : 
        !isNaN(Number(row[targetColumn])) ? 
          Number(row[targetColumn]) : 
          row[targetColumn].toString().charCodeAt(0) % 100;
      targets.push(targetValue);
    }
  });
  
  return { features, targets };
};