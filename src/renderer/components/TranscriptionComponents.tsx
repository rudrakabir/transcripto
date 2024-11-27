import React from 'react';
import { 
  useStartTranscription,
  useCancelTranscription,
  useTranscriptionStatus,
  useTranscriptionProgress,
  useTranscription,
  useTranscriptionEvents
} from '../hooks/useTranscription';

export const TranscriptionControls: React.FC<{ recordingId: string }> = ({ recordingId }) => {
  const [language, setLanguage] = React.useState('en');
  const startTranscription = useStartTranscription();
  const cancelTranscription = useCancelTranscription();
  const { data: status } = useTranscriptionStatus(recordingId);

  const handleStart = async () => {
    await startTranscription.mutateAsync({
      recordingId,
      language,
      filePath: `recordings/${recordingId}.wav` // Assuming this is your path structure
    });
  };

  const handleCancel = async () => {
    await cancelTranscription.mutateAsync(recordingId);
  };

  return (
    <div className="flex gap-4 p-4 border-b">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="px-3 py-2 border rounded-md"
        disabled={status?.status === 'processing'}
      >
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
      </select>

      {(!status || status.status === 'error') && (
        <button
          onClick={handleStart}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Start Transcription
        </button>
      )}

      {(status?.status === 'queued' || status?.status === 'processing') && (
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Cancel
        </button>
      )}
    </div>
  );
};

export const TranscriptionProgress: React.FC<{ recordingId: string }> = ({ recordingId }) => {
  const { data: progress } = useTranscriptionProgress(recordingId);
  useTranscriptionEvents(recordingId);

  if (!progress) return null;

  return (
    <div className="p-4 border-b">
      <div className="mb-2">
        Status: <span className="font-medium">{progress.status}</span>
      </div>
      
      {progress.status === 'processing' && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all"
            style={{ width: `${progress.progress}%` }}
          />
        </div>
      )}

      {progress.status === 'error' && (
        <div className="text-red-500">
          Error: {progress.error}
        </div>
      )}
    </div>
  );
};

export const TranscriptionView: React.FC<{ recordingId: string }> = ({ recordingId }) => {
  const { data: transcription } = useTranscription(recordingId);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedText, setEditedText] = React.useState('');

  React.useEffect(() => {
    if (transcription) {
      setEditedText(transcription.text);
    }
  }, [transcription]);

  if (!transcription) return null;

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-medium">Transcription</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-blue-500 hover:text-blue-600"
        >
          {isEditing ? 'Save' : 'Edit'}
        </button>
      </div>

      {isEditing ? (
        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          className="w-full h-64 p-2 border rounded-md"
        />
      ) : (
        <div className="space-y-4">
          {transcription.segments.map((segment, index) => (
            <div key={index} className="flex gap-4">
              <span className="text-gray-500 w-20">
                {formatTime(segment.start)} - {formatTime(segment.end)}
              </span>
              <p>{segment.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper function to format time
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};