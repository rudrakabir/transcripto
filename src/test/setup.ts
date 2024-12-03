import { vi } from 'vitest';
import type { Recording } from '../shared/types';

// Mock IPC functions
const mockElectron = {
  ipcRenderer: {
    invoke: vi.fn(async (channel: string): Promise<Recording[] | undefined> => {
      if (channel === 'getAudioFiles') {
        return [];
      }
      return undefined;
    }),
    on: vi.fn(),
    send: vi.fn(),
  },
};

// Mock file system functions
const mockFs = {
  readFile: vi.fn(),
  writeFile: vi.fn(),
};

// Set up global mocks
vi.stubGlobal('electron', mockElectron);
vi.stubGlobal('fs', mockFs);

// Clean up mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});