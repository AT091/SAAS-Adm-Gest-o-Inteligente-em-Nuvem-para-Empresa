const taskForm = document.querySelector("#taskForm");
const taskInput = document.querySelector("#taskInput");
const taskPriority = document.querySelector("#taskPriority");
const taskArea = document.querySelector("#taskArea");
const taskSearch = document.querySelector("#taskSearch");
const taskList = document.querySelector("#taskList");
const taskCount = document.querySelector("#taskCount");
const doneTasks = document.querySelector("#doneTasks");
const openTasks = document.querySelector("#openTasks");
const highPriorityCount = document.querySelector("#highPriorityCount");
const completionScore = document.querySelector("#completionScore");
const completionMetric = document.querySelector("#completionMetric");
const priorityTitle = document.querySelector("#priorityTitle");
const currentDate = document.querySelector("#currentDate");
const accountStatus = document.querySelector("#accountStatus");
const planStatus = document.querySelector("#planStatus");
const upgradePro = document.querySelector("#upgradePro");
const authGoogle = document.querySelector("#authGoogle");
const authApple = document.querySelector("#authApple");
const signOut = document.querySelector("#signOut");
const syncCloud = document.querySelector("#syncCloud");
const cloudStatusTitle = document.querySelector("#cloudStatusTitle");
const cloudStatusText = document.querySelector("#cloudStatusText");
const themeToggle = document.querySelector("#themeToggle");
const themeLabel = document.querySelector("#themeLabel");
const timerDisplay = document.querySelector("#timerDisplay");
const timerStatus = document.querySelector("#timerStatus");
const startTimer = document.querySelector("#startTimer");
const pauseTimer = document.querySelector("#pauseTimer");
const resetTimer = document.querySelector("#resetTimer");
const focusSessions = document.querySelector("#focusSessions");
const focusMinutes = document.querySelector("#focusMinutes");
const taskProgress = document.querySelector("#taskProgress");
const dayStatus = document.querySelector("#dayStatus");
const scoreHint = document.querySelector("#scoreHint");
const forecastText = document.querySelector("#forecastText");
const coachMessage = document.querySelector("#coachMessage");
const insightText = document.querySelector("#insightText");
const clearDone = document.querySelector("#clearDone");
const weekBars = document.querySelector("#weekBars");
const riskScore = document.querySelector("#riskScore");
const riskHint = document.querySelector("#riskHint");
const commandOpen = document.querySelector("#commandOpen");
const commandClose = document.querySelector("#commandClose");
const commandModal = document.querySelector("#commandModal");
const commandButtons = document.querySelectorAll("[data-command]");
const exportWorkspace = document.querySelector("#exportWorkspace");
const importWorkspace = document.querySelector("#importWorkspace");
const loadDemo = document.querySelector("#loadDemo");
const toast = document.querySelector("#toast");
const onboardingChecks = document.querySelectorAll(".checklist input");
const filterButtons = document.querySelectorAll("[data-filter]");
const presetButtons = document.querySelectorAll("[data-preset]");
const checkoutLinks = document.querySelectorAll("[data-checkout-plan]");

const STORAGE_KEY = "focusflow.tasks.v2";
const LEGACY_STORAGE_KEY = "focusflow.tasks";
const THEME_KEY = "focusflow.theme";
const SESSION_KEY = "focusflow.sessions";
const PRESET_KEY = "focusflow.preset";
const MINUTES_KEY = "focusflow.minutes";
const PLAN_KEY = "focusflow.plan";

const PLAN_LIMITS = {
  free: {
    maxTasks: 5,
    exportData: false,
    importData: false,
    cloudSync: false,
  },
  pro: {
    maxTasks: Infinity,
    exportData: true,
    importData: true,
    cloudSync: true,
  },
};

const priorityLabels = {
  high: "Alta",
  medium: "Media",
  low: "Baixa",
};

