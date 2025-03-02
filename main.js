const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const Database = require('better-sqlite3')
const fs = require('fs')
const PDFDocument = require('pdfkit')


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

  ipcMain.on('get-record-count', (event) => {
    const stmt = db.prepare('SELECT COUNT(*) AS total FROM records');
    const result = stmt.get();
    event.reply('record-count', result.total);
});

  ipcMain.on('generate-record-pdf', async (event, recordId) => {
    const stmt = db.prepare('SELECT * FROM records WHERE id = ?');
    const record = stmt.get(recordId);

    if (!record) {
        console.error("Record not found!");
        return;
    }

    const { filePath } = await dialog.showSaveDialog({
        title: "Save Clinical Record as PDF",
        defaultPath: `Clinical_Record_${record.fullname}.pdf`,
        filters: [{ name: "PDF Files", extensions: ["pdf"] }]
    });

    if (!filePath) return; // User canceled

    const doc = new PDFDocument({
        size: [360, 432], // 5 x 6 inches (double the height)
        margins: { top: 20, bottom: 40, left: 25, right: 25 }
    });

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Header
    doc.fontSize(18).text("Clinical Record", { align: 'center' });
    doc.fontSize(9).text(
      "Purely for entertainment purposes only, not valid for any real use.", { align: 'center', underline: true });
    doc.moveDown(1.5);

    // Record Details
    doc.fontSize(14).text(`Full Name: ${record.fullname}`);
    doc.text(`Section: ${record.section}`);
    doc.text(`Strand: ${record.strand}`);
    doc.moveDown(0.5);
    doc.text(`Diagnosis:`, { underline: true });
    doc.text(record.diagnosis, { indent: 20 });
    doc.moveDown(0.5);
    doc.text(`Prescription:`, { underline: true });
    doc.text(record.prescription, { indent: 20 });
    doc.moveDown(1);
    doc.text(`Date: ${record.date}`);
    doc.moveDown(2);

    // Footer Signature
    doc.fontSize(12).text("Certified:", { align: 'left' });
    doc.moveDown(2);
    doc.font("Helvetica-Bold").text("Lee-Anne Eunice Interno", { align: 'left' });
    doc.font("Helvetica").text("Booth Facilitator", { align: 'left' });

    doc.moveDown(2);
    doc.font("Helvetica-Bold").text("Miguel Buccat", { align: 'left' });
    doc.font("Helvetica").text("Booth Facilitator", { align: 'left' });

    doc.end();

    writeStream.on('finish', () => {
        console.log("PDF saved successfully!");
    });
});
}

app.whenReady().then(() => {
  createWindow()
})