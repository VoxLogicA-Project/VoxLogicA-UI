import { app, BrowserWindow } from 'electron';

// Import the SvelteKit Node server
import { handler } from './build/handler.js';

import express from 'express'
const server = express();
const PORT = 3000; // Port for the local server

let mainWindow;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false, // Disable Node integration for security
            contextIsolation: true, // Isolate renderer process
        }
    });

    // Load the local server's URL
    mainWindow.loadURL(`http://localhost:${PORT}`);
}

// Start the SvelteKit Node server
app.on('ready', () => {
    server.use(handler); // Attach the SvelteKit handler
    server.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        createMainWindow();
    });
});

// Handle window close
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});