let selectedPreset = Number(localStorage.getItem(PRESET_KEY) || "25") || 25;
let focusSeconds = selectedPreset * 60;
let tasks = loadTasks();
let secondsLeft = focusSeconds;
let timerId = null;
let sessions = Number(localStorage.getItem(SESSION_KEY) || "0") || 0;
let storedFocusMinutes = Number(localStorage.getItem(MINUTES_KEY) || "0") || 0;
let currentFilter = "all";
let searchTerm = "";
let toastTimer = null;
let supabaseClient = null;
let currentUser = null;
let syncTimer = null;
let currentPlan = localStorage.getItem(PLAN_KEY) || "free";

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseStoredTasks(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadTasks() {
  const current = localStorage.getItem(STORAGE_KEY);
  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  const rawTasks = parseStoredTasks(current || legacy);

  return rawTasks.map((task) => ({
    id: task.id || createId(),
    title: task.title || "Tarefa sem titulo",
    done: Boolean(task.done),
    priority: task.priority || "medium",
    area: task.area || "Operacoes",
    createdAt: task.createdAt || new Date().toISOString(),
  }));
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  scheduleCloudSync();
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function completeOnboardingStep(index) {
  if (onboardingChecks[index]) {
    onboardingChecks[index].checked = true;
  }
}

function isPro() {
  return currentPlan === "pro";
}

function getPlanLimits() {
  return PLAN_LIMITS[currentPlan] || PLAN_LIMITS.free;
}

function updatePlanUi() {
  planStatus.textContent = isPro() ? "Pro" : "Free";
  planStatus.classList.toggle("is-pro", isPro());
  upgradePro.hidden = isPro();
  exportWorkspace.classList.toggle("is-locked", !isPro());
  importWorkspace.closest(".import-button").classList.toggle("is-locked", !isPro());
  syncCloud.classList.toggle("is-locked", !isPro());
}

function requirePro(featureName) {
  if (isPro()) return true;

  showToast(`${featureName} e um recurso Pro. Faca upgrade para desbloquear.`);
  document.querySelector("#plans").scrollIntoView({ behavior: "smooth" });
  return false;
}

function canCreateTask() {
  const limit = getPlanLimits().maxTasks;

  if (tasks.length < limit) return true;

  showToast(`Plano Free permite ate ${limit} prioridades. Faca upgrade para ilimitado.`);
  document.querySelector("#plans").scrollIntoView({ behavior: "smooth" });
  return false;
}

function getAppConfig() {
  return window.APP_CONFIG || {
    supabaseUrl: "",
    supabaseAnonKey: "",
    stripeCheckoutEndpoint: "",
    stripePriceIds: {},
    checkoutLinks: {},
  };
}

function hasSupabaseConfig() {
  const config = getAppConfig();
  return Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);
}

function createWorkspacePayload() {
  return {
    payload: tasks,
    sessions,
    focus_minutes: storedFocusMinutes,
    selected_preset: selectedPreset,
    updated_at: new Date().toISOString(),
  };
}

function updateCloudUi() {
  updatePlanUi();

  if (!hasSupabaseConfig()) {
    accountStatus.textContent = "Modo local";
    cloudStatusTitle.textContent = "Local-first";
    cloudStatusText.textContent = "configure Supabase para sincronizar na nuvem";
    signOut.hidden = true;
    authGoogle.hidden = false;
    authApple.hidden = false;
    return;
  }

  if (currentUser) {
    const label = currentUser.email || "Usuario autenticado";
    accountStatus.textContent = label;
    cloudStatusTitle.textContent = "Cloud sync";
    cloudStatusText.textContent = "workspace autenticado e pronto para sincronizar";
    signOut.hidden = false;
    authGoogle.hidden = true;
    authApple.hidden = true;
    return;
  }

  accountStatus.textContent = "Nao autenticado";
  cloudStatusTitle.textContent = "Cloud ready";
  cloudStatusText.textContent = "entre com Google ou Apple para salvar na nuvem";
  signOut.hidden = true;
  authGoogle.hidden = false;
  authApple.hidden = false;
}

async function initBackend() {
  if (!hasSupabaseConfig()) {
    updateCloudUi();
    return;
  }

  const config = getAppConfig();
  supabaseClient = window.supabase.createClient(
    config.supabaseUrl,
    config.supabaseAnonKey
  );

  const { data } = await supabaseClient.auth.getSession();
  currentUser = data.session?.user || null;
  updateCloudUi();

  if (currentUser) {
    await loadCloudWorkspace();
  }

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user || null;
    updateCloudUi();

    if (currentUser) {
      await loadCloudWorkspace();
      await syncWorkspace();
    }
  });
}

async function signInWithProvider(provider) {
  if (!hasSupabaseConfig() || !supabaseClient) {
    showToast("Configure Supabase em app-config.js para ativar login.");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.href.split("#")[0],
    },
  });

  if (error) {
    showToast("Nao foi possivel iniciar o login.");
  }
}

async function signOutUser() {
  if (!supabaseClient) return;

  await supabaseClient.auth.signOut();
  currentUser = null;
  updateCloudUi();
  showToast("Sessao encerrada.");
}

