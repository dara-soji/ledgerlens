import { useState } from 'react';
import { FaUser, FaMapMarkerAlt, FaCalendarAlt, FaMoneyBillWave, FaRegFileAlt, FaCheckCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { UploadJob } from '../../types/types';
import { truncateFileName } from '../../lib/utilities';

interface ResultsViewProps {
  job: UploadJob;
}

const ResultsView = ({ job }: ResultsViewProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!job.result) return null;

  const { result } = job;
  const formatCurrency = (amount: number) => `£${Math.abs(amount).toFixed(2)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const displayFileName = job.fileName || "Unknown file";

  return (
    <div>
      {/* Clickable File Header */}
      <div
        className="p-4 bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <FaRegFileAlt className="text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900" title={displayFileName}>
              {truncateFileName(displayFileName, 40)}
            </p>
            <p className="text-sm text-green-600 flex items-center gap-1">
              <FaCheckCircle className="w-3 h-3" />
              Processing completed • Click to {isExpanded ? 'hide' : 'view'} details
            </p>
          </div>
          <div className="text-green-600">
            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </div>
        </div>
      </div>

      {/* Collapsible Results Content */}
      {isExpanded && (
        <div className="p-6 space-y-6 border-t border-gray-200">
          {/* Account Holder Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FaUser className="text-purple-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Account Holder</p>
                  <p className="font-semibold text-gray-900">{result.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-purple-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-gray-900">{result.address}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FaCalendarAlt className="text-purple-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Statement Date</p>
                  <p className="font-semibold text-gray-900">{result.documentDate}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FaMoneyBillWave className="text-purple-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Balance Summary</p>
                  <div className="space-y-1">
                    <p className="text-sm">Start: <span className="font-semibold">{formatCurrency(result.startBalance)}</span></p>
                    <p className="text-sm">End: <span className="font-semibold">{formatCurrency(result.endBalance)}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reconciliation Status */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <div className={`w-3 h-3 rounded-full ${result.isReconciled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              {result.isReconciled ? 'Statement is reconciled' : 'Statement reconciliation failed'}
            </span>
          </div>

          {/* Transactions */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">
              Transactions ({result.transactions?.length || 0})
            </h4>

            {result.transactions && result.transactions.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {result.transactions.map((transaction: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{transaction.date}</p>
                    </div>
                    <div className={`font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No transactions found</p>
            )}
          </div>

          {/* Processing Info */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
              <div>
                <p className="font-medium">Job ID</p>
                <p className="font-mono text-xs">{job.jobId}</p>
              </div>
              <div>
                <p className="font-medium">Processed</p>
                <p>{formatDate(job.processedAt!)}</p>
              </div>
              <div>
                <p className="font-medium">Completed</p>
                <p>{formatDate(job.completedAt!)}</p>
              </div>
              <div>
                <p className="font-medium">Processing Time</p>
                <p>{(job.processingTime! / 1000).toFixed(1)}s</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsView; 