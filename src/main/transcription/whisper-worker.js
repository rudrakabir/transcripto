// src/main/transcription/whisper-worker.js
const { workerData, parentPort } = require('worker_threads');
const { execFile } = require('child_process');
const path = require('path');

const whisperPath = path.join(__dirname, '../../deps/whisper.cpp/main');

function runWhisper() {
  const args = [
    '-m', workerData.modelPath,
    '-f', workerData.filePath,
    '-l', workerData.language,
    '--output-json',
    '--print-progress'
  ];

  const whisperProcess = execFile(whisperPath, args);
  
  whisperProcess.stderr.on('data', (data) => {
    // Parse progress information
    const progressMatch = data.toString().match(/progress: (\d+)%/);
    if (progressMatch) {
      parentPort.postMessage({
        type: 'progress',
        progress: parseInt(progressMatch[1])
      });
    }
  });

  let output = '';
  whisperProcess.stdout.on('data', (data) => {
    output += data;
  });

  whisperProcess.on('close', (code) => {
    if (code === 0) {
      try {
        const result = JSON.parse(output);
        parentPort.postMessage({
          type: 'result',
          data: result
        });
      } catch (error) {
        parentPort.postMessage({
          type: 'error',
          error: 'Failed to parse whisper output'
        });
      }
    } else {
      parentPort.postMessage({
        type: 'error',
        error: `Whisper process exited with code ${code}`
      });
    }
  });
}

runWhisper();