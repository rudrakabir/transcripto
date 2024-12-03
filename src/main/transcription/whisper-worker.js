// src/main/transcription/whisper-worker.js
const { workerData, parentPort } = require('worker_threads');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

// Validate required worker data
if (!workerData || !workerData.modelPath || !workerData.filePath) {
  parentPort.postMessage({
    type: 'error',
    error: 'Missing required worker data'
  });
  process.exit(1);
}

// Get absolute path to whisper executable
const whisperPath = path.resolve(__dirname, '../../deps/whisper.cpp/main');

// Validate whisper executable exists
if (!fs.existsSync(whisperPath)) {
  parentPort.postMessage({
    type: 'error',
    error: 'Whisper executable not found'
  });
  process.exit(1);
}

function runWhisper() {
  const args = [
    '-m', workerData.modelPath,
    '-f', workerData.filePath,
    '--output-json',
    '--print-progress'
  ];

  // Add optional language parameter if specified
  if (workerData.language) {
    args.push('-l', workerData.language);
  }

  // Create child process with timeout
  const whisperProcess = execFile(whisperPath, args, { timeout: 3600000 }); // 1 hour timeout
  
  let lastProgress = 0;
  whisperProcess.stderr.on('data', (data) => {
    try {
      // Parse progress information
      const progressMatch = data.toString().match(/progress: (\d+)%/);
      if (progressMatch) {
        const progress = parseInt(progressMatch[1]);
        // Only send progress updates if there's been a change
        if (progress !== lastProgress) {
          lastProgress = progress;
          parentPort.postMessage({
            type: 'progress',
            progress
          });
        }
      }
    } catch (error) {
      console.error('Error parsing progress:', error);
    }
  });

  let output = '';
  whisperProcess.stdout.on('data', (data) => {
    output += data;
  });

  whisperProcess.on('error', (error) => {
    parentPort.postMessage({
      type: 'error',
      error: `Failed to start whisper process: ${error.message}`
    });
  });

  whisperProcess.on('close', (code, signal) => {
    if (signal) {
      parentPort.postMessage({
        type: 'error',
        error: `Process was killed with signal ${signal}`
      });
      return;
    }

    if (code === 0 && output) {
      try {
        const result = JSON.parse(output);
        parentPort.postMessage({
          type: 'result',
          data: result
        });
      } catch (error) {
        parentPort.postMessage({
          type: 'error',
          error: `Failed to parse whisper output: ${error.message}`
        });
      }
    } else {
      parentPort.postMessage({
        type: 'error',
        error: code === null 
          ? 'Process timed out' 
          : `Whisper process exited with code ${code}`
      });
    }
  });

  // Handle worker thread termination
  parentPort.on('message', (message) => {
    if (message === 'terminate') {
      try {
        whisperProcess.kill();
      } catch (error) {
        console.error('Failed to kill whisper process:', error);
      }
    }
  });
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  parentPort.postMessage({
    type: 'error',
    error: `Uncaught error in worker: ${error.message}`
  });
  process.exit(1);
});

runWhisper();