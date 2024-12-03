import React from 'react';
import { useRecordings } from '../hooks/useRecordings';
import type { Recording } from '../shared/types';

export const RecordingsList: React.FC = () => {
  const { recordings, isLoading, error } = useRecordings();

  if (isLoading) {
    return <div>Loading recordings...</div>;
  }

  if (error) {
    return <div>Error loading recordings: {error.message}</div>;
  }

  return (
    <div className="space-y-2">
      {recordings.map((recording: Recording) => (
        <div
          key={recording.id}
          data-testid="recording-item"
          className="p-4 border rounded hover:bg-gray-50 cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <span>{recording.filename}</span>
            <span className="text-sm text-gray-500">
              {(recording.filesize / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {new Date(recording.created_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};