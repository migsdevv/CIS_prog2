const { ipcRenderer } = require('electron');

async function loadRecords() {
  const records = await ipcRenderer.invoke('get-records');
  const recordsTableBody = document.getElementById('recordsTableBody');
  if (!recordsTableBody) return;

  recordsTableBody.innerHTML = '';
  records.forEach(record => {
    const row = document.createElement('tr');
    row.innerHTML = `
          <td>${record.id}</td>
          <td>${record.fullname}</td>
          <td>${record.section}</td>
          <td>${record.strand}</td>
          <td>${record.diagnosis}</td>
          <td>${record.prescription}</td>
          <td>${record.date}</td>
          <td>
              <button class="btn btn-danger btn-sm" onclick="deleteRecord(${record.id})">Delete</button>
              <button class="btn btn-info btn-sm" onclick="generatePDF(${record.id})">Generate PDF</button>
          </td>
      `;
    recordsTableBody.appendChild(row);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const form = document.getElementById('recordForm');

  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      ipcRenderer.send('login-success');
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      ipcRenderer.send('logout');
    });
  }

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const fullname = document.getElementById('fullName').value;
      const section = document.getElementById('section').value;
      const strand = document.getElementById('strand').value;
      const diagnosis = document.getElementById('diagnosis').value;
      const prescription = document.getElementById('prescription').value;
      const date = document.getElementById('date').value;

      await ipcRenderer.invoke('add-record', { fullname, section, strand, diagnosis, prescription, date });
      viewRecordsPage(); // Redirect after adding
    });
  }

  loadRecords();
});

async function deleteRecord(id) {
  await ipcRenderer.invoke('delete-record', id);
  loadRecords(); // Refresh table
}

function viewRecordsPage() {
  ipcRenderer.send('view-records-page');
}

function createNewRecordPage() {
  ipcRenderer.send('create-new-record-page');
}

function dashboardPage() {
  ipcRenderer.send('dashboard-page');
}

function generatePDF(recordId) {
  ipcRenderer.send('generate-record-pdf', recordId);
}