async function loadCloudWorkspace() {
  if (!supabaseClient || !currentUser) return;

  const { data, error } = await supabaseClient
    .from("workspaces")
    .select("payload, sessions, focus_minutes, selected_preset")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (error) {
    showToast("Nao foi possivel carregar a nuvem.");
    return;
  }

  if (!data) return;

  tasks = parseStoredTasks(JSON.stringify(data.payload));
  sessions = Number(data.sessions || 0) || 0;
  storedFocusMinutes = Number(data.focus_minutes || 0) || 0;
  selectedPreset = Number(data.selected_preset || selectedPreset) || 25;
  focusSeconds = selectedPreset * 60;
  secondsLeft = focusSeconds;
  localStorage.setItem(SESSION_KEY, String(sessions));
  localStorage.setItem(MINUTES_KEY, String(storedFocusMinutes));
  localStorage.setItem(PRESET_KEY, String(selectedPreset));
  saveTasks();
  setPreset(selectedPreset);
  renderTasks();
  showToast("Workspace carregado da nuvem.");
}

async function syncWorkspace() {
  if (!requirePro("Sincronizacao em nuvem")) return;

  if (!supabaseClient || !currentUser) {
    showToast("Entre na conta para sincronizar na nuvem.");
    return;
  }

  const { error } = await supabaseClient.from("workspaces").upsert({
    user_id: currentUser.id,
    ...createWorkspacePayload(),
  });

  if (error) {
    showToast("Erro ao sincronizar workspace.");
    return;
  }

  showToast("Workspace sincronizado.");
}

function scheduleCloudSync() {
  if (!isPro() || !currentUser || !supabaseClient) return;

  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncWorkspace();
  }, 900);
}

async function openCheckout(plan) {
  if (plan === "free") {
    currentPlan = "free";
    localStorage.setItem(PLAN_KEY, currentPlan);
    updatePlanUi();
    showToast("Plano Free ativado.");
    return;
  }

  const config = getAppConfig();
  const endpoint = config.stripeCheckoutEndpoint;
  const priceId = config.stripePriceIds?.[plan];

  if (endpoint && priceId) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          priceId,
          userId: currentUser?.id || null,
          email: currentUser?.email || null,
          successUrl: `${window.location.origin}${window.location.pathname}?checkout=success`,
          cancelUrl: `${window.location.origin}${window.location.pathname}?checkout=cancelled#plans`,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Checkout unavailable");
      }

      window.location.href = data.url;
      return;
    } catch {
      showToast("Stripe Checkout indisponivel. Tentando link de pagamento.");
    }
  }

  const links = config.checkoutLinks || {};
  const url = links[plan];

  if (!url) {
    showToast("Configure Stripe Checkout ou Payment Link em app-config.js.");
    return;
  }

  window.location.href = url;
}

function formatDate() {
  currentDate.textContent = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  }).format(new Date());
}

function getFilteredTasks() {
  return tasks.filter((task) => {
    const matchesFilter =
      currentFilter === "all" ||
      (currentFilter === "open" && !task.done) ||
      (currentFilter === "done" && task.done) ||
      (currentFilter === "high" && task.priority === "high");

    const searchable = `${task.title} ${task.area} ${priorityLabels[task.priority]}`.toLowerCase();
    const matchesSearch = searchable.includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });
}

function getEmptyMessage() {
  if (searchTerm) {
    return "Nenhuma prioridade encontrada para essa busca.";
  }

  if (currentFilter === "open" && tasks.length) {
    return "Nenhuma tarefa aberta. Pipeline limpo.";
  }

  if (currentFilter === "done") {
    return "As entregas concluidas aparecem aqui.";
  }

  if (currentFilter === "high") {
    return "Nenhuma prioridade critica no momento.";
  }

  return "Adicione uma prioridade para ativar o workspace.";
}

function renderTasks() {
  const visibleTasks = getFilteredTasks();
  taskList.innerHTML = "";

  if (!visibleTasks.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "task-empty";
    emptyItem.textContent = getEmptyMessage();
    taskList.appendChild(emptyItem);
  }

  visibleTasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = `task-item${task.done ? " done" : ""}`;

    const main = document.createElement("div");
    main.className = "task-main";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const copy = document.createElement("div");
    copy.className = "task-copy";

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const priority = document.createElement("span");
    priority.className = `tag ${task.priority}`;
    priority.textContent = priorityLabels[task.priority];

    const area = document.createElement("span");
    area.className = "tag";
    area.textContent = task.area;

    meta.append(priority, area);
    copy.append(title, meta);
    main.append(checkbox, copy);

    const remove = document.createElement("button");
    remove.className = "delete-task";
    remove.type = "button";
    remove.textContent = "x";
    remove.setAttribute("aria-label", `Remover ${task.title}`);
    remove.addEventListener("click", () => deleteTask(task.id));

    item.append(main, remove);
    taskList.appendChild(item);
  });

  updateStats();
}

