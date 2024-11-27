// src/renderer/components/MainContent.tsx
import React from 'react';
import { useSettings } from '../hooks/useSettings';

const MainContent: React.FC = () => {
  const { data: settings, isLoading } = useSettings();

  return (
    <div className="flex-1 p-8">
      <h2 className="text-2xl font-bold mb-4">Welcome</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <p>Main content area</p>
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Database Test:</h3>
          {isLoading ? (
            <p>Loading settings...</p>
          ) : (
            <pre className="mt-4 bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(settings, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainContent;