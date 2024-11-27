import React from 'react';
import { useSettings } from '../hooks/useSettings';
import { 
  useTranscriptionStatus,
  useTranscriptionProgress,
  useTranscription
} from '../hooks/useTranscription';
import { FileSelection } from './FileSelection';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Timer 
} from "lucide-react";
import { TranscriptionControls } from './TranscriptionComponents';


// Helper function for time formatting
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

interface TranscriptionPanelProps {
  recordingId: string;
}

interface StatusBadgeProps {
  status?: string;
}

interface TranscriptionOutputProps {
  recordingId: string;
}

const MainContent = () => {
  const { data: settings } = useSettings();
  const [selectedRecordingId, setSelectedRecordingId] = React.useState('');
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Audio Transcription</h1>
          <p className="mt-2 text-gray-600">Transform your audio files into text</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Management Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                File Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileSelection
                onFileSelect={setSelectedRecordingId}
                selectedRecordingId={selectedRecordingId}
              />
            </CardContent>
          </Card>

          {/* Transcription Interface */}
          <div className="space-y-6">
            {selectedRecordingId ? (
              <>
                <TranscriptionPanel recordingId={selectedRecordingId} />
                <TranscriptionOutput recordingId={selectedRecordingId} />
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No File Selected</h3>
                    <p className="mt-2 text-gray-500">Select an audio file to begin transcription</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TranscriptionPanel: React.FC<TranscriptionPanelProps> = ({ recordingId }) => {
  const { data: status } = useTranscriptionStatus(recordingId);
  const { data: progress } = useTranscriptionProgress(recordingId);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Transcription Status</span>
          <StatusBadge status={status?.status} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TranscriptionControls recordingId={recordingId} />
        {progress?.status === 'processing' && (
          <div className="mt-4">
            <Progress value={progress.progress} className="h-2" />
            <p className="mt-2 text-sm text-gray-600 text-right">{progress.progress}% complete</p>
          </div>
        )}
        {progress?.status === 'error' && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{progress.error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status?: string) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle2, className: 'bg-green-100 text-green-800' };
      case 'processing':
        return { icon: Timer, className: 'bg-blue-100 text-blue-800' };
      case 'error':
        return { icon: AlertCircle, className: 'bg-red-100 text-red-800' };
      default:
        return { icon: FileText, className: 'bg-gray-100 text-gray-800' };
    }
  };

  const { icon: Icon, className } = getStatusConfig(status);
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${className}`}>
      <Icon className="w-4 h-4 mr-1" />
      {status || 'Ready'}
    </span>
  );
};

const TranscriptionOutput: React.FC<TranscriptionOutputProps> = ({ recordingId }) => {
  const { data: transcription } = useTranscription(recordingId);
  const [editedText, setEditedText] = React.useState('');
  
  React.useEffect(() => {
    if (transcription) {
      setEditedText(transcription.text);
    }
  }, [transcription]);

  if (!transcription) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transcription Output</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="segments">
          <TabsList>
            <TabsTrigger value="segments">Time Segments</TabsTrigger>
            <TabsTrigger value="full">Full Text</TabsTrigger>
          </TabsList>
          <TabsContent value="segments" className="mt-4">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {transcription.segments.map((segment, index) => (
                <div key={index} className="flex gap-4 p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm font-mono text-gray-500 whitespace-nowrap">
                    {formatTime(segment.start)} - {formatTime(segment.end)}
                  </span>
                  <p className="text-gray-700">{segment.text}</p>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="full" className="mt-4">
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full h-96 p-3 border rounded-md"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MainContent;