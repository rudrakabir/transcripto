import React from 'react';
import { useSettings } from '../hooks/useSettings';

const MainContent: React.FC = () => {
  const { data: settings, isLoading } = useSettings();

  return (
    <div className="flex-1 p-8">
      <h2 className="text-2xl font-bold mb-4">Welcome</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <p>Main content area</p>
        <pre className="mt-4 bg-gray-100 p-2 rounded">
          {JSON.stringify(settings, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default MainContent;