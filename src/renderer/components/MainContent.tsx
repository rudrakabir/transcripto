import React from 'react';
import { useSettings } from '../hooks/useSettings';
import { 
  TranscriptionControls, 
  TranscriptionProgress, 
  TranscriptionView 
} from './TranscriptionComponents';
import { FileSelection } from './FileSelection';

const MainContent: React.FC = () => {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const [selectedRecordingId, setSelectedRecordingId] = React.useState<string>('');

  return (
    <div className="flex-1 p-8">
      <h2 className="text-2xl font-bold mb-4">Audio Transcription</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - File Selection */}
        <div>
          <FileSelection
            onFileSelect={setSelectedRecordingId}
            selectedRecordingId={selectedRecordingId}
          />
        </div>

        {/* Right Column - Transcription Interface */}
        <div className="space-y-6">
          {selectedRecordingId ? (
            <>
              <div className="bg-white rounded-lg shadow">
                <TranscriptionControls recordingId={selectedRecordingId} />
                <TranscriptionProgress recordingId={selectedRecordingId} />
              </div>
              
              <div className="bg-white rounded-lg shadow">
                <TranscriptionView recordingId={selectedRecordingId} />
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Select an audio file to begin transcription
            </div>
          )}
        </div>
      </div>

      {/* Settings Debug Section */}
      {settingsLoading ? (
        <div className="mt-8">Loading settings...</div>
      ) : (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Settings Debug:</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(settings, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default MainContent;