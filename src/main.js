const { app, BrowserWindow, dialog, desktopCapturer, ipcMain, session, webContents } = require('electron');
const path = require('path');
const { permission } = require('process');
const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY = __dirname+'/preload.js'
const MAIN_WINDOW_WEBPACK_ENTRY = __dirname+'/index.html'
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    // and load the index.html of the app.
    mainWindow.loadFile(MAIN_WINDOW_WEBPACK_ENTRY);

    // Open the DevTools.
    mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
        session.defaultSession.setPermissionRequestHandler((webContents,permission,callback)=>{
            return callback(false)
        })
        session.defaultSession.setDisplayMediaRequestHandler(
          (request, callback) => {
            desktopCapturer
              .getSources({ types: ["screen"] })
              .then((sources) => {
                // Grant access to the first screen found.
                callback({ video: sources[0], audio: "loopback" });
              });
            // If true, use the system picker if available.
            // Note: this is currently experimental. If the system picker
            // is available, it will be used and the media request handler
            // will not be invoked.
          },
          { useSystemPicker: true }
        );

    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.handle('getSources', async () => {
    console.log('getting sourcess...');
    return await desktopCapturer.getSources({ types: ['window', 'screen'] })
})

ipcMain.handle('showSaveDialog', async () => {
    return await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `vid-${Date.now()}.webm`
    });
})

ipcMain.handle('getOperatingSystem', () => {
    return process.platform
})
