import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#050505',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// ============================================================
// IPC Handlers
// ============================================================

// Open file dialog
ipcMain.handle('dialog:openFile', async (_, options) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: options?.filters || [
      { name: 'AIF-BIN Files', extensions: ['aif-bin'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return result.filePaths;
});

// Open folder dialog
ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  return result.filePaths[0];
});

// Save file dialog
ipcMain.handle('dialog:saveFile', async (_, options) => {
  const result = await dialog.showSaveDialog({
    filters: options?.filters || [
      { name: 'AIF-BIN Files', extensions: ['aif-bin'] },
    ],
  });
  return result.filePath;
});

// Read file
ipcMain.handle('fs:readFile', async (_, filePath) => {
  return fs.readFileSync(filePath);
});

// Write file
ipcMain.handle('fs:writeFile', async (_, filePath, data) => {
  fs.writeFileSync(filePath, Buffer.from(data));
  return true;
});

// List directory
ipcMain.handle('fs:readDir', async (_, dirPath) => {
  return fs.readdirSync(dirPath).filter(f => f.endsWith('.aif-bin'));
});

// Run Python ingestor
ipcMain.handle('ingest:run', async (_, options) => {
  const { source, output, provider } = options;
  
  return new Promise((resolve, reject) => {
    const args = ['ingest', source, '-o', output];
    if (provider) args.push('-p', provider);
    
    // Path to the ingestor script
    const ingestorPath = path.join(__dirname, '../../aifbin_ingest.py');
    
    const proc = spawn('python3', [ingestorPath, ...args]);
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout });
      } else {
        reject({ success: false, error: stderr });
      }
    });
  });
});

// Run semantic search
ipcMain.handle('search:run', async (_, options) => {
  const { query, directory } = options;
  
  return new Promise((resolve, reject) => {
    const proCliPath = path.join(__dirname, '../../aifbin_pro.py');
    const args = ['search', query, '-d', directory];
    
    const proc = spawn('python3', [proCliPath, ...args]);
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      resolve({ output: stdout, error: stderr, code });
    });
  });
});
