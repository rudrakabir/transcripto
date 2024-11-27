interface Window {
  electron: {
    getSettings: () => Promise<any[]>;
    saveSetting: (key: string, value: string) => Promise<{ success: boolean }>;
  }
}