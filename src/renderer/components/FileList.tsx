import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AudioFile } from '../../shared/schema';
import { ArrowUpDown, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';

interface FileListProps {
  selectedFileId: string | null;
  onFileSelect: (id: string) => void;
}

type SortField = 'fileName' | 'size' | 'modifiedAt' | 'transcriptionStatus';
type SortDirection = 'asc' | 'desc';

const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleString();
};

const StatusIcon: React.FC<{ status: AudioFile['transcriptionStatus'] }> = ({ status }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'processing':
      return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
    case 'error':
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
};

export const FileList: React.FC<FileListProps> = ({ selectedFileId, onFileSelect }) => {
  const [sortField, setSortField] = useState<SortField>('modifiedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const { data: files = [], isLoading } = useQuery<AudioFile[]>({
    queryKey: ['audioFiles'],
    queryFn: async () => {
      const response = await window.electron.invoke('get-audio-files');
      return response.map((file: any) => ({
        ...file,
        createdAt: new Date(file.createdAt),
        modifiedAt: new Date(file.modifiedAt),
      }));
    },
  });

  const sortedFiles = [...files].sort((a, b) => {
    const modifier = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'fileName':
        return modifier * a.fileName.localeCompare(b.fileName);
      case 'size':
        return modifier * (a.size - b.size);
      case 'modifiedAt':
        return modifier * (a.modifiedAt.getTime() - b.modifiedAt.getTime());
      case 'transcriptionStatus':
        return modifier * a.transcriptionStatus.localeCompare(b.transcriptionStatus);
      default:
        return 0;
    }
  });

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <Folder className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg">No audio files found</p>
        <p className="text-sm mt-2">Add watch folders in settings to get started</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th
                onClick={() => handleSort('fileName')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th
                onClick={() => handleSort('size')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center space-x-1">
                  <span>Size</span>
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th
                onClick={() => handleSort('modifiedAt')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center space-x-1">
                  <span>Modified</span>
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th
                onClick={() => handleSort('transcriptionStatus')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedFiles.map((file) => (
              <tr
                key={file.id}
                onClick={() => onFileSelect(file.id)}
                className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedFileId === file.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {file.fileName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(file.size)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(file.modifiedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <StatusIcon status={file.transcriptionStatus} />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {file.transcriptionStatus}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};