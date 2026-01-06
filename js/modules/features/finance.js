import { state, saveData } from "../store.js";
import { uiAlert, uiPrompt, showDialog, uiConfirm } from "../ui.js";
import { formatCurrency } from "../utils.js";

let transferSource = '';

export const toggleIncomeModal = () => {
    document.getElementById('income-overlay').classList.toggle('open');
    document.getElementById('income-modal').classList.toggle('open');
};

// ... (Functions in between unchaged, skipping lines for efficiency if possible, but replace tool needs context blocks)
// Since replace_file_content works on chunks, I will target the top import and the specific lines where fmt is used.
// But wait, 'fmt' is used in updateFinanceUI. I should replace the definition first.

/* --- Logic --- */
// fmt function definition is removed.


export const toggleExpenseModal = () => {
    document.getElementById('expense-overlay').classList.toggle('open');
    document.getElementById('expense-modal').classList.toggle('open');
};

export const toggleTransferModal = () => {
    document.getElementById('transfer-overlay').classList.toggle('open');
    document.getElementById('transfer-modal').classList.toggle('open');
};

export const openTransferModal = (source) => {
    transferSource = source;
    const label = source === 'cash'
        ? "Desde <span style='color:var(--green); font-weight:700;'>EFECTIVO</span> hacia <span style='color:var(--cyan); font-weight:700;'>DÉBITO</span>"
        : "Desde <span style='color:var(--cyan); font-weight:700;'>DÉBITO</span> hacia <span style='color:var(--green); font-weight:700;'>EFECTIVO</span>";
    document.getElementById('trans-label').innerHTML = label;
    toggleTransferModal();
};

export const confirmTransfer = () => {
    const amount = parseFloat(document.getElementById('trans-amount').value);
    if (isNaN(amount) || amount <= 0) { uiAlert("Error", "Monto inválido."); return; }

    if (transferSource === 'cash' && state.financeData.cash < amount) { uiAlert("Fondos Insuficientes", "No tienes suficiente efectivo."); return; }
    if (transferSource === 'debit' && state.financeData.debit < amount) { uiAlert("Fondos Insuficientes", "No tienes suficiente en débito."); return; }

    if (transferSource === 'cash') {
        state.financeData.cash -= amount;
        state.financeData.debit += amount;
    } else {
        state.financeData.debit -= amount;
        state.financeData.cash += amount;
    }

    state.financeData.history.push({
        desc: `Transferencia (${transferSource === 'cash' ? 'fx' : 'db'})`,
        amount: amount,
        type: 'trans',
        acc: 'mix',
        date: new Date().toLocaleDateString('es-DO')
    });

    saveData();
    document.getElementById('trans-amount').value = "";
    toggleTransferModal();
};

export const toggleCreditPayModal = () => {
    const ov = document.getElementById('credit-pay-overlay');
    const mo = document.getElementById('credit-pay-modal');
    const isOpen = ov.classList.toggle('open');
    mo.classList.toggle('open');

    // Scroll fix
    const finWin = document.querySelector('#finance-modal .modal-window');
    if (finWin) finWin.style.overflow = isOpen ? 'hidden' : 'auto';
};

export const confirmCreditPay = (source) => {
    const desc = document.getElementById('cred-pay-desc').value.trim();
    const amount = parseFloat(document.getElementById('cred-pay-amount').value);

    if (!desc || isNaN(amount) || amount <= 0) { uiAlert("Error", "Datos inválidos."); return; }

    if (source === 'cash' && state.financeData.cash < amount) { uiAlert("Fondos Insuficientes", "Insuficiente efectivo."); return; }
    if (source === 'debit' && state.financeData.debit < amount) { uiAlert("Fondos Insuficientes", "Insuficiente débito."); return; }

    if (source === 'cash') state.financeData.cash -= amount;
    if (source === 'debit') state.financeData.debit -= amount;

    state.financeData.creditDebt -= amount;
    if (state.financeData.creditDebt < 0) state.financeData.creditDebt = 0;

    state.financeData.history.push({
        desc: `Pago Deuda: ${desc}`,
        amount: amount,
        type: 'exp',
        acc: source,
        date: new Date().toLocaleDateString('es-DO')
    });

    saveData();
    document.getElementById('cred-pay-desc').value = "";
    document.getElementById('cred-pay-amount').value = "";
    toggleCreditPayModal();
};

export const wipeFinanceData = () => {
    uiConfirm("¿Borrar TODO?", "Se eliminarán registros, saldos e historial.", () => {
        state.financeData = {
            cash: 0,
            debit: 0,
            creditLimit: 0,
            creditDebt: 0,
            history: [],
            pendingExpenses: []
        };
        saveData();
        uiAlert("Reinicio Completo", "Sistema financiero restablecido.");
    }, true);
};

/* --- Logic --- */

export const addPendingExpense = () => {
    const desc = document.getElementById('pend-desc').value.trim();
    const amount = parseFloat(document.getElementById('pend-amount').value);

    if (!desc || isNaN(amount) || amount <= 0) { uiAlert("Datos Incompletos", "Ingresa una descripción y un monto válido."); return; }

    state.financeData.pendingExpenses.push({
        desc, amount,
        date: new Date().toLocaleDateString('es-DO')
    });

    saveData();
    document.getElementById('pend-desc').value = "";
    document.getElementById('pend-amount').value = "";
};

export const payExpense = (index, source) => {
    const itemRef = state.financeData.pendingExpenses[index];
    const inputAmount = parseFloat(document.getElementById(`pay-amount-${index}`).value);

    if (isNaN(inputAmount) || inputAmount <= 0) { uiAlert("Error", "Monto inválido."); return; }
    if (inputAmount > itemRef.amount + 0.1) { uiAlert("Error", "No puedes pagar más de lo que debes."); return; }

    // Check Balance
    if (source === 'cash' && state.financeData.cash < inputAmount) { uiAlert("Fondos Insuficientes", "No tienes suficiente efectivo para pagar esta deuda."); return; }
    if (source === 'debit' && state.financeData.debit < inputAmount) { uiAlert("Fondos Insuficientes", "No tienes suficiente saldo en débito para pagar esta deuda."); return; }

    // Deduct
    if (source === 'cash') state.financeData.cash -= inputAmount;
    if (source === 'debit') state.financeData.debit -= inputAmount;
    if (source === 'credit') state.financeData.creditDebt += inputAmount;

    // Log
    const isPartial = inputAmount < (itemRef.amount - 0.1);
    state.financeData.history.push({
        desc: `${itemRef.desc} ${isPartial ? '(Parcial)' : ''}`,
        amount: inputAmount,
        type: 'exp',
        acc: source,
        date: new Date().toLocaleDateString('es-DO')
    });

    // Update Item
    itemRef.amount -= inputAmount;

    // Remove if paid
    if (itemRef.amount <= 0.1) {
        state.financeData.pendingExpenses.splice(index, 1);
    }

    saveData();
};

export const confirmIncome = (source) => {
    const amount = parseFloat(document.getElementById('inc-amount').value);
    const descInput = document.getElementById('inc-desc').value.trim();
    const desc = descInput || "Ingreso / Abono";

    if (isNaN(amount) || amount <= 0) { uiAlert("Error", "Monto inválido."); return; }

    if (source === 'cash') state.financeData.cash += amount;
    if (source === 'debit') state.financeData.debit += amount;
    if (source === 'credit') {
        state.financeData.creditDebt -= amount;
        if (state.financeData.creditDebt < 0) state.financeData.creditDebt = 0;
    }

    state.financeData.history.push({
        desc: desc,
        amount: amount,
        type: 'inc',
        acc: source,
        date: new Date().toLocaleDateString('es-DO')
    });

    saveData();
    document.getElementById('inc-amount').value = "";
    document.getElementById('inc-desc').value = "";
    toggleIncomeModal();
};

export const confirmDirectExpense = (source) => {
    const desc = document.getElementById('exp-desc').value.trim();
    const amount = parseFloat(document.getElementById('exp-amount').value);

    if (!desc || isNaN(amount) || amount <= 0) { uiAlert("Error", "Datos inválidos."); return; }

    if (source === 'cash') state.financeData.cash -= amount;
    if (source === 'debit') state.financeData.debit -= amount;
    if (source === 'credit') state.financeData.creditDebt += amount;

    state.financeData.history.push({
        desc: desc,
        amount: amount,
        type: 'exp',
        acc: source,
        date: new Date().toLocaleDateString('es-DO')
    });

    saveData();
    document.getElementById('exp-desc').value = "";
    document.getElementById('exp-amount').value = "";
    toggleExpenseModal();
};

