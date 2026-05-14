import { api, getToken, setToken, clearToken } from './api.js';

// ── 상태 ──────────────────────────────────────────────
let tasks = [];
let pollingId = null;

// ── 진입점 ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  if (getToken()) {
    showApp();
    loadTasks();
    startPolling();
  } else {
    showAuth();
  }
});

// ── 화면 전환 ─────────────────────────────────────────
function showAuth() {
  g('auth-screen').classList.remove('hidden');
  g('app-screen').classList.add('hidden');
}

function showApp() {
  g('auth-screen').classList.add('hidden');
  g('app-screen').classList.remove('hidden');
}

// ── 탭 전환 ───────────────────────────────────────────
function switchTab(tab) {
  const isLogin = tab === 'login';
  g('login-form').classList.toggle('hidden', !isLogin);
  g('register-form').classList.toggle('hidden', isLogin);

  const activeClass = 'flex-1 py-2 rounded-lg text-sm font-medium transition-colors bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm min-h-[44px]';
  const inactiveClass = 'flex-1 py-2 rounded-lg text-sm font-medium transition-colors text-zinc-500 dark:text-zinc-400 min-h-[44px]';
  g('tab-login').className    = isLogin  ? activeClass : inactiveClass;
  g('tab-register').className = !isLogin ? activeClass : inactiveClass;
}

// ── 인증 ──────────────────────────────────────────────
async function handleLogin() {
  const email    = g('login-email').value.trim();
  const password = g('login-password').value;
  setError('login-error', '');

  if (!email || !password) { setError('login-error', '이메일과 비밀번호를 입력해주세요.'); return; }

  try {
    const data = await api.auth.login(email, password);
    setToken(data.access_token);
    showApp();
    loadTasks();
    startPolling();
  } catch (e) {
    setError('login-error', e.message);
  }
}

async function handleRegister() {
  const name     = g('reg-name').value.trim();
  const email    = g('reg-email').value.trim();
  const password = g('reg-password').value;
  setError('reg-error', '');

  if (!email || !password) { setError('reg-error', '이메일과 비밀번호를 입력해주세요.'); return; }
  if (password.length < 8)  { setError('reg-error', '비밀번호는 8자 이상이어야 합니다.');  return; }

  try {
    await api.auth.register(email, password, name);
    const data = await api.auth.login(email, password);
    setToken(data.access_token);
    showApp();
    loadTasks();
    startPolling();
  } catch (e) {
    setError('reg-error', e.message);
  }
}

function handleLogout() {
  clearToken();
  stopPolling();
  tasks = [];
  g('task-list').innerHTML = '';
  showAuth();
}

// ── 태스크 로드 ───────────────────────────────────────
async function loadTasks() {
  try {
    tasks = await api.tasks.list();
    renderTaskList();
  } catch (e) {
    if (e.status === 401) handleLogout();
  }
}

// ── 폴링 (3초, 탭 비활성 시 중단) ─────────────────────
function startPolling() {
  stopPolling();
  pollingId = setInterval(() => {
    if (document.visibilityState !== 'hidden') loadTasks();
  }, 3000);
}

function stopPolling() {
  if (pollingId) { clearInterval(pollingId); pollingId = null; }
}

// ── 추가 폼 토글 ──────────────────────────────────────
function toggleAddForm() {
  const body    = g('add-form-body');
  const chevron = g('add-chevron');
  const nowHidden = body.classList.toggle('hidden');
  chevron.textContent = nowHidden ? '▼' : '▲';
  if (!nowHidden) g('add-title').focus();
}

// ── 태스크 추가 (3-05) ────────────────────────────────
async function handleAddTask() {
  const title  = g('add-title').value.trim();
  const dueRaw = g('add-due').value;
  const status = g('add-status').value;
  setError('add-error', '');

  if (!title) { setError('add-error', '제목을 입력해주세요.'); return; }

  try {
    await api.tasks.create({
      title,
      status,
      due_at: dueRaw ? new Date(dueRaw).toISOString() : null,
    });
    g('add-title').value  = '';
    g('add-due').value    = '';
    g('add-status').value = 'todo';
    await loadTasks();
  } catch (e) {
    if (e.status === 401) { handleLogout(); return; }
    setError('add-error', e.message);
  }
}

// ── 수정 모달 (3-06) ─────────────────────────────────
async function openModal(id) {
  try {
    const task = await api.tasks.get(id);
    g('edit-id').value     = task.id;
    g('edit-title').value  = task.title;
    g('edit-desc').value   = task.description ?? '';
    g('edit-status').value = task.status;
    g('edit-due').value    = task.due_at ? toDatetimeLocal(task.due_at) : '';
    setError('edit-error', '');
    g('modal-overlay').classList.remove('hidden');
    g('edit-title').focus();
  } catch (e) {
    if (e.status === 401) handleLogout();
  }
}

function closeModal() {
  g('modal-overlay').classList.add('hidden');
}

