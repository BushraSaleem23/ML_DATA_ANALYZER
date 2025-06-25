import React, { useState } from 'react';
import { Table, Download, Filter, Search } from 'lucide-react';
import { saveAs } from 'file-saver';

interface PredictionsTableProps {
  actualValues: number[];
  predictions: number[];
  problemType: 'classification' | 'regression';
  onClose: () => void;
}

const PredictionsTable: React.FC<PredictionsTableProps> = ({
  actualValues,
  predictions,
  problemType,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'index' | 'actual' | 'predicted' | 'error'>('index');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Prepare data
  const data = actualValues.map((actual, index) => ({
    index: index + 1,
    actual,
    predicted: predictions[index],
    error: problemType === 'regression' ? actual - predictions[index] : actual === predictions[index] ? 0 : 1,
    correct: actual === predictions[index]
  }));

  // Filter data
  const filteredData = data.filter(row =>
    searchTerm === '' ||
    row.index.toString().includes(searchTerm) ||
    row.actual.toString().includes(searchTerm) ||
    row.predicted.toString().includes(searchTerm)
  );

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    let aVal, bVal;
    switch (sortBy) {
      case 'actual':
        aVal = a.actual;
        bVal = b.actual;
        break;
      case 'predicted':
        aVal = a.predicted;
        bVal = b.predicted;
        break;
      case 'error':
        aVal = Math.abs(a.error);
        bVal = Math.abs(b.error);
        break;
      default:
        aVal = a.index;
        bVal = b.index;
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const downloadCSV = () => {
    const headers = ['Index', 'Actual', 'Predicted', problemType === 'regression' ? 'Residual' : 'Correct'];
    const csvContent = [
      headers.join(','),
      ...sortedData.map(row => [
        row.index,
        row.actual,
        row.predicted,
        problemType === 'regression' ? row.error.toFixed(4) : row.correct ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `predictions_detailed.csv`);
  };

  const accuracy = problemType === 'classification' ? 
    (data.filter(row => row.correct).length / data.length * 100).toFixed(1) : null;

  const mse = problemType === 'regression' ?
    (data.reduce((sum, row) => sum + row.error * row.error, 0) / data.length).toFixed(4) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Table className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Detailed Predictions</h2>
                <p className="text-gray-600">{filteredData.length} predictions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-600">Total Predictions</div>
              <div className="text-xl font-bold text-blue-900">{data.length}</div>
            </div>
            {accuracy && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-600">Accuracy</div>
                <div className="text-xl font-bold text-green-900">{accuracy}%</div>
              </div>
            )}
            {mse && (
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-purple-600">MSE</div>
                <div className="text-xl font-bold text-purple-900">{mse}</div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search predictions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={downloadCSV}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto max-h-96">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('index')}
                >
                  Index {sortBy === 'index' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('actual')}
                >
                  Actual {sortBy === 'actual' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('predicted')}
                >
                  Predicted {sortBy === 'predicted' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('error')}
                >
                  {problemType === 'regression' ? 'Residual' : 'Status'} {sortBy === 'error' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row) => (
                <tr 
                  key={row.index} 
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    problemType === 'classification' && !row.correct ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-sm text-gray-900">{row.index}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {typeof row.actual === 'number' ? row.actual.toFixed(4) : row.actual}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {typeof row.predicted === 'number' ? row.predicted.toFixed(4) : row.predicted}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {problemType === 'regression' ? (
                      <span className={`${row.error > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {row.error.toFixed(4)}
                      </span>
                    ) : (
                      <span className={`font-medium ${row.correct ? 'text-green-600' : 'text-red-600'}`}>
                        {row.correct ? 'Correct' : 'Incorrect'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionsTable;