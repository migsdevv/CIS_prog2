const { app, BrowserWindow, ipcMain } = require('electron')
const Database = require('better-sqlite3')

const db = new Database('clinic_records.db')

db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullname TEXT NOT NULL,
    section TEXT NOT NULL,
    strand TEXT NOT NULL,
    diagnosis TEXT NOT NULL,
    prescription TEXT NOT NULL,
    date TEXT NOT NULL
  )
`)

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('./views/landing.html')

  ipcMain.on('login-success', () => {
    win.loadFile('./views/dashboard.html');
  })

  ipcMain.on('logout', () => {
    win.loadFile('./views/landing.html');
  })

  ipcMain.on('create-new-record-page', () => {
    win.loadFile('./views/create-record.html')
  })

  ipcMain.on('view-records-page', () => {
    win.loadFile('./views/view-records.html')
  })

  ipcMain.on('dashboard-page', () => {
    win.loadFile('./views/dashboard.html')
  })

  ipcMain.handle('get-records', () => {
    const stmt = db.prepare('SELECT * FROM records')
    return stmt.all()
  })

  ipcMain.handle('add-record', (event, { fullname, section, strand, diagnosis, prescription, date }) => {
    const stmt = db.prepare('INSERT INTO records (fullname, section, strand, diagnosis, prescription, date) VALUES (?, ?, ?, ?, ?, ?)')
    stmt.run(fullname, section, strand, diagnosis, prescription, date)
    return { success: true }
  })

  ipcMain.handle('delete-record', (event, id) => {
    const stmt = db.prepare('DELETE FROM records WHERE id = ?')
    stmt.run(id)
    return { success: true }
  })
}

app.whenReady().then(() => {
  createWindow()
})