function updateStats() {
  const done = tasks.filter((task) => task.done).length;
  const open = tasks.length - done;
  const highOpen = tasks.filter((task) => !task.done && task.priority === "high").length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const firstOpenTask = tasks.find((task) => !task.done && task.priority === "high") ||
    tasks.find((task) => !task.done);
  const totalFocusMinutes = storedFocusMinutes || sessions * selectedPreset;
  const visibleCount = getFilteredTasks().length;

  taskCount.textContent = `${visibleCount}/${tasks.length} ${tasks.length === 1 ? "item" : "itens"}`;
  doneTasks.textContent = done;
  openTasks.textContent = open;
  highPriorityCount.textContent = highOpen;
  completionScore.textContent = `${progress}%`;
  completionMetric.textContent = `${progress}%`;
  focusSessions.textContent = `${sessions} ${sessions === 1 ? "sessao" : "sessoes"}`;
  focusMinutes.textContent = `${totalFocusMinutes}m`;
  taskProgress.value = progress;

  priorityTitle.textContent = firstOpenTask
    ? firstOpenTask.title
    : tasks.length
      ? "Pipeline encerrado. Operacao sob controle."
      : "Crie sua primeira prioridade.";

  dayStatus.textContent = getDayStatus(progress, tasks.length);
  updateRisk(open, highOpen, progress);
  updateMessaging(open, highOpen, progress, totalFocusMinutes);

  clearDone.disabled = done === 0;
  document.documentElement.style.setProperty("--progress", `${progress}%`);
  renderWeekBars(progress, sessions, highOpen);
}

function getDayStatus(progress, total) {
  if (!total) return "Comecando";
  if (progress === 100) return "Finalizado";
  if (progress >= 75) return "Excelente tracao";
  if (progress >= 45) return "Em aceleracao";
  return "Em construcao";
}

function updateRisk(open, highOpen, progress) {
  if (highOpen >= 3 || open >= 7) {
    riskScore.textContent = "Alto";
    riskHint.textContent = "priorize gargalos";
    return;
  }

  if (highOpen >= 1 || (open >= 4 && progress < 50)) {
    riskScore.textContent = "Medio";
    riskHint.textContent = "acompanhar fila";
    return;
  }

  riskScore.textContent = "Baixo";
  riskHint.textContent = "sem gargalos";
}

function updateMessaging(open, highOpen, progress, totalFocusMinutes) {
  scoreHint.textContent =
    progress === 100 && tasks.length
      ? "Todas as entregas foram finalizadas."
      : open
        ? `${open} ${open === 1 ? "prioridade aberta" : "prioridades abertas"} no pipeline.`
        : "Cadastre prioridades para gerar progresso.";

  forecastText.textContent =
    highOpen
      ? `${highOpen} ${highOpen === 1 ? "item critico exige" : "itens criticos exigem"} decisao.`
      : progress >= 70
        ? "Forecast positivo para fechar o dia."
        : tasks.length
          ? "Forecast melhora com foco nas proximas entregas."
          : "Forecast disponivel apos tarefas.";

  coachMessage.textContent =
    highOpen >= 2
      ? "Ataque as prioridades criticas antes de expandir o escopo."
      : progress >= 75
        ? "Bom ritmo. Agora consolide o que falta."
        : open >= 5
          ? "Backlog crescendo. Reduza a fila antes de adicionar mais."
          : tasks.length
            ? "Pipeline saudavel. Converta uma tarefa em deep work."
            : "Crie prioridades para ativar previsoes.";

  insightText.textContent =
    highOpen >= 2
      ? "Ha concentracao de risco em tarefas criticas. Resolva uma antes da proxima sessao."
      : totalFocusMinutes >= 90
        ? "Boa capacidade de foco hoje. Use o restante do dia para fechamento e revisao."
        : open > 3
          ? "A fila esta ampla. Escolha um item de maior impacto e proteja 25 minutos."
          : progress === 100 && tasks.length
            ? "Dia finalizado com alto controle operacional."
            : "Comece pela prioridade com maior impacto no resultado.";
}