async function handleUpdateTask() {
  const id     = g('edit-id').value;
  const title  = g('edit-title').value.trim();
  const dueRaw = g('edit-due').value;
  setError('edit-error', '');

  if (!title) { setError('edit-error', '제목을 입력해주세요.'); return; }

  try {
    await api.tasks.update(id, {
      title,
      description: g('edit-desc').value.trim() || null,
      status:      g('edit-status').value,
      due_at:      dueRaw ? new Date(dueRaw).toISOString() : null,
    });
    closeModal();
    await loadTasks();
  } catch (e) {
    if (e.status === 401) { handleLogout(); return; }
    setError('edit-error', e.message);
  }
}

// ── 삭제 (3-07) ───────────────────────────────────────
function confirmDelete(id) {
  const card = document.querySelector(`[data-id="${id}"]`);
  card.querySelector('.card-normal').classList.add('hidden');
  card.querySelector('.card-confirm').classList.remove('hidden');
}

function cancelDelete(id) {
  const card = document.querySelector(`[data-id="${id}"]`);
  card.querySelector('.card-normal').classList.remove('hidden');
  card.querySelector('.card-confirm').classList.add('hidden');
}

async function handleDeleteTask(id) {
  try {
    await api.tasks.remove(id);
    await loadTasks();
  } catch (e) {
    if (e.status === 401) handleLogout();
  }
}

// ── 테마 (3-02) ───────────────────────────────────────
function initTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  g('theme-icon').textContent = isDark ? '☀️' : '🌙';
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  g('theme-icon').textContent = isDark ? '☀️' : '🌙';
}

// ── 렌더링 (3-04) ─────────────────────────────────────
const STATUS_LABEL = { todo: '할 일', in_progress: '진행 중', done: '완료' };
const STATUS_CLASS = {
  todo:        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  done:        'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

function renderTaskList() {
  const list  = g('task-list');
  const empty = g('empty-state');

  if (tasks.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  list.innerHTML = tasks.map(renderCard).join('');
}

function renderCard(task) {
  const badge = `<span class="px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASS[task.status]}">${STATUS_LABEL[task.status]}</span>`;
  const due   = task.due_at
    ? `<span class="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">${formatDueAt(task.due_at)}</span>`
    : '';

  return `
<div data-id="${task.id}" class="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-zinc-200/50 dark:border-zinc-700/50 overflow-hidden">
  <div class="card-normal">
    <button onclick="openModal(${task.id})"
      class="w-full px-4 py-3.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/40 transition-colors">
      <div class="flex items-start justify-between gap-3">
        <span class="text-sm font-medium text-zinc-900 dark:text-white leading-snug flex-1 min-w-0 break-words">${escHtml(task.title)}</span>
        <div class="flex items-center gap-2 flex-shrink-0 pt-0.5">${badge}${due}</div>
      </div>
    </button>
    <div class="px-4 pb-2.5 flex justify-end">
      <button onclick="event.stopPropagation(); confirmDelete(${task.id})"
        title="삭제"
        class="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
        🗑️
      </button>
    </div>
  </div>
  <div class="card-confirm hidden px-4 py-3.5 flex items-center justify-between gap-3 bg-red-50/60 dark:bg-red-900/10">
    <span class="text-sm text-zinc-600 dark:text-zinc-400">정말 삭제할까요?</span>
    <div class="flex gap-2">
      <button onclick="cancelDelete(${task.id})"
        class="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-600 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors min-h-[36px]">
        취소
      </button>
      <button onclick="handleDeleteTask(${task.id})"
        class="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors min-h-[36px]">
        삭제
      </button>
    </div>
  </div>
</div>`;
}

// ── 유틸 ──────────────────────────────────────────────
function g(id) { return document.getElementById(id); }

function setError(id, msg) {
  const el = g(id);
  el.textContent = msg;
  el.classList.toggle('hidden', !msg);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// D-N HH:MM 형식 (UTC 정규화)
function formatDueAt(dueAtStr) {
  const due = new Date(dueAtStr.endsWith('Z') ? dueAtStr : dueAtStr + 'Z');
  const now = new Date();

  // 날짜만 비교 (시간 제거)
  const dueDay  = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((dueDay - today) / 864e5);

  const h = String(due.getHours()).padStart(2, '0');
  const m = String(due.getMinutes()).padStart(2, '0');

  if (diffDays > 0) return `D-${diffDays} ${h}:${m}`;
  if (diffDays === 0) return `D-0 ${h}:${m}`;
  return `D+${Math.abs(diffDays)} ${h}:${m}`;
}

// UTC 문자열 → datetime-local 입력값 (로컬 시간)
function toDatetimeLocal(utcStr) {
  const d = new Date(utcStr.endsWith('Z') ? utcStr : utcStr + 'Z');
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── 글로벌 노출 (HTML onclick에서 호출) ───────────────
Object.assign(window, {
  switchTab,
  handleLogin,
  handleRegister,
  handleLogout,
  toggleTheme,
  toggleAddForm,
  handleAddTask,
  openModal,
  closeModal,
  handleUpdateTask,
  confirmDelete,
  cancelDelete,
  handleDeleteTask,
});
