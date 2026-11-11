(() => {
  "use strict";

  const STORAGE_KEY = "splitsmart-data-v1";
  const USER = "Pravesh";
  const categories = ["Groceries", "Rent", "Dining", "Travel", "Utilities", "Shopping", "Other"];
  const categoryIcons = { Groceries: "🥑", Rent: "⌂", Dining: "☕", Travel: "✈", Utilities: "ϟ", Shopping: "✧", Other: "◈" };
  const categoryColors = ["#75B900", "#B6FF00", "#526A42", "#879975", "#263322", "#9DB17D", "#D7FF72"];
  const groupIcons = { Hostel: "⌂", Roommates: "⌂", Trips: "✈", Friends: "✦", Other: "◈" };
  const peopleColors = ["#263322", "#526A42", "#3D5237", "#4A633B", "#33452D", "#5B704C", "#405438"];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value) || 0);
  const initials = name => String(name || "?").trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase();
  const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const monthLabel = date => new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { month: "short" });
  const prettyDate = date => date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

  function sampleData() {
    const groups = [
      { id: "g-hostel", name: "Maple Hostel", description: "Room 204 shared student essentials", category: "Hostel", members: [USER, "Priya Sharma", "Rohan Mehta", "Neha Kapoor"], sample: true },
      { id: "g-goa", name: "Project Partners", description: "Notes, printouts and semester projects", category: "Other", members: [USER, "Priya Sharma", "Kabir Shah", "Aisha Verma"], sample: true },
      { id: "g-friends", name: "Campus Canteen", description: "Lunch breaks and chai between classes", category: "Friends", members: [USER, "Rohan Mehta", "Aisha Verma"], sample: true }
    ];
    const dateFor = days => { const date = new Date(); date.setDate(date.getDate() - days); return date.toISOString().slice(0, 10); };
    const expenses = [
      { id: "e1", title: "Shared groceries", amount: 960, category: "Groceries", date: dateFor(1), payer: "Priya Sharma", groupId: "g-hostel", description: "Milk, fruit and pantry basics for the room", participants: [...groups[0].members], method: "equal", shares: { [USER]: 240, "Priya Sharma": 240, "Rohan Mehta": 240, "Neha Kapoor": 240 }, sample: true },
      { id: "e2", title: "Hostel electricity", amount: 640, category: "Utilities", date: dateFor(4), payer: USER, groupId: "g-hostel", description: "Shared room electricity contribution", participants: [...groups[0].members], method: "equal", shares: { [USER]: 160, "Priya Sharma": 160, "Rohan Mehta": 160, "Neha Kapoor": 160 }, sample: true },
      { id: "e3", title: "Project printouts", amount: 540, category: "Shopping", date: dateFor(8), payer: USER, groupId: "g-goa", description: "Color prints and binding for the semester project", participants: [...groups[1].members], method: "equal", shares: { [USER]: 135, "Priya Sharma": 135, "Kabir Shah": 135, "Aisha Verma": 135 }, sample: true },
      { id: "e4", title: "Canteen lunch", amount: 390, category: "Dining", date: dateFor(12), payer: "Aisha Verma", groupId: "g-friends", description: "Lunch after the afternoon lecture", participants: [...groups[2].members], method: "equal", shares: { [USER]: 130, "Rohan Mehta": 130, "Aisha Verma": 130 }, sample: true },
      { id: "e5", title: "Campus bus passes", amount: 360, category: "Travel", date: dateFor(17), payer: "Kabir Shah", groupId: "g-goa", description: "Shared local bus rides to campus", participants: ["Kabir Shah", USER, "Priya Sharma"], method: "equal", shares: { [USER]: 120, "Priya Sharma": 120, "Kabir Shah": 120 }, sample: true },
      { id: "e6", title: "Room cleaning supplies", amount: 280, category: "Shopping", date: dateFor(22), payer: "Rohan Mehta", groupId: "g-hostel", description: "Dish soap and shared cleaning essentials", participants: [...groups[0].members], method: "equal", shares: { [USER]: 70, "Priya Sharma": 70, "Rohan Mehta": 70, "Neha Kapoor": 70 }, sample: true },
      { id: "e7", title: "Chai and samosas", amount: 240, category: "Dining", date: dateFor(29), payer: "Priya Sharma", groupId: "g-goa", description: "Tea break during project work", participants: ["Priya Sharma", USER, "Kabir Shah"], method: "equal", shares: { [USER]: 80, "Priya Sharma": 80, "Kabir Shah": 80 }, sample: true }
    ];
    return {
      groups, expenses,
      settlements: [
        { id: "s1", from: USER, to: "Priya Sharma", amount: 160, groupId: "g-hostel", status: "pending", date: dateFor(1), sample: true },
        { id: "s2", from: "Kabir Shah", to: USER, amount: 120, groupId: "g-goa", status: "pending", date: dateFor(2), sample: true },
        { id: "s3", from: "Rohan Mehta", to: USER, amount: 90, groupId: "g-friends", status: "completed", date: dateFor(9), sample: true }
      ],
      settings: { darkMode: false, name: USER, notifications: true }, notificationsSeen: false, sampleVersion: 2
    };
  }
  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return sampleData();
      const data = JSON.parse(saved);
      if (!data || !Array.isArray(data.groups) || !Array.isArray(data.expenses) || !Array.isArray(data.settlements)) throw new Error("Saved data is incomplete.");
      const currentSamples = sampleData();
      const oldName = "Alex Morgan";
      const profileChanged = data.settings?.name === oldName;
      const sampleDataChanged = (data.sampleVersion || 0) < currentSamples.sampleVersion;
      if (profileChanged) {
        data.settings.name = USER;
        data.groups.forEach(group => {
          group.members = [...new Set(group.members.map(member => member === oldName ? USER : member))];
        });
        data.expenses.forEach(expense => {
          if (expense.payer === oldName) expense.payer = USER;
          expense.participants = [...new Set(expense.participants.map(member => member === oldName ? USER : member))];
          if (Object.prototype.hasOwnProperty.call(expense.shares, oldName)) {
            expense.shares[USER] = (Number(expense.shares[USER]) || 0) + Number(expense.shares[oldName]);
            delete expense.shares[oldName];
          }
        });
        data.settlements.forEach(settlement => {
          if (settlement.from === oldName) settlement.from = USER;
          if (settlement.to === oldName) settlement.to = USER;
        });
      }
      if (sampleDataChanged) {
        for (const key of ["groups", "expenses", "settlements"]) {
          const currentById = new Map(currentSamples[key].map(item => [item.id, item]));
          data[key] = data[key].map(item => item.sample && currentById.has(item.id) ? { ...currentById.get(item.id) } : item);
        }
        data.sampleVersion = currentSamples.sampleVersion;
      }
      if (profileChanged || sampleDataChanged) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
        catch (error) { console.error("Could not update saved SplitSmart data:", error); }
      }
      return { ...currentSamples, ...data, settings: { ...currentSamples.settings, ...(data.settings || {}) } };
    } catch (error) {
      console.error("Could not load SplitSmart data:", error);
      return sampleData();
    }
  }
  let state = loadData();
  let currentPage = "dashboard";
  let activeGroupId = null;
  let settlementTab = "pending";
  let trendRange = 6;

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (error) { console.error("Could not save SplitSmart data:", error); toast("Changes could not be saved to this browser.", "error"); }
  }
  function toast(message, type = "success") {
    const element = document.createElement("div");
    element.className = `toast ${type}`;
    element.textContent = message;
    $("#toast-region").append(element);
    setTimeout(() => element.remove(), 3400);
  }
  function groupById(id) { return state.groups.find(group => group.id === id); }
  function expenseGroup(expense) { return groupById(expense.groupId)?.name || "Group removed"; }
  function allMembers(groupIds) {
    const ids = groupIds || state.groups.map(group => group.id);
    return [...new Set(state.groups.filter(group => ids.includes(group.id)).flatMap(group => group.members))];
  }
  function getGroupExpenses(groupId) { return state.expenses.filter(expense => !groupId || expense.groupId === groupId); }
  function getBalances(groupId) {
    const groupExpenses = getGroupExpenses(groupId);
    const balances = new Map();
    const add = (name, amount) => balances.set(name, (balances.get(name) || 0) + amount);
    groupExpenses.forEach(expense => {
      add(expense.payer, Number(expense.amount));
      Object.entries(expense.shares || {}).forEach(([name, share]) => add(name, -Number(share)));
    });
    state.settlements.filter(item => item.status === "completed" && (!groupId || item.groupId === groupId)).forEach(item => {
      add(item.from, -Number(item.amount));
      add(item.to, Number(item.amount));
    });
    allMembers(groupId ? [groupId] : undefined).forEach(name => { if (!balances.has(name)) balances.set(name, 0); });
    for (const [name, value] of balances) balances.set(name, Math.abs(value) < .005 ? 0 : value);
    return balances;
  }
  function getSuggestions(groupId) {
    const balances = getBalances(groupId);
    const creditors = [...balances].filter(([, amount]) => amount > .005).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
    const debtors = [...balances].filter(([, amount]) => amount < -.005).map(([name, amount]) => ({ name, amount: -amount })).sort((a, b) => b.amount - a.amount);
    const suggestions = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(debtors[i].amount, creditors[j].amount);
      if (amount > .005) suggestions.push({ from: debtors[i].name, to: creditors[j].name, amount: Math.round(amount * 100) / 100, groupId: groupId || suggestGroup(debtors[i].name, creditors[j].name) });
      debtors[i].amount -= amount;
      creditors[j].amount -= amount;
      if (debtors[i].amount < .005) i++;
      if (creditors[j].amount < .005) j++;
    }
    return suggestions;
  }
  function suggestGroup(from, to) {
    return state.groups.find(group => group.members.includes(from) && group.members.includes(to))?.id || state.groups[0]?.id || "";
  }
  function getUserOwes() { return Math.max(0, -(getBalances().get(state.settings.name) || 0)); }
  function getUserOwed() { return Math.max(0, getBalances().get(state.settings.name) || 0); }
  function totalSpent(expenses = state.expenses) { return expenses.reduce((total, item) => total + Number(item.amount), 0); }
  function setProfileLabels() {
    const name = state.settings.name || USER;
    $("#sidebar-name").textContent = name;
    $$(".avatar-user, .top-avatar").forEach(element => { element.textContent = initials(name); });
  }
  function renderApp() {
    document.body.classList.toggle("dark-mode", !!state.settings.darkMode);
    setProfileLabels();
    $("#group-count").textContent = state.groups.length;
    $("#today-label").textContent = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
    const pending = state.settlements.filter(item => item.status === "pending").length;
    $("#notification-dot").classList.toggle("visible", pending > 0 && !state.notificationsSeen);
    $("#breadcrumb-current").textContent = activeGroupId && currentPage === "groups" ? groupById(activeGroupId)?.name || "My Groups" : pageName(currentPage);
    $$(".nav-link[data-page]").forEach(link => link.classList.toggle("active", link.dataset.page === currentPage && !(currentPage === "groups" && activeGroupId)));
    $("#view").innerHTML = renderPage();
    $("#view").classList.remove("re-enter");
    void $("#view").offsetWidth;
    $("#view").classList.add("re-enter");
  }
  function pageName(page) { return ({ dashboard: "Dashboard", groups: "My Groups", expenses: "All Expenses", balances: "Balances", settlements: "Settlements", analytics: "Analytics", settings: "Settings" })[page] || "Dashboard"; }
  function pageHeading(eyebrow, title, subtitle, actions = "") {
    return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="heading-subtitle">${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`;
  }
  function renderPage() {
    if (currentPage === "dashboard") return renderDashboard();
    if (currentPage === "groups") return activeGroupId ? renderGroupDetail() : renderGroups();
    if (currentPage === "expenses") return renderExpenses();
    if (currentPage === "balances") return renderBalances();
    if (currentPage === "settlements") return renderSettlements();
    if (currentPage === "analytics") return renderAnalytics();
    if (currentPage === "settings") return renderSettings();
    return renderDashboard();
  }
  function groupCards(groups = state.groups) {
    if (!groups.length) return `<div class="panel empty-state"><div class="empty-icon">◫</div><strong>Your first group starts here</strong><p>Create a group to keep shared spending in one place.</p><button class="btn btn-primary" data-action="new-group">Create a group</button></div>`;
    return `<div class="group-grid">${groups.map(group => {
      const groupTotal = totalSpent(getGroupExpenses(group.id));
      const colors = peopleColors;
      return `<article class="group-card" data-action="open-group" data-id="${escapeHtml(group.id)}">
        <div class="group-card-top"><span class="group-emblem">${groupIcons[group.category] || "◈"}</span><span class="group-category">${escapeHtml(group.category)}${group.sample ? " · Sample" : ""}</span></div>
        <h3>${escapeHtml(group.name)}</h3><p>${escapeHtml(group.description || `${group.members.length} members sharing together`)}</p>
        <div class="group-total-row"><div><small>Total expenses</small><strong>${money(groupTotal)}</strong></div><div class="avatar-stack">${group.members.slice(0, 4).map((member, index) => `<span class="avatar" style="background:${colors[index % colors.length]}" title="${escapeHtml(member)}">${initials(member)}</span>`).join("")}${group.members.length > 4 ? `<span class="avatar" style="background:#526A42">${group.members.length - 4}+</span>` : ""}</div></div>
        <div class="group-card-actions"><button data-action="edit-group" data-id="${escapeHtml(group.id)}">Edit group</button><button data-action="delete-group" data-id="${escapeHtml(group.id)}">Delete</button><button data-action="open-group" data-id="${escapeHtml(group.id)}">View details ↗</button></div>
      </article>`;
    }).join("")}</div>`;
  }
  function renderDashboard() {
    const expenses = [...state.expenses].sort((a, b) => b.date.localeCompare(a.date));
    const paidByUser = state.expenses.filter(expense => expense.payer === state.settings.name).reduce((sum, item) => sum + Number(item.amount), 0);
    const activeGroups = state.groups.filter(group => state.expenses.some(expense => expense.groupId === group.id)).length;
    const personalBalance = (getBalances().get(state.settings.name) || 0);
    const netText = personalBalance >= 0 ? "You are owed overall" : "Your share to settle";
    const actions = `<button class="btn btn-outline" data-page="groups">＋ New group</button><button class="btn btn-primary" data-action="new-expense">＋ Add expense</button>`;
    return `${pageHeading(`TUESDAY, ${new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" }).toUpperCase()}`, `Hello, ${escapeHtml((state.settings.name || USER).split(" ")[0])} ✦`, "Here's the shared picture, all in one place.", actions)}
      <div class="summary-grid">
        ${summaryCard("Total group expenses", money(totalSpent()), "Across all your groups", "↗", "")}
        ${summaryCard("You contributed", money(paidByUser), "Paid by you so far", "↗", "gold")}
        ${summaryCard("You owe", money(getUserOwes()), "Your unpaid share", "↓", "red")}
        ${summaryCard("Owed to you", money(getUserOwed()), netText, "↑", "green")}
      </div>
      <div class="dashboard-grid">
        <div class="left-column">
          <section class="panel"><div class="panel-header"><div><h2 class="panel-title">Monthly spending</h2><p class="panel-subtitle">A little perspective on the bigger picture</p></div><label class="chart-legend"><i class="legend-dot"></i> Group expenses</label></div>${renderLineChart(6)}</section>
          <section class="panel"><div class="panel-header"><div><h2 class="panel-title">Recent activity</h2><p class="panel-subtitle">The latest from all your groups</p></div><button class="text-link" data-page="expenses">See all ↗</button></div>${renderRecentTransactions(expenses.slice(0, 4))}</section>
        </div>
        <div class="right-column">
          <section class="panel"><div class="panel-header"><div><h2 class="panel-title">Spending by category</h2><p class="panel-subtitle">Where shared money goes</p></div><button class="text-link" data-page="analytics">Details</button></div>${renderDonut(state.expenses)}</section>
          <section class="panel"><div class="panel-header"><div><h2 class="panel-title">Your groups</h2><p class="panel-subtitle">${activeGroups} active · ${state.groups.length} total</p></div><button class="text-link" data-page="groups">View all</button></div>${state.groups.length ? renderCompactGroups() : `<div class="empty-state"><strong>No groups yet</strong><p>Create one to get started.</p></div>`}</section>
          <section class="panel"><div class="panel-header"><div><h2 class="panel-title">To settle</h2><p class="panel-subtitle">Pending between your groups</p></div><button class="text-link" data-page="settlements">View all</button></div>${renderPendingPreview()}</section>
        </div>
      </div>`;
  }
  function summaryCard(label, value, note, icon, variant) {
    return `<div class="summary-card"><div class="summary-top"><span>${label}</span><span class="summary-icon ${variant}">${icon}</span></div><div class="summary-value">${value}</div><div class="summary-foot">${note}</div></div>`;
  }
  function renderCompactGroups() {
    return state.groups.slice(0, 3).map(group => `<div class="transaction" data-action="open-group" data-id="${escapeHtml(group.id)}"><span class="category-icon">${groupIcons[group.category] || "◈"}</span><span class="transaction-info"><strong>${escapeHtml(group.name)}</strong><small>${group.members.length} members · ${escapeHtml(group.category)}</small></span><strong class="transaction-amount">${money(totalSpent(getGroupExpenses(group.id)))}</strong></div>`).join("");
  }
  function renderPendingPreview() {
    const pending = state.settlements.filter(item => item.status === "pending");
    if (!pending.length) return `<div class="empty-state" style="padding:18px 5px"><strong>All caught up</strong><p>No pending settlements right now.</p></div>`;
    return pending.slice(0, 2).map(item => `<div class="settlement-card"><div class="settlement-line"><strong>${escapeHtml(item.from)}</strong><span class="settlement-arrow">→</span><strong>${escapeHtml(item.to)}</strong><span class="settlement-amount">${money(item.amount)}</span></div><p>${escapeHtml(expenseGroup(item))}</p></div>`).join("");
  }
  function renderRecentTransactions(items) {
    if (!items.length) return emptyMarkup("Nothing to see just yet", "Add your first expense to bring the activity to life.", "new-expense", "Add an expense");
    return `<div class="transaction-list">${items.map(expense => `<div class="transaction" data-action="expense-detail" data-id="${escapeHtml(expense.id)}"><span class="category-icon">${categoryIcons[expense.category] || "◈"}</span><span class="transaction-info"><strong>${escapeHtml(expense.title)}${expense.sample ? " <span class='tag'>Sample</span>" : ""}</strong><small>${escapeHtml(expenseGroup(expense))} · ${prettyDate(expense.date)}</small></span><strong class="transaction-amount">${money(expense.amount)}</strong></div>`).join("")}</div>`;
  }
  function renderLineChart(months = 6) {
    const series = monthlyTotals(months);
    const max = Math.max(...series.map(item => item.total), 1);
    const points = series.map((item, index) => `${48 + index * (440 / Math.max(1, series.length - 1))},${166 - item.total / max * 126}`).join(" ");
    const pointList = series.map((item, index) => ({ x: 48 + index * (440 / Math.max(1, series.length - 1)), y: 166 - item.total / max * 126, ...item }));
    const areaPath = pointList.length ? `M ${pointList[0].x} 176 L ${pointList.map(point => `${point.x} ${point.y}`).join(" L ")} L ${pointList[pointList.length - 1].x} 176 Z` : "";
    return `<div class="chart-wrap"><svg viewBox="0 0 510 210" role="img" aria-label="Monthly group spending line chart"><defs><linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#75B900" stop-opacity=".2"/><stop offset="1" stop-color="#75B900" stop-opacity="0"/></linearGradient></defs>
      <line class="chart-gridline" x1="38" y1="40" x2="495" y2="40"/><line class="chart-gridline" x1="38" y1="82" x2="495" y2="82"/><line class="chart-gridline" x1="38" y1="124" x2="495" y2="124"/><line class="chart-gridline" x1="38" y1="166" x2="495" y2="166"/>
      <text class="axis-label" x="0" y="43">${shortMoney(max)}</text><text class="axis-label" x="0" y="127">${shortMoney(max / 3)}</text><path class="chart-area" d="${areaPath}"/><polyline class="chart-line" points="${points}"/>
      ${pointList.map(point => `<circle class="chart-dot" cx="${point.x}" cy="${point.y}" r="3.5"><title>${escapeHtml(point.label)}: ${money(point.total)}</title></circle><text class="axis-label" text-anchor="middle" x="${point.x}" y="196">${escapeHtml(point.label)}</text>`).join("")}</svg></div>`;
  }
  function monthlyTotals(count = 6) {
    const now = new Date();
    const months = [];
    for (let offset = count - 1; offset >= 0; offset--) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const total = state.expenses.filter(expense => expense.date.slice(0, 7) === key).reduce((sum, item) => sum + Number(item.amount), 0);
      months.push({ key, total, label: date.toLocaleDateString("en-IN", { month: "short" }) });
    }
    return months;
  }
  function shortMoney(amount) { return amount >= 1000 ? `₹${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k` : `₹${Math.round(amount)}`; }
  function categoryTotals(expenses) {
    return categories.map(category => ({ category, total: expenses.filter(item => item.category === category).reduce((sum, item) => sum + Number(item.amount), 0) })).filter(item => item.total > 0).sort((a, b) => b.total - a.total);
  }
  function renderDonut(expenses) {
    const totals = categoryTotals(expenses);
    const total = totals.reduce((sum, item) => sum + item.total, 0);
    if (!total) return `<div class="empty-state" style="padding:22px"><strong>No category data yet</strong><p>Add an expense to see the breakdown.</p></div>`;
    let cursor = 0;
    const segments = totals.map((item, index) => { const start = cursor; cursor += item.total / total * 100; return `${categoryColors[index % categoryColors.length]} ${start}% ${cursor}%`; }).join(", ");
    return `<div class="donut-row"><div class="donut" style="background:conic-gradient(${segments})"><div class="donut-center"><strong>${shortMoney(total)}</strong><span>total spend</span></div></div><div class="legend-list">${totals.slice(0, 5).map((item, index) => `<div class="legend-item"><i class="legend-swatch" style="background:${categoryColors[index % categoryColors.length]}"></i><span>${escapeHtml(item.category)}</span><strong>${Math.round(item.total / total * 100)}%</strong></div>`).join("")}</div></div>`;
  }
  function renderGroups() {
    return `${pageHeading("YOUR CIRCLE", "My groups", "Shared plans, everyday expenses and everything in between.", `<button class="btn btn-primary" data-action="new-group">＋ Create a group</button>`)}
      ${state.groups.length ? `<div class="group-grid">${groupCardsMarkup()}</div>` : groupCards([])}`;
  }
  function groupCardsMarkup() { return groupCards(state.groups); }
  function renderGroupDetail() {
    const group = groupById(activeGroupId);
    if (!group) { activeGroupId = null; return renderGroups(); }
    const groupExpenses = [...getGroupExpenses(group.id)].sort((a, b) => b.date.localeCompare(a.date));
    const balances = getBalances(group.id);
    return `${pageHeading(escapeHtml(group.category.toUpperCase()), escapeHtml(group.name), escapeHtml(group.description || "A group for sharing expenses fairly."), `<button class="btn btn-outline" data-action="edit-group" data-id="${escapeHtml(group.id)}">Edit group</button><button class="btn btn-primary" data-action="new-expense" data-group="${escapeHtml(group.id)}">＋ Add expense</button>`)}
      <div class="details-hero"><div><span class="tag">${escapeHtml(group.category)}${group.sample ? " · Sample data" : ""}</span><h2>${escapeHtml(group.name)}</h2><p>${escapeHtml(group.description || `${group.members.length} people making memories together.`)}</p></div><div><div class="summary-foot">Group expenses</div><strong class="summary-value">${money(totalSpent(groupExpenses))}</strong></div></div>
      <div class="balance-grid"><div class="panel"><div class="panel-header"><div><h2 class="panel-title">Group expenses</h2><p class="panel-subtitle">${groupExpenses.length} transactions</p></div></div>${renderExpenseTable(groupExpenses, false)}</div>
      <div><section class="panel"><div class="panel-header"><div><h2 class="panel-title">Members & balances</h2><p class="panel-subtitle">${group.members.length} members</p></div><button class="text-link" data-action="add-member" data-id="${escapeHtml(group.id)}">＋ Add member</button></div>
        <div class="member-chip-list">${group.members.map((member, index) => `<span class="member-chip"><span class="avatar" style="background:${peopleColors[index % peopleColors.length]}">${initials(member)}</span>${escapeHtml(member)}${member !== state.settings.name ? `<button class="remove-member" aria-label="Remove ${escapeHtml(member)}" title="Remove member" data-action="remove-member" data-id="${escapeHtml(group.id)}" data-member="${escapeHtml(member)}">×</button>` : ""}</span>`).join("")}</div>
        <div style="margin-top:15px">${group.members.map((member, index) => `<div class="balance-row"><span class="avatar" style="background:${peopleColors[index % peopleColors.length]}">${initials(member)}</span><div class="balance-person"><strong>${escapeHtml(member)}${member === state.settings.name ? " (you)" : ""}</strong><small>Net group balance</small></div><div class="balance-number ${balanceClass(balances.get(member) || 0)}">${money(Math.abs(balances.get(member) || 0))}<div class="balance-type">${balanceLabel(balances.get(member) || 0)}</div></div></div>`).join("")}</div>
      </section><section class="panel"><div class="panel-header"><div><h2 class="panel-title">Settle up</h2><p class="panel-subtitle">Suggested transfers for this group</p></div></div>${renderSuggestions(getSuggestions(group.id))}</section></div></div>`;
  }
  function renderExpenses() {
    const groupOptions = state.groups.map(group => `<option value="${escapeHtml(group.id)}">${escapeHtml(group.name)}</option>`).join("");
    const categoryOptions = categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("");
    return `${pageHeading("THE LITTLE DETAILS", "All expenses", "Every shared spend, neatly in one place.", `<button class="btn btn-outline" data-action="export-csv">↓ Export CSV</button><button class="btn btn-primary" data-action="new-expense">＋ Add expense</button>`)}
      <div class="filter-bar">
        <label class="search-field"><span>⌕</span><input id="expense-search" class="field-control" placeholder="Search expenses..." aria-label="Search expenses"></label>
        <select id="filter-group" class="field-control"><option value="">All groups</option>${groupOptions}</select>
        <select id="filter-category" class="field-control"><option value="">All categories</option>${categoryOptions}</select>
        <select id="filter-member" class="field-control"><option value="">All members</option>${allMembers().map(member => `<option value="${escapeHtml(member)}">${escapeHtml(member)}</option>`).join("")}</select>
        <select id="filter-sort" class="field-control"><option value="date-desc">Newest first</option><option value="date-asc">Oldest first</option><option value="amount-desc">Amount: high to low</option><option value="amount-asc">Amount: low to high</option></select>
        <input id="filter-from" type="date" class="field-control" aria-label="From date" title="From date"><input id="filter-to" type="date" class="field-control" aria-label="To date" title="To date">
      </div><div id="expense-results" class="panel">${renderExpenseTable(state.expenses)}</div>`;
  }
  function renderExpenseTable(expenses, includeGroup = true) {
    if (!expenses.length) return emptyMarkup("No expenses found", "Try changing the filters or add a new expense.", "new-expense", "Add an expense");
    return `<div class="expense-table-wrap"><table class="expense-table"><thead><tr><th>Expense</th>${includeGroup ? "<th>Group</th>" : ""}<th>Paid by</th><th>Date</th><th>Category</th><th>Amount</th><th></th></tr></thead><tbody>${expenses.map(expense => `<tr data-action="expense-detail" data-id="${escapeHtml(expense.id)}">
      <td><div class="expense-title-cell"><span class="category-icon">${categoryIcons[expense.category] || "◈"}</span><span>${escapeHtml(expense.title)}${expense.sample ? `<small style="display:block;color:#737d6c;font-size:8px;font-weight:400;margin-top:3px">Sample data</small>` : ""}</span></div></td>
      ${includeGroup ? `<td>${escapeHtml(expenseGroup(expense))}</td>` : ""}<td>${escapeHtml(expense.payer)}</td><td>${prettyDate(expense.date)}</td><td><span class="tag">${escapeHtml(expense.category)}</span></td><td style="font-weight:700;color:var(--deep)">${money(expense.amount)}</td>
      <td><div class="row-actions"><button data-action="edit-expense" data-id="${escapeHtml(expense.id)}" aria-label="Edit expense">✎</button><button data-action="delete-expense" data-id="${escapeHtml(expense.id)}" aria-label="Delete expense">×</button></div></td></tr>`).join("")}</tbody></table></div>`;
  }
  function emptyMarkup(title, description, action, label) { return `<div class="empty-state"><div class="empty-icon">◌</div><strong>${title}</strong><p>${description}</p><button class="btn btn-outline btn-small" data-action="${action}">${label}</button></div>`; }
  function renderBalances() {
    const balances = getBalances();
    const entries = [...balances].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    const suggestions = getSuggestions();
    return `${pageHeading("KEEP IT FAIR", "Balances", "A clear view of who's covered what across all groups.", `<button class="btn btn-primary" data-page="settlements">Manage settlements</button>`)}
      <div class="summary-grid">${summaryCard("You owe", money(getUserOwes()), "Your share to settle", "↓", "red")}${summaryCard("Owed to you", money(getUserOwed()), "Others' share to settle", "↑", "green")}${summaryCard("Pending settlements", String(state.settlements.filter(item => item.status === "pending").length), "Across all groups", "⇄", "gold")}${summaryCard("Suggested transfers", String(suggestions.length), "To settle with fewer steps", "✦", "")}</div>
      <div class="balance-grid"><section class="panel"><div class="panel-header"><div><h2 class="panel-title">Individual balances</h2><p class="panel-subtitle">Positive means they're owed; negative means they owe.</p></div></div>${entries.length ? entries.map(([name, balance], index) => `<div class="balance-row"><span class="avatar" style="background:${peopleColors[index % peopleColors.length]}">${initials(name)}</span><div class="balance-person"><strong>${escapeHtml(name)}${name === state.settings.name ? " (you)" : ""}</strong><small>Across shared groups</small></div><div class="balance-number ${balanceClass(balance)}">${balance > .005 ? "+" : balance < -.005 ? "−" : ""}${money(Math.abs(balance))}<div class="balance-type">${balanceLabel(balance)}</div></div></div>`).join("") : `<div class="empty-state"><strong>No balances yet</strong><p>Add a group and its first expense to see balances here.</p></div>`}</section>
      <section class="panel"><div class="panel-header"><div><h2 class="panel-title">Simplify settlements</h2><p class="panel-subtitle">A shorter path to square things up.</p></div></div>${renderSuggestions(suggestions)}</section></div>`;
  }
  function balanceClass(amount) { return amount > .005 ? "positive-text" : amount < -.005 ? "negative-text" : ""; }
  function balanceLabel(amount) { return amount > .005 ? "gets back" : amount < -.005 ? "owes" : "settled"; }
  function renderSuggestions(suggestions) {
    if (!suggestions.length) return `<div class="empty-state" style="padding:25px 10px"><div class="empty-icon">✓</div><strong>Everyone is all settled</strong><p>There are no outstanding balances to simplify.</p></div>`;
    return suggestions.map((item, index) => `<div class="settlement-card"><div class="settlement-line"><span class="avatar" style="width:25px;height:25px;background:${peopleColors[index % peopleColors.length]}">${initials(item.from)}</span><strong>${escapeHtml(item.from)}</strong><span class="settlement-arrow">→</span><span class="avatar" style="width:25px;height:25px;background:${peopleColors[(index + 2) % peopleColors.length]}">${initials(item.to)}</span><strong>${escapeHtml(item.to)}</strong><span class="settlement-amount">${money(item.amount)}</span></div><p>${escapeHtml(expenseGroup({ groupId: item.groupId }))} · suggested transfer <button class="text-link" style="float:right;padding:0" data-action="record-settlement" data-from="${escapeHtml(item.from)}" data-to="${escapeHtml(item.to)}" data-amount="${item.amount}" data-group="${escapeHtml(item.groupId)}">Record</button></p></div>`).join("");
  }
  function renderSettlements() {
    const filtered = state.settlements.filter(item => item.status === settlementTab).sort((a, b) => b.date.localeCompare(a.date));
    const tabs = `<div class="tabs"><button class="tab-button ${settlementTab === "pending" ? "active" : ""}" data-action="settlement-tab" data-tab="pending">Pending (${state.settlements.filter(item => item.status === "pending").length})</button><button class="tab-button ${settlementTab === "completed" ? "active" : ""}" data-action="settlement-tab" data-tab="completed">Completed (${state.settlements.filter(item => item.status === "completed").length})</button></div>`;
    return `${pageHeading("THE LAST LITTLE BIT", "Settlements", "Track proposed and completed paybacks. No money moves here.", `<button class="btn btn-outline" data-page="balances">View balances</button><button class="btn btn-primary" data-action="new-settlement">＋ Record settlement</button>`)}
      <div class="balance-grid"><section class="panel"><div class="panel-header"><div><h2 class="panel-title">Your settlements</h2><p class="panel-subtitle">Record a transfer once your group has settled up offline.</p></div></div>${tabs}${filtered.length ? filtered.map((item, index) => `<div class="settlement-card"><div class="settlement-line"><span class="avatar" style="width:28px;height:28px;background:${peopleColors[index % peopleColors.length]}">${initials(item.from)}</span><strong>${escapeHtml(item.from)}</strong><span class="settlement-arrow">→</span><span class="avatar" style="width:28px;height:28px;background:${peopleColors[(index + 2) % peopleColors.length]}">${initials(item.to)}</span><strong>${escapeHtml(item.to)}</strong><span class="settlement-amount">${money(item.amount)}</span></div><p>${escapeHtml(expenseGroup(item))} · ${prettyDate(item.date)}${item.sample ? " · Sample" : ""}${item.status === "completed" ? `<span class="settlement-status">✓ Completed</span>` : `<button class="btn btn-soft btn-small" style="float:right;margin-top:-8px" data-action="complete-settlement" data-id="${escapeHtml(item.id)}">Mark completed</button>`}</p></div>`).join("") : `<div class="empty-state"><div class="empty-icon">${settlementTab === "pending" ? "✓" : "◌"}</div><strong>${settlementTab === "pending" ? "Nothing waiting to be settled" : "No completed settlements yet"}</strong><p>${settlementTab === "pending" ? "You're all caught up." : "Completed paybacks will be listed here."}</p></div>`}</section>
      <div><section class="panel"><div class="panel-header"><div><h2 class="panel-title">Suggested transfers</h2><p class="panel-subtitle">Optimized to keep the number of transfers low.</p></div></div>${renderSuggestions(getSuggestions())}</section><section class="panel"><div class="panel-header"><div><h2 class="panel-title">A quick note</h2></div></div><p style="color:var(--muted);font-size:10px;line-height:1.7;margin:0">SplitSmart tracks shared costs and settlement records only. It never sends money or connects to a bank or payment service.</p></section></div></div>`;
  }
  function renderAnalytics() {
    const categoryData = categoryTotals(state.expenses);
    const groupData = state.groups.map(group => ({ name: group.name, total: totalSpent(getGroupExpenses(group.id)) })).sort((a, b) => b.total - a.total);
    const memberPaid = new Map();
    state.expenses.forEach(expense => memberPaid.set(expense.payer, (memberPaid.get(expense.payer) || 0) + Number(expense.amount)));
    const memberData = [...memberPaid].sort((a, b) => b[1] - a[1]);
    const maxCat = Math.max(1, ...categoryData.map(item => item.total));
    const maxGroup = Math.max(1, ...groupData.map(item => item.total));
    const maxMember = Math.max(1, ...memberData.map(([, total]) => total));
    return `${pageHeading("A LITTLE PERSPECTIVE", "Insights & analytics", "Patterns in your shared spending, made easy to understand.", `<select class="select-small" id="trend-range"><option value="6">Last 6 months</option><option value="12">Last 12 months</option></select>`)}
      <div class="analytics-grid"><section class="panel"><div class="panel-header"><div><h2 class="panel-title">Monthly expense trends</h2><p class="panel-subtitle">Total group spending over time</p></div></div><div id="analytics-chart">${renderBarChart(6)}</div></section>
      <div><section class="panel"><div class="panel-header"><div><h2 class="panel-title">Spending by category</h2><p class="panel-subtitle">Across all expenses</p></div></div>${categoryData.length ? categoryData.map((item, index) => `<div class="progress-item"><div class="progress-label"><span>${categoryIcons[item.category] || "◈"} &nbsp;${escapeHtml(item.category)}</span><strong>${money(item.total)}</strong></div><div class="progress-track"><div class="progress-fill" style="width:${item.total / maxCat * 100}%;background:${categoryColors[index % categoryColors.length]}"></div></div></div>`).join("") : `<div class="empty-state"><strong>No data yet</strong><p>Start sharing expenses to see patterns.</p></div>`}</section>
      <section class="panel"><div class="panel-header"><div><h2 class="panel-title">Who's paying</h2><p class="panel-subtitle">Contributions by member</p></div></div>${memberData.length ? memberData.slice(0, 6).map(([name, total], index) => `<div class="progress-item"><div class="progress-label"><span>${escapeHtml(name)}</span><strong>${money(total)}</strong></div><div class="progress-track"><div class="progress-fill" style="width:${total / maxMember * 100}%;background:${peopleColors[index % peopleColors.length]}"></div></div></div>`).join("") : `<div class="empty-state"><strong>No contributions yet</strong></div>`}</section></div>
      <section class="panel"><div class="panel-header"><div><h2 class="panel-title">Group comparison</h2><p class="panel-subtitle">Shared total by group</p></div></div>${groupData.length ? groupData.map((item, index) => `<div class="progress-item"><div class="progress-label"><span>${escapeHtml(item.name)}</span><strong>${money(item.total)}</strong></div><div class="progress-track"><div class="progress-fill" style="width:${item.total / maxGroup * 100}%;background:${peopleColors[index % peopleColors.length]}"></div></div></div>`).join("") : `<div class="empty-state"><strong>No groups to compare</strong></div>`}</section></div>
      <section class="panel" style="margin-top:15px"><div class="panel-header"><div><h2 class="panel-title">Recent activity</h2><p class="panel-subtitle">A timeline of the latest shared expenses</p></div><button class="text-link" data-page="expenses">All expenses ↗</button></div>${renderRecentTransactions([...state.expenses].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5))}</section>`;
  }
  function renderBarChart(count) {
    const series = monthlyTotals(count), max = Math.max(1, ...series.map(item => item.total));
    return `<div class="bar-chart">${series.map((item, index) => `<div class="bar-column"><span class="bar-value">${item.total ? shortMoney(item.total) : ""}</span><div class="bar" style="height:${Math.max(3, item.total / max * 125)}px;opacity:${.57 + index / series.length * .4}"></div><span class="bar-label">${escapeHtml(item.label)}</span></div>`).join("")}</div>`;
  }
  function renderSettings() {
    return `${pageHeading("MAKE IT YOURS", "Settings", "A few small things to make SplitSmart feel like yours.", "")}
      <div class="balance-grid"><section class="panel"><div class="panel-header"><div><h2 class="panel-title">Your profile</h2><p class="panel-subtitle">This name appears in your groups and expenses.</p></div></div>
        <form id="profile-form"><div class="form-field"><label for="profile-name">Display name</label><input id="profile-name" class="field-input" value="${escapeHtml(state.settings.name || USER)}" maxlength="60" required></div><div style="margin-top:14px"><button class="btn btn-primary" type="submit">Save profile</button></div></form></section>
        <section class="panel"><div class="panel-header"><div><h2 class="panel-title">Preferences</h2><p class="panel-subtitle">Make yourself comfortable.</p></div></div>
          <div class="switch-row"><div><strong>Dark mode</strong><small>A softer look for late-night planning.</small></div><input id="dark-mode-toggle" class="switch" type="checkbox" ${state.settings.darkMode ? "checked" : ""} aria-label="Enable dark mode"></div>
          <div class="switch-row"><div><strong>Activity notifications</strong><small>Show a gentle reminder for pending settlements.</small></div><input id="notifications-toggle" class="switch" type="checkbox" ${state.settings.notifications !== false ? "checked" : ""} aria-label="Enable notifications"></div>
        </section>
        <section class="panel"><div class="panel-header"><div><h2 class="panel-title">Your data stays yours</h2><p class="panel-subtitle">Stored locally in this browser</p></div></div><p style="font-size:10px;color:var(--muted);line-height:1.7">Your groups, expenses and settlements are saved to this device using LocalStorage. SplitSmart has no account, backend, payment connection or banking integration.</p><button class="btn btn-outline btn-small" data-action="export-csv">Export expense CSV</button></section>
        <section class="panel"><div class="panel-header"><div><h2 class="panel-title">Sample data</h2><p class="panel-subtitle">The starting groups and expenses are clearly marked.</p></div></div><p style="font-size:10px;color:var(--muted);line-height:1.7">Sample entries help you explore SplitSmart. You can delete them individually or clear your local workspace.</p><button class="btn btn-outline btn-small" data-action="clear-sample">Remove sample data</button></section></div>`;
  }
  function showModal(title, subtitle, content, wide = false) {
    $("#modal-root").innerHTML = `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal ${wide ? "modal-wide" : ""}" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><div class="modal-header"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div><button class="modal-close" data-action="close-modal" aria-label="Close dialog">×</button></div>${content}</section></div>`;
  }
  function closeModal() { $("#modal-root").innerHTML = ""; }
  function showConfirm(title, message, confirmLabel, onConfirm, danger = false) {
    showModal(title, message, `<div class="modal-form"><p style="font-size:11px;color:var(--muted);line-height:1.7">${escapeHtml(message)}</p><div class="modal-footer"><button class="btn btn-outline" data-action="close-modal">Cancel</button><button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-action="confirm-modal">${escapeHtml(confirmLabel)}</button></div></div>`);
    $("#modal-root").dataset.confirmAction = "yes";
    $("#modal-root")._onConfirm = onConfirm;
  }
  function openGroupForm(id = "") {
    const group = id ? groupById(id) : null;
    const memberNames = group ? group.members.filter(name => name !== state.settings.name).join(", ") : "";
    const content = `<form id="group-form" class="modal-form" data-id="${group ? escapeHtml(group.id) : ""}"><div class="form-grid">
      <div class="form-field full"><label for="group-name">Group name *</label><input id="group-name" class="field-input" required maxlength="60" placeholder="e.g. Weekend in the hills" value="${escapeHtml(group?.name || "")}"></div>
      <div class="form-field"><label for="group-category">Category</label><select id="group-category" class="field-select">${["Hostel", "Roommates", "Trips", "Friends", "Other"].map(category => `<option ${group?.category === category ? "selected" : ""}>${category}</option>`).join("")}</select></div>
      <div class="form-field"><label for="group-members">Members</label><input id="group-members" class="field-input" placeholder="Priya Sharma, Rohan Mehta" value="${escapeHtml(memberNames)}"><small class="form-help">Separate names with commas. You're included automatically.</small></div>
      <div class="form-field full"><label for="group-description">Description</label><textarea id="group-description" class="field-textarea" maxlength="160" placeholder="What's this group for?">${escapeHtml(group?.description || "")}</textarea></div>
    </div><div class="modal-footer"><button type="button" class="btn btn-outline" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">${group ? "Save changes" : "Create group"}</button></div></form>`;
    showModal(group ? "Edit your group" : "Create a group", group ? "Update the details and members." : "Bring your people together in one place.", content);
    $("#group-name").focus();
  }
  function openMemberForm(id) {
    const group = groupById(id);
    if (!group) return;
    showModal("Add a group member", `Invite someone into ${group.name}.`, `<form id="member-form" class="modal-form" data-id="${escapeHtml(group.id)}"><div class="form-field"><label for="member-name">Member name *</label><input id="member-name" class="field-input" maxlength="60" required placeholder="e.g. Sam Patel"></div><div class="modal-footer"><button type="button" class="btn btn-outline" data-action="close-modal">Cancel</button><button type="submit" class="btn btn-primary">Add member</button></div></form>`);
    $("#member-name").focus();
  }
  function openExpenseForm(id = "", defaultGroupId = "") {
    const expense = id ? state.expenses.find(item => item.id === id) : null;
    if (expense?.sample) { toast("Sample expenses are read-only. Add a new expense to try it out.", "error"); return; }
    if (!state.groups.length) { toast("Create a group before adding an expense.", "error"); openGroupForm(); return; }
    const groupId = expense?.groupId || (groupById(defaultGroupId) ? defaultGroupId : state.groups[0].id);
    const group = groupById(groupId);
    const selected = expense?.participants || group.members;
    const content = `<form id="expense-form" class="modal-form" data-id="${expense ? escapeHtml(expense.id) : ""}">
      <div class="form-grid">
        <div class="form-field full"><label for="expense-title">Expense title *</label><input id="expense-title" class="field-input" required maxlength="80" placeholder="e.g. Dinner at the new place" value="${escapeHtml(expense?.title || "")}"></div>
        <div class="form-field"><label for="expense-amount">Total amount (₹) *</label><input id="expense-amount" class="field-input" type="number" min="0.01" step="0.01" required placeholder="0.00" value="${expense ? Number(expense.amount).toFixed(2) : ""}"></div>
        <div class="form-field"><label for="expense-category">Category</label><select id="expense-category" class="field-select">${categories.map(category => `<option ${expense?.category === category ? "selected" : ""}>${category}</option>`).join("")}</select></div>
        <div class="form-field"><label for="expense-date">Date *</label><input id="expense-date" class="field-input" type="date" required value="${escapeHtml(expense?.date || todayISO())}"></div>
        <div class="form-field"><label for="expense-group">Group *</label><select id="expense-group" class="field-select">${state.groups.map(item => `<option value="${escapeHtml(item.id)}" ${item.id === groupId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select></div>
        <div class="form-field full"><label for="expense-payer">Paid by *</label><select id="expense-payer" class="field-select">${group.members.map(member => `<option value="${escapeHtml(member)}" ${member === (expense?.payer || state.settings.name) ? "selected" : ""}>${escapeHtml(member)}</option>`).join("")}</select></div>
        <div class="form-field full"><label>Include participants *</label><div class="participant-list" id="participant-list">${participantOptions(group, selected)}</div></div>
        <div class="form-field"><label for="expense-split-method">Split method</label><select id="expense-split-method" class="field-select"><option value="equal" ${!expense || expense.method === "equal" ? "selected" : ""}>Equally</option><option value="unequal" ${expense?.method === "unequal" ? "selected" : ""}>Unequally (amounts)</option><option value="percentage" ${expense?.method === "percentage" ? "selected" : ""}>By percentage</option></select></div>
        <div class="form-field"><label>Split details</label><div id="split-inputs" class="split-inputs"></div></div>
        <div class="form-field full"><label for="expense-description">Description (optional)</label><textarea id="expense-description" class="field-textarea" maxlength="240" placeholder="Add a note for the group...">${escapeHtml(expense?.description || "")}</textarea></div>
      </div>
      <div class="modal-footer"><button type="button" class="btn btn-outline" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">${expense ? "Save changes" : "Add expense"}</button></div></form>`;
    showModal(expense ? "Edit expense" : "Add an expense", "Split it fairly. Keep the good times going.", content, true);
    renderSplitInputs(expense?.shares || {});
    $("#expense-title").focus();
  }
  function participantOptions(group, selected = group.members) {
    return group.members.map(member => `<label class="participant-option"><input type="checkbox" name="participant" value="${escapeHtml(member)}" ${selected.includes(member) ? "checked" : ""}>${escapeHtml(member)}</label>`).join("");
  }
  function selectedParticipants() { return $$('input[name="participant"]:checked', $("#modal-root")).map(input => input.value); }
  function renderSplitInputs(previous = {}) {
    const container = $("#split-inputs");
    if (!container) return;
    const method = $("#expense-split-method").value;
    const participants = selectedParticipants();
    if (method === "equal") {
      container.innerHTML = `<span class="form-help">${participants.length ? `Each person's share is calculated evenly across ${participants.length} participant${participants.length === 1 ? "" : "s"}.` : "Select at least one participant."}</span>`;
      return;
    }
    const amount = Number($("#expense-amount").value) || 0;
    container.innerHTML = participants.map((member, index) => {
      let value = previous[member];
      if (value === undefined) value = method === "percentage" ? participants.length ? (100 / participants.length).toFixed(2) : "" : participants.length ? (amount / participants.length).toFixed(2) : "";
      return `<div class="split-input-row"><span>${escapeHtml(member)}</span><input class="field-input share-input" type="number" min="0" step="0.01" data-share-name="${escapeHtml(member)}" value="${escapeHtml(value)}" placeholder="${method === "percentage" ? "0%" : "₹0.00"}" aria-label="${escapeHtml(member)} ${method === "percentage" ? "percentage" : "amount"}"></div>`;
    }).join("") || `<span class="form-help">Select at least one participant.</span>`;
    if (method === "percentage") container.insertAdjacentHTML("beforeend", `<span class="form-help">Percentages must total exactly 100%.</span>`);
  }
  function readShareInputs() {
    const result = {};
    $$(".share-input", $("#modal-root")).forEach(input => { result[input.dataset.shareName] = input.value; });
    return result;
  }
  function updateExpenseGroup() {
    const form = $("#expense-form");
    if (!form) return;
    const group = groupById($("#expense-group").value);
    if (!group) return;
    const previous = readShareInputs();
    $("#participant-list").innerHTML = participantOptions(group, group.members);
    const payerSelect = $("#expense-payer");
    const currentPayer = payerSelect.value;
    payerSelect.innerHTML = group.members.map(member => `<option value="${escapeHtml(member)}" ${member === currentPayer ? "selected" : ""}>${escapeHtml(member)}</option>`).join("");
    if (!group.members.includes(currentPayer)) payerSelect.value = group.members.includes(state.settings.name) ? state.settings.name : group.members[0];
    renderSplitInputs(previous);
  }
  function openSettlementForm(defaults = {}) {
    const members = allMembers();
    if (members.length < 2) { toast("Add at least two group members before recording a settlement.", "error"); return; }
    const content = `<form id="settlement-form" class="modal-form"><div class="form-grid">
      <div class="form-field"><label for="settlement-from">Paid by *</label><select id="settlement-from" class="field-select">${members.map(member => `<option ${member === defaults.from ? "selected" : ""}>${escapeHtml(member)}</option>`).join("")}</select></div>
      <div class="form-field"><label for="settlement-to">Paid to *</label><select id="settlement-to" class="field-select">${members.map(member => `<option ${member === defaults.to ? "selected" : ""}>${escapeHtml(member)}</option>`).join("")}</select></div>
      <div class="form-field"><label for="settlement-amount">Amount (₹) *</label><input id="settlement-amount" class="field-input" type="number" min="0.01" step="0.01" required value="${defaults.amount || ""}" placeholder="0.00"></div>
      <div class="form-field"><label for="settlement-group">Group *</label><select id="settlement-group" class="field-select">${state.groups.map(group => `<option value="${escapeHtml(group.id)}" ${group.id === defaults.groupId ? "selected" : ""}>${escapeHtml(group.name)}</option>`).join("")}</select></div>
      <div class="form-field full"><label for="settlement-date">Date *</label><input id="settlement-date" type="date" class="field-input" value="${todayISO()}" required></div>
      </div><p class="form-help" style="margin-top:12px">Recording a settlement is only a note for your group. It doesn't transfer money.</p><div class="modal-footer"><button type="button" class="btn btn-outline" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit">Record as pending</button></div></form>`;
    showModal("Record a settlement", "Keep track of an offline payback.", content);
  }
  function detailExpense(id) {
    const expense = state.expenses.find(item => item.id === id);
    if (!expense) return;
    const participants = expense.participants || Object.keys(expense.shares || {});
    const shares = Object.entries(expense.shares || {}).map(([name, share]) => `<div class="detail-row"><span>${escapeHtml(name)}'s share</span><strong>${money(share)}</strong></div>`).join("");
    showModal(expense.title, `${expense.sample ? "Sample expense · " : ""}${expenseGroup(expense)} · ${prettyDate(expense.date)}`, `<div class="detail-list">
      <div class="detail-row"><span>Total amount</span><strong>${money(expense.amount)}</strong></div><div class="detail-row"><span>Category</span><strong>${escapeHtml(expense.category)}</strong></div><div class="detail-row"><span>Paid by</span><strong>${escapeHtml(expense.payer)}</strong></div><div class="detail-row"><span>Split method</span><strong>${expense.method === "equal" ? "Equally" : expense.method === "percentage" ? "Percentage-based" : "Unequally"}</strong></div>
      ${expense.description ? `<div class="detail-row"><span>Description</span><strong>${escapeHtml(expense.description)}</strong></div>` : ""}<div style="padding:13px 0 7px;font-size:10px;font-weight:700">Participant shares (${participants.length})</div>${shares}
      ${expense.sample ? `<p class="form-help" style="padding-top:12px">This is starter sample data. Add a new expense to explore editing and deletion.</p>` : `<div class="modal-footer"><button class="btn btn-outline" data-action="edit-expense" data-id="${escapeHtml(expense.id)}">Edit</button><button class="btn btn-danger" data-action="delete-expense" data-id="${escapeHtml(expense.id)}">Delete</button></div>`}
    </div>`);
  }
  function applyExpenseFilters() {
    const query = ($("#expense-search")?.value || "").trim().toLowerCase();
    const group = $("#filter-group")?.value || "";
    const category = $("#filter-category")?.value || "";
    const member = $("#filter-member")?.value || "";
    const from = $("#filter-from")?.value || "";
    const to = $("#filter-to")?.value || "";
    const sort = $("#filter-sort")?.value || "date-desc";
    const results = state.expenses.filter(expense => {
      const haystack = `${expense.title} ${expense.description || ""} ${expense.payer} ${expenseGroup(expense)}`.toLowerCase();
      return (!query || haystack.includes(query)) && (!group || expense.groupId === group) && (!category || expense.category === category) && (!member || expense.payer === member || expense.participants.includes(member)) && (!from || expense.date >= from) && (!to || expense.date <= to);
    }).sort((a, b) => sort === "date-asc" ? a.date.localeCompare(b.date) : sort === "amount-asc" ? a.amount - b.amount : sort === "amount-desc" ? b.amount - a.amount : b.date.localeCompare(a.date));
    const resultsNode = $("#expense-results");
    if (resultsNode) resultsNode.innerHTML = renderExpenseTable(results);
  }
  function exportCSV() {
    const headings = ["Title", "Amount (INR)", "Category", "Date", "Paid by", "Group", "Split method", "Participants", "Description"];
    const rows = state.expenses.map(item => [item.title, Number(item.amount).toFixed(2), item.category, item.date, item.payer, expenseGroup(item), item.method, item.participants.join("; "), item.description || ""]);
    const csv = [headings, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    link.download = `splitsmart-expenses-${todayISO()}.csv`;
    document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(link.href);
    toast("Your expense summary is ready to download.");
  }
  function openGroup(id) { if (!groupById(id)) return; activeGroupId = id; currentPage = "groups"; renderApp(); }
  function deleteExpense(id) {
    const expense = state.expenses.find(item => item.id === id);
    if (!expense || expense.sample) { toast("Sample expenses cannot be deleted.", "error"); return; }
    closeModal();
    showConfirm("Delete this expense?", `“${expense.title}” will be removed from ${expenseGroup(expense)} and balances will be recalculated.`, "Delete expense", () => {
      state.expenses = state.expenses.filter(item => item.id !== id);
      save(); renderApp(); toast("Expense deleted.");
    }, true);
  }
  function deleteGroup(id) {
    const group = groupById(id);
    if (!group) return;
    showConfirm("Delete this group?", `${group.name}, its expenses and its settlement records will be permanently removed from this browser.`, "Delete group", () => {
      state.groups = state.groups.filter(item => item.id !== id);
      state.expenses = state.expenses.filter(item => item.groupId !== id);
      state.settlements = state.settlements.filter(item => item.groupId !== id);
      if (activeGroupId === id) activeGroupId = null;
      save(); renderApp(); toast("Group and its records deleted.");
    }, true);
  }
  function markSettlementComplete(id) {
    const item = state.settlements.find(entry => entry.id === id);
    if (!item || item.status !== "pending") return;
    item.status = "completed";
    item.date = todayISO();
    item.sample = false;
    save(); renderApp(); toast("Settlement marked as completed.");
  }
  function recordSuggestion(button) {
    openSettlementForm({ from: button.dataset.from, to: button.dataset.to, amount: button.dataset.amount, groupId: button.dataset.group });
  }
  function dispatchAction(action, target) {
    const id = target.dataset.id;
    switch (action) {
      case "new-group": openGroupForm(); break;
      case "edit-group": openGroupForm(id); break;
      case "delete-group": deleteGroup(id); break;
      case "open-group": openGroup(id); break;
      case "new-expense": openExpenseForm("", target.dataset.group || ""); break;
      case "edit-expense": closeModal(); openExpenseForm(id); break;
      case "delete-expense": deleteExpense(id); break;
      case "expense-detail": detailExpense(id); break;
      case "add-member": openMemberForm(id); break;
      case "remove-member": {
        const group = groupById(id), member = target.dataset.member;
        if (!group || member === state.settings.name) return;
        showConfirm("Remove this member?", `${member} will be removed from ${group.name}. Existing expense records will remain unchanged.`, "Remove member", () => {
          group.members = group.members.filter(name => name !== member); save(); renderApp(); toast("Member removed from the group.");
        }, true); break;
      }
      case "export-csv": exportCSV(); break;
      case "settlement-tab": settlementTab = target.dataset.tab; renderApp(); break;
      case "complete-settlement": markSettlementComplete(id); break;
      case "record-settlement": recordSuggestion(target); break;
      case "new-settlement": openSettlementForm(); break;
      case "confirm-modal": {
        const callback = $("#modal-root")._onConfirm;
        closeModal(); if (callback) callback(); break;
      }
      case "close-modal": closeModal(); break;
      case "backdrop-close": if (target === $(".modal-backdrop", $("#modal-root"))) closeModal(); break;
      case "clear-sample":
        showConfirm("Remove sample data?", "This removes the starter groups, expenses and settlements. Your own records are kept.", "Remove samples", () => {
          state.expenses = state.expenses.filter(item => !item.sample);
          state.settlements = state.settlements.filter(item => !item.sample);
          state.groups = state.groups.filter(group => {
            const hasPersonalRecords = state.expenses.some(item => item.groupId === group.id) || state.settlements.some(item => item.groupId === group.id);
            if (group.sample && hasPersonalRecords) { group.sample = false; return true; }
            return !group.sample;
          });
          activeGroupId = null; save(); renderApp(); toast("Sample data removed.");
        }, true); break;
    }
  }

  document.addEventListener("click", event => {
    const pageLink = event.target.closest("[data-page]");
    if (pageLink) {
      event.preventDefault();
      currentPage = pageLink.dataset.page;
      if (currentPage !== "groups") activeGroupId = null;
      renderApp(); $("#sidebar").classList.remove("open"); $("#sidebar-scrim").classList.remove("visible");
      return;
    }
    const actionTarget = event.target.closest("[data-action]");
    if (actionTarget) dispatchAction(actionTarget.dataset.action, actionTarget);
  });
  document.addEventListener("submit", event => {
    if (event.target.id === "group-form") {
      event.preventDefault();
      const form = event.target, id = form.dataset.id, existing = id ? groupById(id) : null;
      const name = $("#group-name").value.trim();
      const category = $("#group-category").value;
      const description = $("#group-description").value.trim();
      const parsed = $("#group-members").value.split(",").map(value => value.trim()).filter(Boolean);
      const members = [...new Set([state.settings.name, ...parsed])];
      if (!name) return toast("Give your group a name first.", "error");
      if (members.length < 1) return toast("A group needs at least one member.", "error");
      if (state.groups.some(group => group.id !== id && group.name.toLowerCase() === name.toLowerCase())) return toast("A group with that name already exists.", "error");
      if (existing) Object.assign(existing, { name, category, description, members, sample: false });
      else {
        const group = { id: uid("group"), name, category, description, members, sample: false };
        state.groups.push(group); activeGroupId = group.id; currentPage = "groups";
      }
      save(); closeModal(); renderApp(); toast(existing ? "Group updated." : "Your group is ready.");
    }
    if (event.target.id === "member-form") {
      event.preventDefault();
      const group = groupById(event.target.dataset.id);
      const name = $("#member-name").value.trim();
      if (!group || !name) return toast("Enter a member name.", "error");
      if (group.members.some(member => member.toLowerCase() === name.toLowerCase())) return toast("That person is already in this group.", "error");
      group.members.push(name); group.sample = false; save(); closeModal(); renderApp(); toast(`${name} added to ${group.name}.`);
    }
    if (event.target.id === "expense-form") {
      event.preventDefault();
      const form = event.target;
      const old = form.dataset.id ? state.expenses.find(item => item.id === form.dataset.id) : null;
      const title = $("#expense-title").value.trim();
      const amount = Math.round(Number($("#expense-amount").value) * 100) / 100;
      const date = $("#expense-date").value;
      const groupId = $("#expense-group").value;
      const group = groupById(groupId);
      const participants = selectedParticipants();
      const method = $("#expense-split-method").value;
      if (!title || !Number.isFinite(amount) || amount <= 0 || !date || !group) return toast("Enter a title, valid amount, date and group.", "error");
      if (date > todayISO()) return toast("Expense date cannot be in the future.", "error");
      if (!participants.length) return toast("Choose at least one participant.", "error");
      const payer = $("#expense-payer").value;
      if (!group.members.includes(payer)) return toast("The payer must be a member of this group.", "error");
      let shares = {};
      if (method === "equal") {
        const totalCents = Math.round(amount * 100), each = Math.floor(totalCents / participants.length), remainder = totalCents - each * participants.length;
        participants.forEach((member, index) => { shares[member] = (each + (index < remainder ? 1 : 0)) / 100; });
      } else {
        const values = $$(".share-input", $("#modal-root")).map(input => [input.dataset.shareName, Number(input.value)]);
        if (values.length !== participants.length || values.some(([, value]) => !Number.isFinite(value) || value < 0)) return toast("Enter a valid non-negative share for every participant.", "error");
        const sum = values.reduce((total, [, value]) => total + value, 0);
        const expected = method === "percentage" ? 100 : amount;
        if (Math.abs(sum - expected) > .010001) return toast(method === "percentage" ? "Participant percentages must add up to 100%." : `Participant amounts must add up to ${money(amount)}.`, "error");
        if (method === "percentage") {
          let allocated = 0;
          values.forEach(([member, percentage], index) => {
            const share = index === values.length - 1 ? Math.round((amount - allocated) * 100) / 100 : Math.round(amount * percentage) / 100;
            shares[member] = share; allocated += share;
          });
        } else {
          values.forEach(([member, value]) => { shares[member] = Math.round(value * 100) / 100; });
          const shareTotal = Object.values(shares).reduce((sum, value) => sum + value, 0);
          if (Math.abs(shareTotal - amount) > .010001) return toast("Amounts must add up to the expense total to the nearest cent.", "error");
        }
      }
      const duplicate = state.expenses.some(item => item.id !== old?.id && item.groupId === groupId && item.title.trim().toLowerCase() === title.toLowerCase() && Number(item.amount) === amount && item.date === date && item.payer === payer);
      if (duplicate) return toast("This looks like a duplicate expense. Check the title, amount and date.", "error");
      const expenseData = { title, amount, date, groupId, payer, participants, method, shares, category: $("#expense-category").value, description: $("#expense-description").value.trim(), sample: false };
      if (old) Object.assign(old, expenseData);
      else state.expenses.push({ id: uid("expense"), ...expenseData });
      save(); closeModal(); renderApp(); toast(old ? "Expense updated and balances recalculated." : "Expense added and split with your group.");
    }
    if (event.target.id === "settlement-form") {
      event.preventDefault();
      const from = $("#settlement-from").value, to = $("#settlement-to").value;
      const amount = Math.round(Number($("#settlement-amount").value) * 100) / 100;
      const groupId = $("#settlement-group").value, date = $("#settlement-date").value;
      if (from === to) return toast("A person can't settle with themselves.", "error");
      if (!Number.isFinite(amount) || amount <= 0 || !groupById(groupId)) return toast("Enter a valid amount and group.", "error");
      if (!groupById(groupId).members.includes(from) || !groupById(groupId).members.includes(to)) return toast("Both people must belong to the selected group.", "error");
      state.settlements.push({ id: uid("settlement"), from, to, amount, groupId, status: "pending", date, sample: false });
      save(); closeModal(); currentPage = "settlements"; renderApp(); toast("Settlement recorded as pending.");
    }
    if (event.target.id === "profile-form") {
      event.preventDefault();
      const name = $("#profile-name").value.trim();
      if (!name) return toast("Your display name can't be empty.", "error");
      const oldName = state.settings.name;
      if (name !== oldName) {
        state.groups.forEach(group => { group.members = group.members.map(member => member === oldName ? name : member); });
        state.expenses.forEach(expense => {
          if (expense.payer === oldName) expense.payer = name;
          if (expense.participants.includes(oldName)) expense.participants = expense.participants.map(member => member === oldName ? name : member);
          if (expense.shares[oldName] !== undefined) { expense.shares[name] = expense.shares[oldName]; delete expense.shares[oldName]; }
        });
        state.settlements.forEach(item => { if (item.from === oldName) item.from = name; if (item.to === oldName) item.to = name; });
      }
      state.settings.name = name; save(); renderApp(); toast("Profile updated.");
    }
  });
  document.addEventListener("input", event => {
    if (event.target.matches("#expense-search, #filter-group, #filter-category, #filter-member, #filter-sort, #filter-from, #filter-to")) applyExpenseFilters();
  });
  document.addEventListener("change", event => {
    if (event.target.id === "expense-group") updateExpenseGroup();
    if (event.target.matches('input[name="participant"]')) renderSplitInputs(readShareInputs());
    if (event.target.id === "expense-split-method") renderSplitInputs(readShareInputs());
    if (event.target.id === "expense-amount" && $("#expense-split-method")?.value !== "equal") renderSplitInputs(readShareInputs());
    if (event.target.id === "dark-mode-toggle") { state.settings.darkMode = event.target.checked; save(); renderApp(); }
    if (event.target.id === "notifications-toggle") { state.settings.notifications = event.target.checked; save(); toast(`Notifications ${event.target.checked ? "enabled" : "disabled"}.`); }
    if (event.target.id === "trend-range") { trendRange = Number(event.target.value); $("#analytics-chart").innerHTML = renderBarChart(trendRange); }
  });
  $("#notifications-button").addEventListener("click", () => {
    state.notificationsSeen = true; save(); renderApp();
    const count = state.settlements.filter(item => item.status === "pending").length;
    toast(count ? `You have ${count} pending settlement${count === 1 ? "" : "s"} to review.` : "You're all caught up — no pending settlements.");
  });
  $("#mobile-menu").addEventListener("click", () => { $("#sidebar").classList.add("open"); $("#sidebar-scrim").classList.add("visible"); });
  $("#sidebar-scrim").addEventListener("click", () => { $("#sidebar").classList.remove("open"); $("#sidebar-scrim").classList.remove("visible"); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });
  renderApp();
})();