function renderWeekBars(progress, sessionCount, highOpen) {
  const values = [
    28,
    46,
    38,
    62,
    54,
    Math.min(86, 30 + sessionCount * 12),
    Math.max(progress, highOpen * 22, 12),
  ];

  weekBars.innerHTML = "";
  values.forEach((value) => {
    const bar = document.createElement("span");
    bar.style.height = `${Math.min(value, 100)}%`;
    weekBars.appendChild(bar);
  });
}

function addTask(title) {
  tasks.unshift({
    id: createId(),
    title,
    done: false,
    priority: taskPriority.value,
    area: taskArea.value,
    createdAt: new Date().toISOString(),
  });
  saveTasks();
  renderTasks();
}

function loadDemoWorkspace() {
  tasks = [
    {
      id: createId(),
      title: "Fechar proposta enterprise para cliente prioritario",
      done: false,
      priority: "high",
      area: "Growth",
      createdAt: new Date().toISOString(),
    },
    {
      id: createId(),
      title: "Revisar roadmap da sprint e remover bloqueios",
      done: false,
      priority: "high",
      area: "Produto",
      createdAt: new Date().toISOString(),
    },
    {
      id: createId(),
      title: "Atualizar dashboard financeiro semanal",
      done: true,
      priority: "medium",
      area: "Financeiro",
      createdAt: new Date().toISOString(),
    },
    {
      id: createId(),
      title: "Documentar playbook de onboarding",
      done: false,
      priority: "medium",
      area: "Operacoes",
      createdAt: new Date().toISOString(),
    },
    {
      id: createId(),
      title: "Responder follow-ups de parceiros",
      done: true,
      priority: "low",
      area: "Growth",
      createdAt: new Date().toISOString(),
    },
  ];
  sessions = Math.max(sessions, 2);
  storedFocusMinutes = Math.max(storedFocusMinutes, 50);
  saveTasks();
  localStorage.setItem(SESSION_KEY, String(sessions));
  localStorage.setItem(MINUTES_KEY, String(storedFocusMinutes));
  completeOnboardingStep(0);
  completeOnboardingStep(1);
  renderTasks();
  document.querySelector("#overview").scrollIntoView({ behavior: "smooth" });
  showToast("Workspace demo carregado.");
}

function toggleTask(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, done: !task.done } : task
  );
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

function renderTimer() {
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

function stopTimer(status = "Pausado") {
  clearInterval(timerId);
  timerId = null;
  timerStatus.textContent = status;
}

function completeSession() {
  stopTimer("Concluido");
  secondsLeft = focusSeconds;
  sessions += 1;
  storedFocusMinutes += selectedPreset;
  localStorage.setItem(SESSION_KEY, String(sessions));
  localStorage.setItem(MINUTES_KEY, String(storedFocusMinutes));
  renderTimer();
  updateStats();
  scheduleCloudSync();
}

function setPreset(minutes) {
  if (timerId) return;

  selectedPreset = minutes;
  focusSeconds = minutes * 60;
  secondsLeft = focusSeconds;
  localStorage.setItem(PRESET_KEY, String(minutes));

  presetButtons.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.preset) === minutes);
  });

  renderTimer();
  updateStats();
  scheduleCloudSync();
}

function syncThemeLabel() {
  themeLabel.textContent = document.body.classList.contains("dark")
    ? "Tema claro"
    : "Tema escuro";
}

function openCommandPalette() {
  commandModal.classList.add("open");
  commandModal.setAttribute("aria-hidden", "false");
}

function closeCommandPalette() {
  commandModal.classList.remove("open");
  commandModal.setAttribute("aria-hidden", "true");
}

