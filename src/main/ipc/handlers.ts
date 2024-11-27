interface Window {
  electron: {
    // Settings methods
    getSettings: () => Promise<Array<{ key: string; value: string; }>>;
    saveSetting: (key: string, value: string) => Promise<{ success: boolean }>;
    
    // Audio file methods
    getAudioFiles: () => Promise<Array<{
      id: string;
      name: string;
      path: string;
      createdAt: number;
      status: string;
      filesize: number;
      duration?: number;
      metadata