/* --- Render --- */

export const updateFinanceUI = () => {
    // Balances
    const setVal = (id, val) => { document.getElementById(id).innerText = formatCurrency(val); };
    setVal('val-cash', state.financeData.cash);
    setVal('val-debit', state.financeData.debit);
    setVal('val-total', state.financeData.cash + state.financeData.debit);

    const creditAvail = state.financeData.creditLimit - state.financeData.creditDebt;
    setVal('val-credit-avail', creditAvail);
    setVal('val-credit-debt', state.financeData.creditDebt);

    // Pending List
    const pendingList = document.getElementById('pending-list');
    pendingList.innerHTML = "";
    let totalPending = 0;

    state.financeData.pendingExpenses.forEach((item, idx) => {
        totalPending += parseFloat(item.amount);
        const li = document.createElement('li');
        li.className = 'pending-item';
        li.id = `pending-item-${idx}`;
        const carryTag = item.carried ? '<span class="carry-dot" title="Mes Anterior"></span>' : '';

        // Clean HTML: removed onclicks, added data-trigger-pay
        li.innerHTML = `
            <div class="pending-content-wrapper" data-action="toggle-opt" data-index="${idx}">
                <div class="pending-info">
                    <span class="pending-desc">${item.desc} ${carryTag}</span>
                    <span class="pending-date">${item.date}</span>
                </div>
                <div class="pending-cost">RD$ ${formatCurrency(item.amount)}</div>
            </div>
            <div class="pay-options">
                <div class="pay-options-title">MONTO A PAGAR:</div>
                <input type="number" id="pay-amount-${idx}" class="glass-input" value="${item.amount}" style="margin-bottom:10px; padding:10px; font-size:0.9rem; text-align:center;">
                <div class="pay-options-title">MÉTODO DE PAGO:</div>
                <div class="pay-buttons-row">
                    <button class="btn-pay-opt opt-cash" data-action="pay" data-source="cash" data-index="${idx}">💵 Efectivo</button>
                    <button class="btn-pay-opt opt-debit" data-action="pay" data-source="debit" data-index="${idx}">💳 Débito</button>
                    <button class="btn-pay-opt opt-credit" data-action="pay" data-source="credit" data-index="${idx}">🏦 Crédito</button>
                </div>
            </div>
        `;
        pendingList.appendChild(li);
    });

    if (document.getElementById('val-pending-total'))
        setVal('val-pending-total', totalPending);

    // History
    const historyList = document.getElementById('history-list');
    if (historyList) {
        historyList.innerHTML = "";
        if (state.financeData.history.length === 0) {
            historyList.innerHTML = '<div style="text-align:center; color:#64748b; padding:10px;">Sin movimientos recientes</div>';
        } else {
            const accNames = { cash: "Efectivo", debit: "Débito", credit: "Crédito" };
            [...state.financeData.history].reverse().slice(0, 10).forEach(item => {
                const div = document.createElement('div');
                div.className = 'history-item';
                const color = item.type === 'inc' ? 'var(--green)' : '#cbd5e1';
                const sign = item.type === 'inc' ? '+' : '-';
                let labelHtml = '';
                if (item.type !== 'trans') {
                    const accLabel = accNames[item.acc] || item.acc;
                    labelHtml = `<span style="opacity:0.6; font-size:0.75rem;">(${accLabel})</span>`;
                }
                div.innerHTML = `
                    <span>${item.desc} ${labelHtml}</span>
                    <span style="color:${color}; font-family:'JetBrains Mono';">${sign}${formatCurrency(item.amount)}</span>
                `;
                historyList.appendChild(div);
            });
        }
    }
};