function exportData() {
  if (!requirePro("Exportacao de dados")) return;

  const payload = {
    product: "FocusFlow OS",
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks,
    sessions,
    focusMinutes: storedFocusMinutes,
    selectedPreset,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `focusflow-workspace-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  completeOnboardingStep(2);
  showToast("Workspace exportado com sucesso.");
}

function importData(file) {
  if (!file) return;
  if (!requirePro("Importacao de workspace")) {
    importWorkspace.value = "";
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const payload = JSON.parse(reader.result);
      const importedTasks = Array.isArray(payload.tasks) ? payload.tasks : [];

      tasks = importedTasks.map((task) => ({
        id: task.id || createId(),
        title: task.title || "Tarefa sem titulo",
        done: Boolean(task.done),
        priority: task.priority || "medium",
        area: task.area || "Operacoes",
        createdAt: task.createdAt || new Date().toISOString(),
      }));
      sessions = Number(payload.sessions || 0) || 0;
      storedFocusMinutes = Number(payload.focusMinutes || 0) || 0;
      saveTasks();
      localStorage.setItem(SESSION_KEY, String(sessions));
      localStorage.setItem(MINUTES_KEY, String(storedFocusMinutes));
      renderTasks();
      showToast("Workspace importado com sucesso.");
    } catch {
      showToast("Nao foi possivel importar esse arquivo.");
    } finally {
      importWorkspace.value = "";
    }
  });
  reader.readAsText(file);
}

function runCommand(command) {
  closeCommandPalette();

  if (command === "focus") {
    startTimer.click();
    document.querySelector("#focus").scrollIntoView({ behavior: "smooth" });
    showToast("Sessao de foco iniciada.");
  }

  if (command === "pipeline") {
    document.querySelector("#pipeline").scrollIntoView({ behavior: "smooth" });
    taskInput.focus();
  }

  if (command === "analytics") {
    document.querySelector("#analytics").scrollIntoView({ behavior: "smooth" });
  }

  if (command === "demo") {
    loadDemoWorkspace();
  }

  if (command === "export") {
    exportData();
  }

  if (command === "theme") {
    themeToggle.click();
    showToast("Tema alternado.");
  }
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskInput.value.trim();

  if (!title) return;
  if (!canCreateTask()) return;

  addTask(title);
  taskInput.value = "";
  taskInput.focus();
  completeOnboardingStep(0);
  showToast("Prioridade adicionada ao pipeline.");
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderTasks();
  });
});

presetButtons.forEach((button) => {
  button.addEventListener("click", () => setPreset(Number(button.dataset.preset)));
});

taskSearch.addEventListener("input", (event) => {
  searchTerm = event.target.value.trim();
  renderTasks();
});

clearDone.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.done);
  saveTasks();
  renderTasks();
  showToast("Tarefas concluidas arquivadas.");
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    THEME_KEY,
    document.body.classList.contains("dark") ? "dark" : "light"
  );
  syncThemeLabel();
});

commandOpen.addEventListener("click", openCommandPalette);
commandClose.addEventListener("click", closeCommandPalette);
commandModal.addEventListener("click", (event) => {
  if (event.target === commandModal) {
    closeCommandPalette();
  }
});

commandButtons.forEach((button) => {
  button.addEventListener("click", () => runCommand(button.dataset.command));
});

exportWorkspace.addEventListener("click", exportData);
importWorkspace.addEventListener("change", (event) => {
  importData(event.target.files[0]);
});

loadDemo.addEventListener("click", loadDemoWorkspace);
upgradePro.addEventListener("click", () => openCheckout("pro"));

authGoogle.addEventListener("click", () => signInWithProvider("google"));
authApple.addEventListener("click", () => signInWithProvider("apple"));
signOut.addEventListener("click", signOutUser);
syncCloud.addEventListener("click", syncWorkspace);

checkoutLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openCheckout(link.dataset.checkoutPlan);
  });
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openCommandPalette();
  }

  if (event.key === "Escape") {
    closeCommandPalette();
  }
});

startTimer.addEventListener("click", () => {
  if (timerId) return;

  timerStatus.textContent = "Rodando";
  completeOnboardingStep(1);
  showToast("Sessao de foco iniciada.");
  timerId = setInterval(() => {
    secondsLeft -= 1;
    renderTimer();

    if (secondsLeft <= 0) {
      completeSession();
    }
  }, 1000);
});

pauseTimer.addEventListener("click", () => stopTimer());

resetTimer.addEventListener("click", () => {
  stopTimer("Pronto");
  secondsLeft = focusSeconds;
  renderTimer();
});

if (localStorage.getItem(THEME_KEY) === "dark") {
  document.body.classList.add("dark");
}

const checkoutStatus = new URLSearchParams(window.location.search).get("checkout");

if (checkoutStatus === "success") {
  currentPlan = "pro";
  localStorage.setItem(PLAN_KEY, currentPlan);
  window.history.replaceState({}, document.title, window.location.pathname);
  showToast("Checkout concluido. Plano Pro ativado neste dispositivo.");
}

if (checkoutStatus === "cancelled") {
  window.history.replaceState({}, document.title, `${window.location.pathname}#plans`);
  showToast("Checkout cancelado.");
}

if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

formatDate();
syncThemeLabel();
updatePlanUi();
setPreset(selectedPreset);
renderTasks();
window.addEventListener("load", initBackend);
