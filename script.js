// ============================================================
// FUNÇÕES GLOBAIS (UI) - Protegidas contra falhas de dependências
// ============================================================
// switchTab movido para o HTML diretamente para garantir funcionamento imediato.


// ============================================================
// CONFIGURAÇÃO SUPABASE
// ⚠️  Substitua os valores abaixo com as credenciais do seu projeto
// Encontre em: supabase.com → Seu projeto → Project Settings → API
// ============================================================
const SUPABASE_URL = 'https://payzflctlulbxrqzvpbz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBheXpmbGN0bHVsYnhycXp2cGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MjczMDYsImV4cCI6MjA5NzUwMzMwNn0.8x3mnqDkWIBmGysX7kC4PBK4KELTASq_4iDk74-9eJ0';

let supabase = null;
if (window.supabase) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.error("ERRO CRÍTICO: Supabase não foi carregado. Verifique sua conexão, bloqueadores de anúncios ou faça um Hard Refresh (Cmd/Ctrl + Shift + R).");
  // Aguarda o DOM carregar para mostrar o erro na tela
  window.addEventListener('DOMContentLoaded', () => {
    const authMsg = document.getElementById('authMessage');
    if (authMsg) {
      authMsg.textContent = 'Erro ao carregar o sistema (Cache antigo). Faça um Hard Refresh na página ou limpe os dados do site.';
      authMsg.className = 'auth-message error';
    }
  });
}


// ============================================================
// CONSTANTES E UTILITÁRIOS
// ============================================================
const LOCAL_FALLBACK_KEY = 'bancaApostasMobileLocal_v1';
const TIME_ZONE = 'America/Sao_Paulo';

function saoPauloParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date).reduce((acc, part) => { acc[part.type] = part.value; return acc; }, {});
  return {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    iso: `${parts.year}-${parts.month}-${parts.day}`
  };
}
const todayISO = () => saoPauloParts().iso;
const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (v) => `${(Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const escapeHTML = (v) => String(v).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const formatDate = (s) => { const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };
const monthKey = (s) => s.slice(0, 7);
const yearKey = (s) => s.slice(0, 4);

// ============================================================
// ESTADO DA APLICAÇÃO
// ============================================================
const defaultSettings = {
  initialBankroll: 0, unitStake: 0, monthlyGoal: 0, dailyLossLimit: 0,
  neonTheme: true, autoSave: true, confirmResult: true
};

let state = {
  user: null,
  settings: { ...defaultSettings },
  bets: [],
  isOnline: navigator.onLine
};
let currentRefundId = null;
let chartRange = 'daily';

// ============================================================
// REFERÊNCIAS DOM
// ============================================================
const els = {
  // Auth
  authScreen: document.querySelector('#authScreen'),
  appMain: document.querySelector('#appMain'),
  tabLogin: document.querySelector('#tabLogin'),
  tabSignup: document.querySelector('#tabSignup'),
  loginForm: document.querySelector('#loginForm'),
  signupForm: document.querySelector('#signupForm'),
  loginEmail: document.querySelector('#loginEmail'),
  loginPassword: document.querySelector('#loginPassword'),
  signupEmail: document.querySelector('#signupEmail'),
  signupPassword: document.querySelector('#signupPassword'),
  signupConfirm: document.querySelector('#signupConfirm'),
  loginBtn: document.querySelector('#loginBtn'),
  signupBtn: document.querySelector('#signupBtn'),
  googleBtn: document.querySelector('#googleBtn'),
  authMessage: document.querySelector('#authMessage'),
  // User
  userMenuBtn: document.querySelector('#userMenuBtn'),
  userMenu: document.querySelector('#userMenu'),
  userMenuEmail: document.querySelector('#userMenuEmail'),
  signOutBtn: document.querySelector('#signOutBtn'),
  syncStatus: document.querySelector('#syncStatus'),
  // App
  currentBalance: document.querySelector('#currentBalance'),
  betForm: document.querySelector('#betForm'),
  betDate: document.querySelector('#betDate'),
  betDescription: document.querySelector('#betDescription'),
  betOdd: document.querySelector('#betOdd'),
  betStake: document.querySelector('#betStake'),
  possibleReturn: document.querySelector('#possibleReturn'),
  countText: document.querySelector('#countText'),
  betsList: document.querySelector('#betsList'),
  statusFilter: document.querySelector('#statusFilter'),
  todayLabel: document.querySelector('#todayLabel'),
  summaryDate: document.querySelector('#summaryDate'),
  resultDayBetsList: document.querySelector('#resultDayBetsList'),
  resultDayBetCount: document.querySelector('#resultDayBetCount'),
  dayProfit: document.querySelector('#dayProfit'),
  dayBets: document.querySelector('#dayBets'),
  greensCount: document.querySelector('#greensCount'),
  redsCount: document.querySelector('#redsCount'),
  greensPercent: document.querySelector('#greensPercent'),
  redsPercent: document.querySelector('#redsPercent'),
  roiValue: document.querySelector('#roiValue'),
  performanceChart: document.querySelector('#performanceChart'),
  topWins: document.querySelector('#topWins'),
  topLosses: document.querySelector('#topLosses'),
  initialBankroll: document.querySelector('#initialBankroll'),
  unitStake: document.querySelector('#unitStake'),
  monthlyGoal: document.querySelector('#monthlyGoal'),
  dailyLossLimit: document.querySelector('#dailyLossLimit'),
  neonTheme: document.querySelector('#neonTheme'),
  autoSave: document.querySelector('#autoSave'),
  confirmResult: document.querySelector('#confirmResult'),
  saveSettings: document.querySelector('#saveSettings'),
  resetData: document.querySelector('#resetData'),
  historyList: document.querySelector('#historyList'),
  totalStake: document.querySelector('#totalStake'),
  totalReturn: document.querySelector('#totalReturn'),
  totalProfit: document.querySelector('#totalProfit'),
  hitRate: document.querySelector('#hitRate'),
  refundDialog: document.querySelector('#refundDialog'),
  refundValue: document.querySelector('#refundValue'),
  confirmRefund: document.querySelector('#confirmRefund'),
  confirmDialog: document.querySelector('#confirmDialog'),
  confirmTitle: document.querySelector('#confirmTitle'),
  confirmMessage: document.querySelector('#confirmMessage'),
  cancelConfirm: document.querySelector('#cancelConfirm'),
  acceptConfirm: document.querySelector('#acceptConfirm')
};

// ============================================================
// STATUS DE SINCRONIZAÇÃO (indicador visual)
// ============================================================
function setSyncStatus(status) {
  // status: 'synced' | 'syncing' | 'offline' | 'error'
  const dot = els.syncStatus.querySelector('.sync-dot');
  els.syncStatus.dataset.status = status;
  dot.title = { synced: 'Sincronizado', syncing: 'Sincronizando...', offline: 'Offline', error: 'Erro de sincronização' }[status] || '';
}

// ============================================================
// CAMADA DE DADOS — Supabase
// ============================================================
async function loadBetsFromSupabase() {
  setSyncStatus('syncing');
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { setSyncStatus('error'); return; }

  // Normaliza campos snake_case → camelCase para compatibilidade com o app
  state.bets = (data || []).map(normalizeBet);
  setSyncStatus('synced');
  saveLocalFallback();
}

async function loadSettingsFromSupabase() {
  const { data } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', state.user.id)
    .single();
  if (data) {
    state.settings = {
      initialBankroll: Number(data.initial_bankroll) || 0,
      unitStake: Number(data.unit_stake) || 0,
      monthlyGoal: Number(data.monthly_goal) || 0,
      dailyLossLimit: Number(data.daily_loss_limit) || 0,
      neonTheme: data.neon_theme ?? true,
      autoSave: true,
      confirmResult: data.confirm_result ?? true
    };
  }
}

async function insertBet(bet) {
  setSyncStatus('syncing');
  const { data, error } = await supabase.from('bets').insert({
    user_id: state.user.id,
    date: bet.date,
    description: bet.description,
    odd: bet.odd,
    stake: bet.stake,
    status: bet.status,
    returned: bet.returned,
    created_at: new Date(bet.createdAt).toISOString()
  }).select().single();
  if (error) { setSyncStatus('error'); console.error(error); return null; }
  setSyncStatus('synced');
  return normalizeBet(data);
}

async function updateBet(id, fields) {
  setSyncStatus('syncing');
  const payload = {};
  if (fields.status !== undefined) payload.status = fields.status;
  if (fields.returned !== undefined) payload.returned = fields.returned;
  const { error } = await supabase.from('bets').update(payload).eq('id', id).eq('user_id', state.user.id);
  if (error) { setSyncStatus('error'); console.error(error); return; }
  setSyncStatus('synced');
}

async function deleteBetFromDB(id) {
  setSyncStatus('syncing');
  const { error } = await supabase.from('bets').delete().eq('id', id).eq('user_id', state.user.id);
  if (error) { setSyncStatus('error'); console.error(error); return; }
  setSyncStatus('synced');
}

async function upsertSettings() {
  const { error } = await supabase.from('settings').upsert({
    user_id: state.user.id,
    initial_bankroll: state.settings.initialBankroll,
    unit_stake: state.settings.unitStake,
    monthly_goal: state.settings.monthlyGoal,
    daily_loss_limit: state.settings.dailyLossLimit,
    neon_theme: state.settings.neonTheme,
    confirm_result: state.settings.confirmResult,
    updated_at: new Date().toISOString()
  });
  if (error) console.error('Erro ao salvar configurações:', error);
}

function normalizeBet(row) {
  return {
    id: row.id,
    date: typeof row.date === 'string' ? row.date.slice(0, 10) : row.date,
    description: row.description,
    odd: Number(row.odd),
    stake: Number(row.stake),
    status: row.status,
    returned: Number(row.returned),
    createdAt: new Date(row.created_at).getTime()
  };
}

// ============================================================
// FALLBACK LOCAL (offline)
// ============================================================
function saveLocalFallback() {
  try {
    localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify({ bets: state.bets, settings: state.settings }));
  } catch { /* storage full — ignore */ }
}

function loadLocalFallback() {
  try {
    const raw = localStorage.getItem(LOCAL_FALLBACK_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state.bets = Array.isArray(parsed.bets) ? parsed.bets : [];
    if (parsed.settings) state.settings = { ...defaultSettings, ...parsed.settings };
  } catch { /* corrupt data — ignore */ }
}

// ============================================================
// AUTENTICAÇÃO
// ============================================================
function showAuthScreen() {
  els.authScreen.style.display = '';
  els.appMain.style.display = 'none';
}

function showApp() {
  els.authScreen.style.display = 'none';
  els.appMain.style.display = '';
}

function showAuthMessage(msg, isError = false) {
  els.authMessage.textContent = msg;
  els.authMessage.className = `auth-message ${isError ? 'error' : 'success'}`;
}

function setAuthLoading(btn, loading) {
  btn.disabled = loading;
  btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
  btn.textContent = loading ? 'Aguarde...' : btn.dataset.originalText;
}

async function handleLogin(event) {
  event.preventDefault();
  if (!supabase) return showAuthMessage('Supabase não inicializado. Recarregue a página.', true);
  setAuthLoading(els.loginBtn, true);
  const { error } = await supabase.auth.signInWithPassword({
    email: els.loginEmail.value.trim(),
    password: els.loginPassword.value
  });
  setAuthLoading(els.loginBtn, false);
  if (error) { showAuthMessage(translateAuthError(error.message), true); return; }
  // onAuthStateChange vai cuidar do resto
}

async function handleSignup(event) {
  event.preventDefault();
  if (!supabase) return showAuthMessage('Supabase não inicializado. Recarregue a página.', true);
  if (els.signupPassword.value !== els.signupConfirm.value) {
    showAuthMessage('As senhas não coincidem.', true); return;
  }
  setAuthLoading(els.signupBtn, true);
  const { error } = await supabase.auth.signUp({
    email: els.signupEmail.value.trim(),
    password: els.signupPassword.value
  });
  setAuthLoading(els.signupBtn, false);
  if (error) { showAuthMessage(translateAuthError(error.message), true); return; }
  showAuthMessage('Conta criada! Verifique seu e-mail para confirmar.', false);
}

async function handleGoogleLogin() {
  if (!supabase) return showAuthMessage('Supabase não inicializado. Recarregue a página.', true);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href }
  });
  if (error) showAuthMessage(translateAuthError(error.message), true);
}

async function handleSignOut() {
  if (supabase) await supabase.auth.signOut();
  state.user = null;
  state.bets = [];
  state.settings = { ...defaultSettings };
  localStorage.removeItem(LOCAL_FALLBACK_KEY);
  els.userMenu.classList.add('hidden');
  showAuthScreen();
}

function translateAuthError(msg) {
  const map = {
    'Invalid login credentials': 'E-mail ou senha incorretos.',
    'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
    'User already registered': 'Este e-mail já está cadastrado.',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
    'rate limit': 'Muitas tentativas. Aguarde alguns minutos.'
  };
  for (const [key, value] of Object.entries(map)) {
    if (msg.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return msg;
}

// ============================================================
// INICIALIZAÇÃO — ouvir mudanças de sessão
// ============================================================
if (supabase) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      state.user = session.user;
      els.userMenuEmail.textContent = session.user.email;
      showApp();
      await loadSettingsFromSupabase();
      if (state.isOnline) {
        await loadBetsFromSupabase();
      } else {
        loadLocalFallback();
        setSyncStatus('offline');
      }
      renderAll();
      showView('betsView');
    } else {
      showAuthScreen();
    }
  });
}

// ============================================================
// CÁLCULOS
// ============================================================
function calcProfit(bet) {
  if (bet.status === 'pending') return 0;
  return (Number(bet.returned) || 0) - (Number(bet.stake) || 0);
}
function calcCashImpact(bet) {
  return (Number(bet.returned) || 0) - (Number(bet.stake) || 0);
}
function calcBalance() {
  return state.settings.initialBankroll + state.bets.reduce((sum, bet) => sum + calcCashImpact(bet), 0);
}
function possibleReturnValue() {
  return (Number(els.betOdd.value) || 0) * (Number(els.betStake.value) || 0);
}
function betsByDate(d) { return state.bets.filter(b => b.date === d); }
function todayBets() { return betsByDate(todayISO()); }
function selectedSummaryDate() { return els.summaryDate?.value || todayISO(); }
function settledBets() { return state.bets.filter(b => b.status !== 'pending'); }
function statusName(s) {
  return { pending: 'Pendente', green: 'Green', red: 'Red', refund: 'Reembolso' }[s] || 'Pendente';
}

// ============================================================
// NAVEGAÇÃO
// ============================================================
function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active-view', v.id === viewId));
  document.querySelectorAll('.top-tab').forEach(b => b.classList.toggle('active', b.dataset.view === viewId));
  document.querySelectorAll('.bottom-tab').forEach(b => b.classList.toggle('active', b.dataset.view === viewId));
  if (viewId === 'resultsView') drawChart();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// RENDER
// ============================================================
function renderAll() {
  const today = todayISO();
  els.betDate.value ||= today;
  if (els.summaryDate) els.summaryDate.value ||= today;
  els.betStake.value ||= state.settings.unitStake || '';
  els.currentBalance.textContent = brl(calcBalance());
  els.todayLabel.textContent = 'Fuso Brasília/São Paulo';
  renderPossibleReturn();
  renderBets();
  renderResults();
  renderSettings();
  renderHistory();
  renderStats();
  drawChart();
}

function renderPossibleReturn() {
  els.possibleReturn.textContent = brl(possibleReturnValue());
  els.countText.textContent = `${els.betDescription.value.length}/100`;
}

function renderBets() {
  const filter = els.statusFilter.value || 'all';
  const items = todayBets()
    .filter(b => filter === 'all' || b.status === filter)
    .sort((a, b) => b.createdAt - a.createdAt);
  if (!items.length) {
    els.betsList.innerHTML = '<div class="empty">Nenhuma aposta encontrada para hoje.</div>';
    return;
  }
  els.betsList.innerHTML = items.map(bet => betItemHTML(bet)).join('');
}

function betItemHTML(bet) {
  const potential = bet.odd * bet.stake;
  const profit = calcProfit(bet);
  const statusClass = bet.status === 'green' ? 'green-text' : bet.status === 'red' ? 'red-text' : '';
  return `
    <article class="bet-item">
      <div>
        <div class="bet-title">⚽ ${escapeHTML(bet.description)}</div>
        <div class="bet-meta">▣ ${formatDate(bet.date)} · Odd ${Number(bet.odd).toFixed(2)}</div>
        <div class="bet-values">
          <div><span>Apostado</span><strong>${brl(bet.stake)}</strong></div>
          <div><span>Possível retorno</span><strong class="green-text">${brl(potential)}</strong></div>
          <div><span>Resultado</span><strong class="${statusClass}">${bet.status === 'pending' ? '-' : brl(profit)}</strong></div>
        </div>
        <span class="status-pill">${statusName(bet.status)}</span>
      </div>
      <div class="actions">
        <button class="green" data-action="green" data-id="${bet.id}">✓ Green</button>
        <button class="red" data-action="red" data-id="${bet.id}">× Red</button>
        <button class="refund" data-action="refund" data-id="${bet.id}">↻ Reembolso</button>
      </div>
    </article>
  `;
}

function renderResults() {
  const date = selectedSummaryDate();
  const dayItems = betsByDate(date);
  const daySettled = dayItems.filter(b => b.status !== 'pending');
  const green = dayItems.filter(b => b.status === 'green').length;
  const red = dayItems.filter(b => b.status === 'red').length;
  const totalStakeDay = daySettled.reduce((s, b) => s + Number(b.stake || 0), 0);
  const profitDay = dayItems.reduce((s, b) => s + calcProfit(b), 0);
  const roi = totalStakeDay ? (profitDay / totalStakeDay) * 100 : 0;
  els.dayProfit.textContent = brl(profitDay);
  els.dayProfit.classList.toggle('danger', profitDay < 0);
  els.dayBets.textContent = dayItems.length;
  els.greensCount.textContent = green;
  els.redsCount.textContent = red;
  els.greensPercent.textContent = daySettled.length ? `${Math.round((green / daySettled.length) * 100)}%` : '0%';
  els.redsPercent.textContent = daySettled.length ? `${Math.round((red / daySettled.length) * 100)}%` : '0%';
  els.roiValue.textContent = pct(roi);
  els.roiValue.classList.toggle('danger', roi < 0);
  renderResultDayBets(dayItems, date);
  renderRankings();
}

function renderResultDayBets(dayItems, date) {
  if (!els.resultDayBetsList) return;
  els.resultDayBetCount.textContent = `${dayItems.length} aposta${dayItems.length === 1 ? '' : 's'} em ${formatDate(date)}`;
  const items = [...dayItems].sort((a, b) => b.createdAt - a.createdAt);
  if (!items.length) {
    els.resultDayBetsList.innerHTML = '<div class="empty">Nenhuma aposta encontrada nessa data.</div>';
    return;
  }
  els.resultDayBetsList.innerHTML = items.map(bet => {
    const potential = bet.odd * bet.stake;
    const profit = calcProfit(bet);
    const statusClass = bet.status === 'green' ? 'green-text' : bet.status === 'red' ? 'red-text' : '';
    return `
      <article class="bet-item result-bet-item">
        <div>
          <div class="bet-title">⚽ ${escapeHTML(bet.description)}</div>
          <div class="bet-meta">▣ ${formatDate(bet.date)} · Odd ${Number(bet.odd).toFixed(2)}</div>
          <div class="bet-values">
            <div><span>Apostado</span><strong>${brl(bet.stake)}</strong></div>
            <div><span>Possível retorno</span><strong class="green-text">${brl(potential)}</strong></div>
            <div><span>Resultado</span><strong class="${statusClass}">${bet.status === 'pending' ? '-' : brl(profit)}</strong></div>
          </div>
          <span class="status-pill">${statusName(bet.status)}</span>
        </div>
        <div class="actions">
          <button class="green" data-action="green" data-id="${bet.id}">✓ Green</button>
          <button class="red" data-action="red" data-id="${bet.id}">× Red</button>
          <button class="refund" data-action="refund" data-id="${bet.id}">↻ Reembolso</button>
        </div>
      </article>
    `;
  }).join('');
}

function renderRankings() {
  const ranked = settledBets().map(b => ({ ...b, profit: calcProfit(b) }));
  const wins = ranked.filter(b => b.profit > 0).sort((a, b) => b.profit - a.profit).slice(0, 3);
  const losses = ranked.filter(b => b.profit < 0).sort((a, b) => a.profit - b.profit).slice(0, 3);
  els.topWins.innerHTML = wins.length ? wins.map((b, i) => rankRow(b, i + 1)).join('') : '<div class="empty">Sem lucros ainda.</div>';
  els.topLosses.innerHTML = losses.length ? losses.map((b, i) => rankRow(b, i + 1)).join('') : '<div class="empty">Sem perdas ainda.</div>';
}

function rankRow(b, i) {
  return `
    <div class="rank-row">
      <span class="rank-no">${i}</span>
      <div><div class="rank-name">⚽ ${escapeHTML(b.description)}</div><div class="rank-meta">${formatDate(b.date)} · Odd ${Number(b.odd).toFixed(2)}</div></div>
      <strong class="rank-value">${brl(calcProfit(b))}</strong>
    </div>
  `;
}

function renderSettings() {
  els.initialBankroll.value = state.settings.initialBankroll;
  els.unitStake.value = state.settings.unitStake;
  els.monthlyGoal.value = state.settings.monthlyGoal;
  els.dailyLossLimit.value = state.settings.dailyLossLimit;
  els.neonTheme.checked = state.settings.neonTheme;
  els.autoSave.checked = true;
  els.confirmResult.checked = state.settings.confirmResult;
}

function renderHistory() {
  const groups = [...state.bets].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).reduce((acc, bet) => {
    acc[bet.date] ||= [];
    acc[bet.date].push(bet);
    return acc;
  }, {});
  const html = Object.entries(groups).map(([date, bets]) => `
    <div class="history-day">${formatDate(date)}</div>
    ${bets.map(b => `
      <div class="history-entry">
        <div class="history-info">
          <strong>${escapeHTML(b.description)}</strong>
          <small>${statusName(b.status)} · Odd ${Number(b.odd).toFixed(2)} · Apostado ${brl(b.stake)} · Resultado ${brl(calcProfit(b))}</small>
        </div>
        <button class="delete-bet-btn" data-action="delete" data-id="${b.id}" aria-label="Excluir aposta ${escapeHTML(b.description)}">🗑 Excluir</button>
      </div>
    `).join('')}
  `).join('');
  els.historyList.innerHTML = html || '<div class="empty">Histórico vazio.</div>';
}

function renderStats() {
  const settled = settledBets();
  const totalStake = settled.reduce((s, b) => s + Number(b.stake || 0), 0);
  const totalReturned = settled.reduce((s, b) => s + Number(b.returned || 0), 0);
  const totalProfit = settled.reduce((s, b) => s + calcProfit(b), 0);
  const greens = settled.filter(b => b.status === 'green').length;
  els.totalStake.textContent = brl(totalStake);
  els.totalReturn.textContent = brl(totalReturned);
  els.totalProfit.textContent = brl(totalProfit);
  els.totalProfit.classList.toggle('danger', totalProfit < 0);
  els.hitRate.textContent = settled.length ? `${Math.round((greens / settled.length) * 100)}%` : '0%';
}

// ============================================================
// GRÁFICO
// ============================================================
function daysInMonth(year, monthIndex) { return new Date(year, monthIndex + 1, 0).getDate(); }
function getPeriodTitle() {
  const { year, month } = saoPauloParts();
  if (chartRange === 'daily') return `Dias do mês ${String(month).padStart(2, '0')}/${year}`;
  if (chartRange === 'monthly') return `Meses do ano ${year}`;
  return `Anos ${year - 3} até ${year + 3}`;
}
function chartData() {
  const settled = settledBets();
  const { year: currentYear, month } = saoPauloParts();
  const currentMonthIndex = month - 1;
  if (chartRange === 'daily') {
    const days = daysInMonth(currentYear, currentMonthIndex);
    const m = String(currentMonthIndex + 1).padStart(2, '0');
    const currentMonth = `${currentYear}-${m}`;
    const points = Array.from({ length: days }, (_, i) => ({ label: String(i + 1).padStart(2, '0'), value: 0 }));
    settled.filter(b => monthKey(b.date) === currentMonth).forEach(b => {
      const di = Number(b.date.slice(8, 10)) - 1;
      if (points[di]) points[di].value += calcProfit(b);
    });
    return points;
  }
  if (chartRange === 'monthly') {
    const monthLabels = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const points = monthLabels.map(label => ({ label, value: 0 }));
    settled.filter(b => Number(yearKey(b.date)) === currentYear).forEach(b => {
      const mi = Number(b.date.slice(5, 7)) - 1;
      if (points[mi]) points[mi].value += calcProfit(b);
    });
    return points;
  }
  const startYear = currentYear - 3;
  const endYear = currentYear + 3;
  const points = Array.from({ length: endYear - startYear + 1 }, (_, i) => ({ label: String(startYear + i), value: 0 }));
  settled.forEach(b => {
    const by = Number(yearKey(b.date));
    if (by >= startYear && by <= endYear) points[by - startYear].value += calcProfit(b);
  });
  return points;
}
function drawChart() {
  const canvas = els.performanceChart;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = 240 * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const w = rect.width; const h = 240;
  ctx.clearRect(0, 0, w, h);
  const pad = { left: 48, right: 16, top: 18, bottom: 34 };
  const data = chartData();
  const values = data.map(d => d.value);
  const min = Math.min(-100, ...values);
  const max = Math.max(100, ...values);
  const range = max - min || 1;
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const x = i => pad.left + (data.length <= 1 ? 0 : (plotW / (data.length - 1)) * i);
  const y = v => pad.top + ((max - v) / range) * plotH;

  ctx.font = '600 12px system-ui';
  ctx.fillStyle = 'rgba(118,255,40,.92)';
  ctx.fillText(getPeriodTitle(), pad.left, 12);

  ctx.font = '12px system-ui';
  ctx.strokeStyle = 'rgba(255,255,255,.12)';
  ctx.fillStyle = 'rgba(245,247,244,.72)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const val = max - (range / 5) * i;
    const yy = y(val);
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pad.left, yy); ctx.lineTo(w - pad.right, yy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText(brl(Math.round(val)).replace(',00', ''), 6, yy + 4);
  }
  if (min < 0 && max > 0) {
    ctx.strokeStyle = 'rgba(255,255,255,.34)';
    ctx.beginPath(); ctx.moveTo(pad.left, y(0)); ctx.lineTo(w - pad.right, y(0)); ctx.stroke();
    ctx.fillStyle = '#76ff28'; ctx.fillText('R$ 0', 6, y(0) + 4);
  }

  const gradient = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
  gradient.addColorStop(0, 'rgba(118,255,40,.35)');
  gradient.addColorStop(1, 'rgba(118,255,40,0)');
  ctx.beginPath();
  data.forEach((d, i) => i ? ctx.lineTo(x(i), y(d.value)) : ctx.moveTo(x(i), y(d.value)));
  ctx.lineTo(x(data.length - 1), h - pad.bottom);
  ctx.lineTo(x(0), h - pad.bottom);
  ctx.closePath(); ctx.fillStyle = gradient; ctx.fill();

  ctx.lineWidth = 3; ctx.shadowBlur = 12; ctx.shadowColor = 'rgba(118,255,40,.65)';
  ctx.beginPath();
  data.forEach((d, i) => {
    if (i === 0) ctx.moveTo(x(i), y(d.value)); else ctx.lineTo(x(i), y(d.value));
    ctx.strokeStyle = d.value >= 0 ? '#76ff28' : '#ff413d';
  });
  ctx.stroke(); ctx.shadowBlur = 0;
  const last = data[data.length - 1];
  ctx.fillStyle = last.value >= 0 ? '#76ff28' : '#ff413d';
  ctx.beginPath(); ctx.arc(x(data.length - 1), y(last.value), 5, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = 'rgba(245,247,244,.68)';
  let step = chartRange === 'daily' ? Math.max(1, Math.ceil(data.length / 10)) : 1;
  ctx.font = chartRange === 'daily' ? '10px system-ui' : '11px system-ui';
  data.forEach((d, i) => {
    if (i % step === 0 || i === data.length - 1) ctx.fillText(d.label, x(i) - (chartRange === 'yearly' ? 14 : 9), h - 10);
  });
}

// ============================================================
// DIÁLOGOS
// ============================================================
function customConfirm({ title, message, confirmText = 'Salvar', cancelText = 'Cancelar', danger = false, showCancel = true }) {
  return new Promise(resolve => {
    els.confirmTitle.textContent = title;
    els.confirmMessage.textContent = message;
    els.acceptConfirm.textContent = confirmText;
    els.cancelConfirm.textContent = cancelText;
    els.cancelConfirm.style.display = showCancel ? '' : 'none';
    els.acceptConfirm.classList.toggle('danger-action', danger);
    const cleanup = (result) => {
      els.acceptConfirm.removeEventListener('click', onAccept);
      els.cancelConfirm.removeEventListener('click', onCancel);
      els.confirmDialog.removeEventListener('cancel', onCancel);
      if (els.confirmDialog.open) els.confirmDialog.close();
      resolve(result);
    };
    const onAccept = () => cleanup(true);
    const onCancel = (event) => { if (event) event.preventDefault(); cleanup(false); };
    els.acceptConfirm.addEventListener('click', onAccept);
    els.cancelConfirm.addEventListener('click', onCancel);
    els.confirmDialog.addEventListener('cancel', onCancel);
    els.confirmDialog.showModal();
  });
}
function showSavedMessage(title, message) {
  return customConfirm({ title, message, confirmText: 'OK', showCancel: false });
}

// ============================================================
// AÇÕES DE APOSTAS
// ============================================================
async function setBetStatus(id, status, returned = null) {
  const bet = state.bets.find(b => b.id === id);
  if (!bet) return;
  if (status !== 'refund' && state.settings.confirmResult) {
    const resultLabel = status === 'green' ? 'Green' : 'Red';
    const message = status === 'green'
      ? `Confirmar Green em "${bet.description}"? Será adicionado ao saldo o retorno de ${brl(bet.stake * bet.odd)}.`
      : `Confirmar Red em "${bet.description}"? O valor apostado já saiu do saldo ao adicionar a aposta.`;
    const ok = await customConfirm({ title: `Confirmar ${resultLabel}`, message, confirmText: 'Salvar', cancelText: 'Cancelar', danger: status === 'red' });
    if (!ok) return;
  }
  const newReturned = returned ?? (status === 'green' ? bet.stake * bet.odd : 0);
  // Atualiza estado local imediatamente
  bet.status = status;
  bet.returned = newReturned;
  renderAll();
  // Persiste no banco
  await updateBet(id, { status, returned: newReturned });
  saveLocalFallback();
}

async function deleteBet(id) {
  const bet = state.bets.find(b => b.id === id);
  if (!bet) return;
  const ok = await customConfirm({
    title: 'Excluir aposta',
    message: `Excluir a aposta "${bet.description}"? Essa ação vai atualizar automaticamente saldo, histórico, gráfico, rankings e estatísticas.`,
    confirmText: 'Excluir', cancelText: 'Cancelar', danger: true
  });
  if (!ok) return;
  state.bets = state.bets.filter(b => b.id !== id);
  renderAll();
  await deleteBetFromDB(id);
  saveLocalFallback();
}

// ============================================================
// CONFIGURAÇÕES
// ============================================================
function updateSettingsFromForm() {
  state.settings = {
    initialBankroll: Number(els.initialBankroll.value) || 0,
    unitStake: Number(els.unitStake.value) || 0,
    monthlyGoal: Number(els.monthlyGoal.value) || 0,
    dailyLossLimit: Number(els.dailyLossLimit.value) || 0,
    neonTheme: els.neonTheme.checked,
    autoSave: true,
    confirmResult: els.confirmResult.checked
  };
  els.autoSave.checked = true;
  els.currentBalance.textContent = brl(calcBalance());
}

// ============================================================
// EVENT LISTENERS
// ============================================================

// Auth tabs
// Eventos de tabs foram movidos para chamadas globais window.switchTab() no index.html
els.loginForm.addEventListener('submit', handleLogin);
els.signupForm.addEventListener('submit', handleSignup);
els.googleBtn.addEventListener('click', handleGoogleLogin);

// User menu
els.userMenuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  els.userMenu.classList.toggle('hidden');
});
document.addEventListener('click', () => els.userMenu.classList.add('hidden'));
els.signOutBtn.addEventListener('click', handleSignOut);

// App events
els.betOdd.addEventListener('input', renderPossibleReturn);
els.betStake.addEventListener('input', renderPossibleReturn);
els.betDescription.addEventListener('input', renderPossibleReturn);
els.statusFilter.addEventListener('change', renderBets);
els.summaryDate?.addEventListener('change', () => renderResults());

els.betForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const betData = {
    date: els.betDate.value,
    description: els.betDescription.value.trim(),
    odd: Number(els.betOdd.value),
    stake: Number(els.betStake.value),
    status: 'pending',
    returned: 0,
    createdAt: Date.now()
  };
  if (!betData.description || betData.odd <= 1 || betData.stake <= 0) return;

  // Otimistic update — mostra imediatamente com ID temporário
  const tempBet = { ...betData, id: `temp_${Date.now()}` };
  state.bets.unshift(tempBet);
  els.currentBalance.textContent = brl(calcBalance());
  els.betForm.reset();
  els.betDate.value = todayISO();
  els.betStake.value = state.settings.unitStake || '';
  renderAll();

  // Persiste no banco e substitui ID temporário pelo ID real
  const saved = await insertBet(betData);
  if (saved) {
    const idx = state.bets.findIndex(b => b.id === tempBet.id);
    if (idx !== -1) state.bets[idx] = saved;
    saveLocalFallback();
    renderAll();
  }
});

document.addEventListener('click', async (event) => {
  const topTab = event.target.closest('.top-tab');
  const bottomTab = event.target.closest('.bottom-tab');
  const action = event.target.closest('[data-action]');
  const rangeBtn = event.target.closest('.range-btn');

  if (topTab) showView(topTab.dataset.view);
  if (bottomTab) showView(bottomTab.dataset.view);
  if (rangeBtn) {
    chartRange = rangeBtn.dataset.range;
    document.querySelectorAll('.range-btn').forEach(b => b.classList.toggle('active', b === rangeBtn));
    drawChart();
  }
  if (action) {
    const id = action.dataset.id;
    const type = action.dataset.action;
    if (type === 'delete') deleteBet(id);
    else if (type === 'refund') { currentRefundId = id; els.refundValue.value = ''; els.refundDialog.showModal(); }
    else setBetStatus(id, type);
  }
});

els.confirmRefund.addEventListener('click', async () => {
  const value = Number(els.refundValue.value);
  if (Number.isNaN(value) || value < 0) return;
  await setBetStatus(currentRefundId, 'refund', value);
  els.refundDialog.close();
});

[els.initialBankroll, els.unitStake, els.monthlyGoal, els.dailyLossLimit].forEach(input => {
  input.addEventListener('input', updateSettingsFromForm);
  input.addEventListener('change', updateSettingsFromForm);
});
[els.neonTheme, els.autoSave, els.confirmResult].forEach(input => {
  input.addEventListener('change', updateSettingsFromForm);
});

els.saveSettings.addEventListener('click', async () => {
  updateSettingsFromForm();
  renderAll();
  await upsertSettings();
  saveLocalFallback();
  await showSavedMessage('Configurações salvas', 'Suas configurações foram salvas na nuvem.');
});

els.resetData.addEventListener('click', async () => {
  const ok = await customConfirm({
    title: 'Restaurar dados',
    message: 'Isso vai zerar a banca, configurações e excluir todas as apostas. Deseja continuar?',
    confirmText: 'Restaurar', cancelText: 'Cancelar', danger: true
  });
  if (!ok) return;
  // Deleta todas as apostas do banco
  if (state.user) {
    setSyncStatus('syncing');
    await supabase.from('bets').delete().eq('user_id', state.user.id);
    await supabase.from('settings').delete().eq('user_id', state.user.id);
    setSyncStatus('synced');
  }
  state.bets = [];
  state.settings = { ...defaultSettings };
  localStorage.removeItem(LOCAL_FALLBACK_KEY);
  renderAll();
});

// Online / Offline
window.addEventListener('online', async () => {
  state.isOnline = true;
  if (state.user) {
    await loadBetsFromSupabase();
    renderAll();
  }
});
window.addEventListener('offline', () => {
  state.isOnline = false;
  setSyncStatus('offline');
});

window.addEventListener('resize', drawChart);