export const resetMonth = () => {
    uiConfirm("¿Cerrar Mes Actual?", "Esta acción:\n• Borrará el historial reciente.\n• Mantendrá tus saldos.\n• Marcará deudas pendientes como antiguas.", () => {
        state.financeData.history = [];
        state.financeData.pendingExpenses.forEach(item => { item.carried = true; });
        saveData();
    });
};

export const editCreditLimit = () => {
    const current = state.financeData.creditLimit || 0;
    uiPrompt("Límite de Crédito", "Ingresa el nuevo límite total:", current, (input) => {
        if (input === null || input === "") return;
        const newVal = parseFloat(input);
        if (isNaN(newVal) || newVal < 0) { uiAlert("Error", "Monto inválido."); return; }
        state.financeData.creditLimit = newVal;
        saveData();
        uiAlert("Actualizado", "Límite de crédito modificado.");
    });
};

export const togglePayOptions = (index) => {
    const item = document.getElementById(`pending-item-${index}`);
    if (item) item.classList.toggle('active');
};

export const initFinanceListeners = () => {
    const click = (sel, fn) => { const el = document.querySelector(sel); if (el) el.addEventListener('click', fn); }

    // Floating/Main Actions
    click('.btn-income', toggleIncomeModal);
    click('.btn-expense', toggleExpenseModal);
    click('.btn-add-pending', addPendingExpense);

    // Mini Modals Confirmations
    // Income
    const incomeModal = document.getElementById('income-modal');
    if (incomeModal) {
        incomeModal.addEventListener('click', (e) => {
            if (e.target.dataset.source) confirmIncome(e.target.dataset.source); // Requires adding data-source to buttons in HTML or here?
            // Actually, confirmIncome expects ('cash'). buttons have onclick="confirmIncome('cash')" currently.
            // We will refactor HTML to remove onclick, so we need to identify source.

            // Let's use delegation if buttons have class
            if (e.target.classList.contains('opt-cash')) confirmIncome('cash');
            if (e.target.classList.contains('opt-debit')) confirmIncome('debit');
            if (e.target.classList.contains('opt-credit')) confirmIncome('credit');
        });
    }

    // Direct Expense
    const expenseModal = document.getElementById('expense-modal');
    if (expenseModal) {
        expenseModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('opt-cash')) confirmDirectExpense('cash');
            if (e.target.classList.contains('opt-debit')) confirmDirectExpense('debit');
            if (e.target.classList.contains('opt-credit')) confirmDirectExpense('credit');
        });
    }

    // Credit Pay
    const credPayModal = document.getElementById('credit-pay-modal');
    if (credPayModal) {
        credPayModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('opt-cash')) confirmCreditPay('cash');
            if (e.target.classList.contains('opt-debit')) confirmCreditPay('debit');
        });
    }

    // Transfer
    const transferModal = document.getElementById('transfer-modal');
    // For openTransferModal via UI cards, we use delegation or ID
    const cards = document.querySelectorAll('.fin-card'); // We need specific ones
    // We'll trust data-onclick removal plan which puts ID/Class listeners.

    // Wire up Confirm Buttons
    click('#income-modal .btn-reset', toggleIncomeModal);
    click('#expense-modal .btn-reset', toggleExpenseModal);
    click('#transfer-modal .btn-reset', toggleTransferModal);
    click('#transfer-modal .btn-start', confirmTransfer);
    click('#credit-pay-modal .btn-reset', toggleCreditPayModal); // Cancel

    // Pending List Delegation
    const pList = document.getElementById('pending-list');
    if (pList) {
        pList.addEventListener('click', (e) => {
            const toggle = e.target.closest('[data-action="toggle-opt"]');
            if (toggle) togglePayOptions(toggle.dataset.index);

            const pay = e.target.closest('[data-action="pay"]');
            if (pay) {
                payExpense(pay.dataset.index, pay.dataset.source);
            }
        });
    }

    // Cards Triggers (Manual assignment since they are specific div blocks)
    click('#card-cash', () => openTransferModal('cash'));
    click('#card-debit', () => openTransferModal('debit'));
    click('#card-credit-avail', editCreditLimit);
    click('#card-credit-debt', toggleCreditPayModal);

    // Global Reset
    click('#btn-reset-month', resetMonth);
    click('#btn-wipe-finance', wipeFinanceData);
};
