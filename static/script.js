const dropZone     = document.getElementById('dropZone');
const fileInput    = document.getElementById('fileInput');
const filePreview  = document.getElementById('filePreview');
const fileName     = document.getElementById('fileName');
const fileSize     = document.getElementById('fileSize');
const fileIcon     = document.getElementById('fileIcon');
const removeBtn    = document.getElementById('removeBtn');
const summarizeBtn = document.getElementById('summarizeBtn');
const btnText      = document.getElementById('btnText');

const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const errorSection   = document.getElementById('errorSection');
const uploadSection  = document.querySelector('.upload-section');

let selectedFile = null;

// ── File Icon Mapping ────────────────────────────────────────
function getIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (ext === 'pdf')  return '📕';
  if (ext === 'docx') return '📘';
  return '📄';
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ── Show Selected File ───────────────────────────────────────
function showFile(file) {
  selectedFile = file;
  fileName.textContent = file.name;
  fileSize.textContent = formatSize(file.size);
  fileIcon.textContent = getIcon(file.name);
  filePreview.style.display = 'block';
  dropZone.style.display = 'none';
}

function resetUpload() {
  selectedFile = null;
  fileInput.value = '';
  filePreview.style.display = 'none';
  dropZone.style.display = 'block';
}

// ── Click to Upload ──────────────────────────────────────────
dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) showFile(e.target.files[0]);
});

removeBtn.addEventListener('click', resetUpload);

// ── Drag & Drop ──────────────────────────────────────────────
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) showFile(file);
});

// ── Loading Steps Animation ──────────────────────────────────
function animateSteps() {
  const steps = [
    document.getElementById('step1'),
    document.getElementById('step2'),
    document.getElementById('step3'),
  ];
  let i = 0;
  // Reset
  steps.forEach(s => { s.classList.remove('active', 'done'); });
  steps[0].classList.add('active');

  const interval = setInterval(() => {
    if (i < steps.length - 1) {
      steps[i].classList.remove('active');
      steps[i].classList.add('done');
      i++;
      steps[i].classList.add('active');
    } else {
      clearInterval(interval);
    }
  }, 4000);
  return interval;
}

// ── Show / Hide Sections ─────────────────────────────────────
function showSection(name) {
  uploadSection.style.display  = name === 'upload'  ? 'block' : 'none';
  loadingSection.style.display = name === 'loading' ? 'block' : 'none';
  resultsSection.style.display = name === 'results' ? 'block' : 'none';
  errorSection.style.display   = name === 'error'   ? 'block' : 'none';
}

// ── Summarize ────────────────────────────────────────────────
summarizeBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  showSection('loading');
  const stepInterval = animateSteps();

  const formData = new FormData();
  formData.append('file', selectedFile);

  try {
    const response = await fetch('/summarize', {
      method: 'POST',
      body: formData,
    });

    clearInterval(stepInterval);

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Request failed');
    }

    const data = await response.json();
    renderResults(data);
    showSection('results');

  } catch (err) {
    clearInterval(stepInterval);
    document.getElementById('errorMsg').textContent = err.message;
    showSection('error');
  }
});

// ── Render Results ───────────────────────────────────────────
function renderResults(data) {
  document.getElementById('resultsFilename').textContent = data.filename;
  document.getElementById('resultsMeta').textContent =
    `${data.word_count.toLocaleString()} words processed`;

  document.getElementById('summaryText').textContent = data.summary || 'No summary generated.';

  const list = document.getElementById('bulletsList');
  list.innerHTML = '';
  if (data.bullets && data.bullets.length > 0) {
    data.bullets.forEach(b => {
      const li = document.createElement('li');
      li.textContent = b;
      list.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = 'No key points extracted.';
    list.appendChild(li);
  }
}

// ── New File ─────────────────────────────────────────────────
document.getElementById('newBtn').addEventListener('click', () => {
  resetUpload();
  showSection('upload');
});

document.getElementById('retryBtn').addEventListener('click', () => {
  resetUpload();
  showSection('upload');
});

// ── Copy Buttons ─────────────────────────────────────────────
document.getElementById('copySummary').addEventListener('click', function() {
  const text = document.getElementById('summaryText').textContent;
  navigator.clipboard.writeText(text).then(() => flashCopied(this));
});

document.getElementById('copyAll').addEventListener('click', function() {
  const summary = document.getElementById('summaryText').textContent;
  const bullets = [...document.querySelectorAll('#bulletsList li')]
    .map(li => '• ' + li.textContent).join('\n');
  const full = `SUMMARY\n${summary}\n\nKEY POINTS\n${bullets}`;
  navigator.clipboard.writeText(full).then(() => flashCopied(this));
});

function flashCopied(btn) {
  const original = btn.textContent;
  btn.textContent = '✓ Copied!';
  btn.classList.add('copied');
  setTimeout(() => {
    btn.textContent = original;
    btn.classList.remove('copied');
  }, 2000);
}
