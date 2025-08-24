import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win; // Referencia global para no ser eliminado por el garbage collector

function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 650,
    title: 'mind-weaver',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // preload: path.join(__dirname, 'preload.js')
    },
  });
  win.setMenuBarVisibility(false);

  // Carga el archivo index.html de tu aplicación.
  win.loadFile(path.join(__dirname, 'dist', 'index.html'));

// win.webContents.openDevTools(); // Descomenta para abrir DevTools al inicio
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // En macOS, las aplicaciones suelen permanecer activas hasta que se cierran explícitamente.
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // En macOS, es común recrear una ventana si se hace clic en el icono del dock.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});