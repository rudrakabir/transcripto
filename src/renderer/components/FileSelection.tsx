import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface FileInfo {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  status?: 'ready' | 'transcribing' | 'completed' | 'error';
}

export const FileSelection: React.FC<{
  onFileSelect: (recordingId: string) => void;
  selectedRecordingId?: string;
}> = ({ onFileSelect, selectedRecordingId }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Query to get list of files
  const { data: files = [], isLoading } = useQuery<FileInfo[]>({
    queryKey: ['audioFiles'],
    queryFn: async () => {
      return await window.electron.invoke('GET_AUDIO_FILES');
    }
  });

  // Mutation for adding new files
  const addFile = useMutation({
    mutationFn: async (filePath: string) => {
      return await window.electron.invoke('ADD_AUDIO_FILE', filePath);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audioFiles'] });
    }
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const audioFiles = files.filter(file => 
      file.type.startsWith('audio/') || file.name.endsWith('.wav')
    );

    for (const file of audioFiles) {
      await addFile.mutateAsync(file.path);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await addFile.mutateAsync(file.path);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* File Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-2">
          <p className="text-gray-600">Drag and drop audio files here</p>
          <p className="text-gray-400">or</p>
          <button
            onClick={handleBrowseClick}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Browse Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.wav"
            className="hidden"
            multiple
            onChange={handleFileInputChange}
          />
        </div>
      </div>

      {/* File List */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h3 className="font-medium">Audio Files</h3>
        </div>
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No audio files yet</div>
        ) : (
          <div className="divide-y">
            {files.map((file) => (
              <button
                key={file.id}
                onClick={() => onFileSelect(file.id)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between ${
                  selectedRecordingId === file.id ? 'bg-blue-50' : ''
                }`}
              >
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    Added {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {file.status && (
                  <span className={`text-sm px-2 py-1 rounded ${
                    file.status === 'completed' ? 'bg-green-100 text-green-800' :
                    file.status === 'error' ? 'bg-red-100 text-red-800' :
                    file.status === 'transcribing' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {file.status}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};