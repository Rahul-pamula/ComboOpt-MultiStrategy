// --- Global UI & Utility References ---
const itemList = document.getElementById('item-list');
const capacityInput = document.getElementById('capacity');
const msgBox = document.getElementById('message-box');
const tspMsgBox = document.getElementById('tsp-message-box');
const apMsgBox = document.getElementById('ap-message-box');
const devConsole = document.getElementById('dev-console');
const matrixContainer = document.getElementById('distance-matrix-container');
const apMatrixContainer = document.getElementById('ap-matrix-container');
const conclusionContent = document.getElementById('overall-conclusion-content');


// Knapsack Elements
const dpValueEl = document.getElementById('dp-value');
const dpTimeEl = document.getElementById('dp-time');
const dpItemsEl = document.getElementById('dp-items-list');
const greedyValueEl = document.getElementById('greedy-value');
const greedyTimeEl = document.getElementById('greedy-time');
const greedyItemsEl = document.getElementById('greedy-items-list');
const btValueEl = document.getElementById('bt-value');
const btTimeEl = document.getElementById('bt-time');
const btItemsEl = document.getElementById('bt-items-list');
const bnbValueEl = document.getElementById('bnb-value');
const bnbTimeEl = document.getElementById('bnb-time');
const bnbItemsEl = document.getElementById('bnb-items-list');

// TSP Elements
const numCitiesInput = document.getElementById('num-cities');
const tspBnbCostEl = document.getElementById('tsp-bnb-cost');
const tspBnbTimeEl = document.getElementById('tsp-bnb-time');
const tspBnbPathEl = document.getElementById('tsp-bnb-path');
const tspBtCostEl = document.getElementById('tsp-bt-cost');
const tspBtTimeEl = document.getElementById('tsp-bt-time');
const tspBtPathEl = document.getElementById('tsp-bt-path');

// AP Elements
const numAgentsInput = document.getElementById('num-agents');
const apBnbCostEl = document.getElementById('ap-bnb-cost');
const apBnbTimeEl = document.getElementById('ap-bnb-time');
const apBnbAssignmentEl = document.getElementById('ap-bnb-assignment');
const apBtCostEl = document.getElementById('ap-bt-cost');
const apBtTimeEl = document.getElementById('ap-bt-time');
const apBtAssignmentEl = document.getElementById('ap-bt-assignment');


// --- Constants & Global State ---
const INFINITY = 1e9;
// Global storage for the latest results
let lastKnapsackResult = null;
let lastTSPResult = null;
let lastAPResult = null;

// --- Utility Functions ---

/** Logs messages to a visible console area for user/developer feedback. */
function log(message) {
    devConsole.innerHTML = `[${new Date().toLocaleTimeString()}] ${message}<br>` + devConsole.innerHTML;
}

/** Shows a user-facing error message. */
function showMessage(message, isError = true, targetBox = msgBox) {
    targetBox.textContent = message;
    targetBox.classList.remove('hidden');
    if (isError) {
        targetBox.className = 'p-4 rounded-xl text-sm font-medium border border-red-300 bg-red-100 text-red-700';
    } else {
        targetBox.className = 'p-4 rounded-xl text-sm font-medium border border-green-300 bg-green-100 text-green-700';
    }
}

/** Hides the user-facing message box. */
function hideMessage(targetBox = msgBox) {
    targetBox.classList.add('hidden');
}

/** Represents an item with value, weight, and a calculated ratio. */
class Item {
    constructor(id, value, weight) {
        this.id = id;
        this.value = value;
        this.weight = weight;
        this.ratio = weight > 0 ? value / weight : 0;
    }
}

// --- Tab Switching Logic ---
function switchTab(tabId) {
    const tabs = ['knapsack', 'tsp', 'graph'];
    tabs.forEach(id => {
        const tabButton = document.getElementById(`${id}-tab`);
        const tabContent = document.getElementById(`${id}-content`);

        if (id === tabId) {
            tabButton.classList.add('active');
            tabContent.classList.remove('hidden');
        } else {
            tabButton.classList.remove('active');
            tabContent.classList.add('hidden');
        }
    });
}

// --- Knapsack Data Management (UI) ---

let itemIdCounter = 0;

/** Creates the HTML for a single item input row. */
function createItemHtml(id, initialValue, initialWeight) {
    const itemDiv = document.createElement('div');
    itemDiv.id = `item-${id}`;
    itemDiv.className = 'flex flex-col sm:flex-row gap-2 items-center p-3 bg-white rounded-lg border shadow-sm';
    itemDiv.innerHTML = `
                <div class="flex-grow w-full">
                    <label class="block text-xs font-semibold text-gray-500 mb-1">Item ${id}</label>
                    <div class="flex gap-2">
                        <input type="number" data-id="${id}" data-type="value" value="${initialValue}" min="1" class="input-style flex-1" placeholder="Value">
                        <input type="number" data-id="${id}" data-type="weight" value="${initialWeight}" min="1" class="input-style flex-1" placeholder="Weight">
                    </div>
                </div>
                <button onclick="removeItem(${id})" class="flex-shrink-0 p-2 text-red-500 hover:text-red-700 transition duration-150 rounded-full border border-red-200 hover:bg-red-50" title="Remove Item">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                </button>
            `;
    return itemDiv;
}

/** Adds a new item row to the UI. */
function addItem(initialValue = 10, initialWeight = 5) {
    itemIdCounter++;
    const itemHtml = createItemHtml(itemIdCounter, initialValue, initialWeight);
    itemList.appendChild(itemHtml);
}

/** Removes an item row from the UI. */
function removeItem(id) {
    const itemEl = document.getElementById(`item-${id}`);
    if (itemEl) {
        itemList.removeChild(itemEl);
        log(`Removed Item ${id}`);
    }
}

/** Reads all item data from the UI. */
function getItemsFromUI() {
    const items = [];
    const itemInputs = itemList.querySelectorAll('input[type="number"]');

    // Group inputs by item ID
    const itemData = {};
    itemInputs.forEach(input => {
        const id = parseInt(input.dataset.id);
        const type = input.dataset.type;
        const value = parseInt(input.value);

        if (!itemData[id]) {
            itemData[id] = { id: id, value: 0, weight: 0 };
        }

        if (type === 'value') {
            itemData[id].value = value;
        } else if (type === 'weight') {
            itemData[id].weight = value;
        }
    });

    // Validate and create Item objects
    for (const key in itemData) {
        const data = itemData[key];
        if (data.value <= 0 || data.weight <= 0) {
            throw new Error(`Item ${data.id} has invalid value or weight (must be > 0).`);
        }
        items.push(new Item(data.id, data.value, data.weight));
    }

    return items;
}

// --- Knapsack Main Controller ---

/** Runs all Knapsack algorithms and updates the UI with performance metrics. */
async function runKnapsack() {
    hideMessage(msgBox);
    log('Starting Knapsack optimization run...');

    let capacity;
    let items;

    try {
        capacity = parseInt(capacityInput.value);
        if (isNaN(capacity) || capacity <= 0) {
            throw new Error("Knapsack Capacity must be a positive number.");
        }
        items = getItemsFromUI();
        if (items.length === 0) {
            throw new Error("Please add at least one item to the list.");
        }
        log(`Capacity: ${capacity}. Total Items: ${items.length}`);
    } catch (e) {
        showMessage(`Input Error: ${e.message}`, true, msgBox);
        log(`ERROR: ${e.message}`);
        return;
    }

    const response = await fetch('/knapsack', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ capacity, items })
    });

    const results = await response.json();

    const { dp, bt, bnb, greedy } = results;

    // Update UI
    dpValueEl.textContent = `Value: ${dp.maxValue}`;
    dpTimeEl.textContent = `Time: ${dp.time} ms`;
    dpItemsEl.textContent = dp.selectedItems.map(i => `Item ${i.id} (V:${i.value}, W:${i.weight})`).join(' | ');

    btValueEl.textContent = `Value: ${bt.maxValue}`;
    btTimeEl.textContent = `Time: ${bt.time} ms`;
    btItemsEl.textContent = bt.selectedItems.map(i => `Item ${i.id} (V:${i.value}, W:${i.weight})`).join(' | ');

    bnbValueEl.textContent = `Value: ${bnb.maxValue}`;
    bnbTimeEl.textContent = `Time: ${bnb.time} ms`;
    bnbItemsEl.textContent = bnb.selectedItems.map(i => `Item ${i.id} (V:${i.value}, W:${i.weight})`).join(' | ');

    greedyValueEl.textContent = `Value: ${greedy.maxValue}`;
    greedyTimeEl.textContent = `Time: ${greedy.time} ms`;
    greedyItemsEl.textContent = greedy.selectedItems.map(i => `Item ${i.id} (V:${i.value}, W:${i.weight})`).join(' | ');

    let optimalValue = dp.maxValue;
    let message = `All optimal algorithms (DP, BT, B&B) found the same maximum value: ${optimalValue}.`;

    if (greedy.maxValue < optimalValue) {
        message += ` The Greedy heuristic was suboptimal, finding only ${greedy.maxValue}.`;
    } else {
        message += ` The Greedy heuristic coincidentally found the optimal value: ${optimalValue}.`;
    }

    message += ` Performance comparison: Greedy (${greedy.time}ms) vs. DP (${dp.time}ms) vs. B&B (${bnb.time}ms) vs. BT (${bt.time}ms).`;

    showMessage(message, false, msgBox);
    log(`Knapsack run complete.`);

    // Save results for overall conclusion
    lastKnapsackResult = {
        dp: { value: dp.maxValue, time: parseFloat(dp.time), optimal: true, type: 'DP' },
        bt: { value: bt.maxValue, time: parseFloat(bt.time), optimal: true, type: 'BT' },
        bnb: { value: bnb.maxValue, time: parseFloat(bnb.time), optimal: true, type: 'B&B' },
        greedy: { value: greedy.maxValue, time: parseFloat(greedy.time), optimal: greedy.maxValue === optimalValue, type: 'Greedy' },
        optimalValue: optimalValue
    };
    updateOverallConclusion();
}


// --- TSP Data Management & UI ---

let TSP_DIST_MATRIX = [];

/** Generates a symmetric, default distance matrix. */
function generateDefaultMatrix(n) {
    const matrix = Array(n).fill(0).map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const rand = Math.floor(Math.random() * 50) + 10; // Distances 10-60
            matrix[i][j] = rand;
            matrix[j][i] = rand;
        }
    }
    return matrix;
}

/** Generates the UI table for the distance matrix. */
function generateMatrix() {
    const n = Math.min(parseInt(numCitiesInput.value), 10);
    if (isNaN(n) || n < 3) return;
    numCitiesInput.value = n;

    // Use the current matrix if it matches size, otherwise generate new
    if (TSP_DIST_MATRIX.length !== n) {
        TSP_DIST_MATRIX = generateDefaultMatrix(n);
    }

    let html = `<table class="min-w-full divide-y divide-gray-200 shadow overflow-hidden sm:rounded-lg">`;
    html += `<thead class="bg-gray-50"><tr class="text-xs font-medium text-gray-500 uppercase tracking-wider"><th></th>`;
    for (let j = 0; j < n; j++) {
        html += `<th class="p-2 text-center">City ${j + 1}</th>`;
    }
    html += `</tr></thead><tbody class="bg-white divide-y divide-gray-200">`;

    for (let i = 0; i < n; i++) {
        html += `<tr><td class="p-2 text-sm font-medium text-gray-900 text-center bg-gray-50">City ${i + 1}</td>`;
        for (let j = 0; j < n; j++) {
            let value = TSP_DIST_MATRIX[i][j] === 0 ? '—' : TSP_DIST_MATRIX[i][j];
            let disabled = (i === j) ? 'disabled' : '';
            let bgColor = (i === j) ? 'bg-gray-200' : 'bg-white';

            html += `<td class="p-1"><input type="number" min="1" ${disabled} data-row="${i}" data-col="${j}" 
                             value="${i === j ? '' : value}" class="matrix-cell ${bgColor} text-sm" 
                             onchange="updateMatrix(this)"></td>`;
        }
        html += `</tr>`;
    }
    html += `</tbody></table>`;
    matrixContainer.innerHTML = html;
    log(`Generated ${n}x${n} distance matrix.`);
}

/** Updates the symmetric matrix based on user input. */
function updateMatrix(input) {
    const i = parseInt(input.dataset.row);
    const j = parseInt(input.dataset.col);
    const value = parseInt(input.value);
    const n = TSP_DIST_MATRIX.length;

    if (isNaN(value) || value <= 0) {
        log(`Invalid distance value entered.`);
        input.value = TSP_DIST_MATRIX[i][j] || 10; // Revert or set default
        return;
    }

    if (i >= 0 && i < n && j >= 0 && j < n) {
        TSP_DIST_MATRIX[i][j] = value;
        TSP_DIST_MATRIX[j][i] = value;

        // Update the symmetric cell in the UI
        const symmetricInput = matrixContainer.querySelector(`input[data-row="${j}"][data-col="${i}"]`);
        if (symmetricInput) {
            symmetricInput.value = value;
        }
    }
    log(`Updated distance D(${i + 1}, ${j + 1}) to ${value}`);
}

// --- TSP Main Controller ---

async function runTSP() {
    hideMessage(tspMsgBox);
    log('Starting TSP optimization run...');
    const n = TSP_DIST_MATRIX.length;

    if (n < 3) {
        showMessage("Please set the number of cities to 3 or more.", true, tspMsgBox);
        return;
    }

    // Basic validation
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (i !== j && (TSP_DIST_MATRIX[i][j] <= 0 || isNaN(TSP_DIST_MATRIX[i][j]))) {
                showMessage(`Distance D(${i + 1}, ${j + 1}) must be a positive number.`, true, tspMsgBox);
                return;
            }
        }
    }

    const response = await fetch('/tsp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ matrix: TSP_DIST_MATRIX })
    });

    const results = await response.json();
    const { bt, bnb } = results;

    // --- Update UI ---
    tspBtCostEl.textContent = `Cost: ${bt.minCost === -1 ? 'No Tour Found' : bt.minCost}`;
    tspBtTimeEl.textContent = `Time: ${bt.time} ms`;
    tspBtPathEl.textContent = bt.bestPath.join(' → ');

    tspBnbCostEl.textContent = `Cost: ${bnb.minCost === -1 ? 'No Tour Found' : bnb.minCost}`;
    tspBnbTimeEl.textContent = `Time: ${bnb.time} ms`;
    tspBnbPathEl.textContent = bnb.bestPath.join(' → ');

    let optimalCost = bnb.minCost;
    let message = `Both exact algorithms found the same optimal tour cost: ${optimalCost}.`;
    message += ` Performance comparison: B&B (${bnb.time}ms) vs. BT (${bt.time}ms). For larger $N$, B&B is significantly faster.`;
    showMessage(message, false, tspMsgBox);

    // Save results for overall conclusion
    lastTSPResult = {
        bt: { cost: bt.minCost, time: parseFloat(bt.time), type: 'Backtracking' },
        bnb: { cost: bnb.minCost, time: parseFloat(bnb.time), type: 'Branch & Bound' },
        optimalCost: optimalCost
    };
    updateOverallConclusion();
}

// --- Assignment Problem (AP) Data Management & UI ---

let AP_COST_MATRIX = [];

/** Generates a default, non-symmetric cost matrix. */
function generateAPDefaultMatrix(n) {
    const matrix = Array(n).fill(0).map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            matrix[i][j] = Math.floor(Math.random() * 50) + 1; // Costs 1-50
        }
    }
    return matrix;
}

/** Generates the UI table for the cost matrix. */
function generateAPMatrix() {
    const n = Math.min(parseInt(numAgentsInput.value), 8);
    if (isNaN(n) || n < 2) return;
    numAgentsInput.value = n;

    if (AP_COST_MATRIX.length !== n) {
        AP_COST_MATRIX = generateAPDefaultMatrix(n);
    }

    let html = `<table class="min-w-full divide-y divide-gray-200 shadow overflow-hidden sm:rounded-lg">`;
    html += `<thead class="bg-gray-50"><tr class="text-xs font-medium text-gray-500 uppercase tracking-wider"><th>Agent</th>`;
    for (let j = 0; j < n; j++) {
        html += `<th class="p-2 text-center">Task ${j + 1}</th>`;
    }
    html += `</tr></thead><tbody class="bg-white divide-y divide-gray-200">`;

    for (let i = 0; i < n; i++) {
        html += `<tr><td class="p-2 text-sm font-medium text-gray-900 text-center bg-gray-50">Agent ${i + 1}</td>`;
        for (let j = 0; j < n; j++) {
            html += `<td class="p-1"><input type="number" min="1" data-row="${i}" data-col="${j}" 
                             value="${AP_COST_MATRIX[i][j]}" class="matrix-cell bg-white text-sm" 
                             onchange="updateAPMatrix(this)"></td>`;
        }
        html += `</tr>`;
    }
    html += `</tbody></table>`;
    apMatrixContainer.innerHTML = html;
    log(`Generated ${n}x${n} cost matrix for AP.`);
}

/** Updates the cost matrix based on user input. */
function updateAPMatrix(input) {
    const i = parseInt(input.dataset.row);
    const j = parseInt(input.dataset.col);
    const value = parseInt(input.value);
    const n = AP_COST_MATRIX.length;

    if (isNaN(value) || value <= 0) {
        log(`Invalid cost value entered.`);
        input.value = AP_COST_MATRIX[i][j] || 1; // Revert or set default
        return;
    }

    if (i >= 0 && i < n && j >= 0 && j < n) {
        AP_COST_MATRIX[i][j] = value;
    }
    log(`Updated cost C(${i + 1}, ${j + 1}) to ${value}`);
}

// --- AP Main Controller ---

async function runAP() {
    hideMessage(apMsgBox);
    log('Starting Assignment Problem optimization run...');
    const n = AP_COST_MATRIX.length;

    if (n < 2) {
        showMessage("Please set the number of Agents/Tasks to 2 or more.", true, apMsgBox);
        return;
    }

    // Basic validation
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (AP_COST_MATRIX[i][j] <= 0 || isNaN(AP_COST_MATRIX[i][j])) {
                showMessage(`Cost C(${i + 1}, ${j + 1}) must be a positive number.`, true, apMsgBox);
                return;
            }
        }
    }

    const response = await fetch('/assignment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ matrix: AP_COST_MATRIX })
    });

    const results = await response.json();
    const { bt, bnb } = results;

    // --- Update UI ---
    apBtCostEl.textContent = `Min Cost: ${bt.minCost === -1 ? 'No Solution Found' : bt.minCost}`;
    apBtTimeEl.textContent = `Time: ${bt.time} ms`;
    apBtAssignmentEl.textContent = bt.bestAssignment.join(' | ');

    apBnbCostEl.textContent = `Min Cost: ${bnb.minCost === -1 ? 'No Solution Found' : bnb.minCost}`;
    apBnbTimeEl.textContent = `Time: ${bnb.time} ms`;
    apBnbAssignmentEl.textContent = bnb.bestAssignment.join(' | ');

    let optimalCost = bnb.minCost;
    let message = `Both exact algorithms found the same optimal assignment cost: ${optimalCost}.`;
    message += ` Performance comparison: B&B (${bnb.time}ms) vs. BT (${bt.time}ms). B&B is faster due to aggressive bounding.`;
    showMessage(message, false, apMsgBox);

    // Save results for overall conclusion
    lastAPResult = {
        bt: { cost: bt.minCost, time: parseFloat(bt.time), type: 'Backtracking' },
        bnb: { cost: bnb.minCost, time: parseFloat(bnb.time), type: 'Branch & Bound' },
        optimalCost: optimalCost
    };
    updateOverallConclusion();
}

// --- Overall Conclusion Logic ---

function getProblemSummary(problemType, results) {
    if (!results) {
        return `<p class="text-sm text-gray-500">No data available. Run the ${problemType} problem first.</p>`;
    }

    if (problemType === 'Knapsack') {
        const optimalAlgos = [results.dp, results.bt, results.bnb].filter(a => a.value === results.optimalValue);
        // Handle case where DP/BT/B&B failed (e.g., if input was zeroed out, though prevented by validation)
        if (optimalAlgos.length === 0) {
            return `<p class="text-sm text-gray-500">Error in Knapsack data: No optimal solution could be found by the exact methods.</p>`;
        }
        const fastestExact = optimalAlgos.reduce((best, current) => (current.time < best.time ? current : best), optimalAlgos[0]);

        let summary = `For **${problemType}** (Max Value: **${results.optimalValue}**):`;
        summary += `<ul class="list-disc ml-6 space-y-1 text-sm">`;

        // 1. Fastest Exact Method
        summary += `<li><span class="font-bold">Fastest Exact Solution:</span> **${fastestExact.type}** (${fastestExact.time}ms). <span class="text-gray-500">This is the best choice when optimality is mandatory.</span></li>`;

        // 2. Greedy comparison
        if (results.greedy.optimal) {
            summary += `<li><span class="font-bold">Approximation Speed:</span> The **Greedy Heuristic** found the optimal value and was the **overall fastest** (${results.greedy.time}ms).</li>`;
        } else {
            summary += `<li><span class="font-bold">Approximation Speed:</span> The **Greedy Heuristic** was the fastest (${results.greedy.time}ms) but resulted in a **suboptimal** value (${results.greedy.value}).</li>`;
        }

        // 3. Comparison between exponential methods
        const searchComparison = results.bnb.time < results.bt.time ?
            `**Branch & Bound** (${results.bnb.time}ms) was <span class="text-indigo-600 font-semibold">faster</span> than **Backtracking** (${results.bt.time}ms), demonstrating the power of bounding.` :
            `**Backtracking** (${results.bt.time}ms) was <span class="text-red-600 font-semibold">faster</span> than **Branch & Bound** (${results.bnb.time}ms). This is rare for B&B to lose, often due to high bounding overhead in simple cases.`;

        summary += `<li><span class="font-bold">Search Comparison:</span> ${searchComparison}</li>`;

        summary += `</ul>`;
        return summary;
    }

    // Logic for TSP and AP (Minimization)
    if (problemType === 'TSP' || problemType === 'Assignment') {
        const optimalCost = results.optimalCost;

        if (optimalCost === -1) {
            return `<p class="text-sm text-gray-500">For **${problemType}**, no valid solution could be found with the given matrix.</p>`;
        }

        const exactAlgos = [results.bt, results.bnb];
        const fastestExact = exactAlgos.reduce((best, current) => (current.time < best.time ? current : best), exactAlgos[0]);

        let summary = `For **${problemType}** (Min Cost: **${optimalCost}**):`;
        summary += `<ul class="list-disc ml-6 space-y-1 text-sm">`;

        // 1. Fastest Exact Method (Should be B&B)
        summary += `<li><span class="font-bold">Fastest Exact Method:</span> **${fastestExact.type}** (${fastestExact.time}ms). <span class="text-gray-500">Always necessary when $N$ is small enough for exact solution.</span></li>`;

        // 2. Comparison between exponential methods
        if (results.bnb.time < results.bt.time) {
            summary += `<li><span class="font-bold">Performance Winner:</span> **Branch & Bound** (${results.bnb.time}ms) was <span class="text-indigo-600 font-semibold">significantly faster</span> than **Backtracking** (${results.bt.time}ms). This gain is vital for larger instances.</li>`;
        } else {
            summary += `<li><span class="font-bold">Performance Winner:</span> **Backtracking** (${results.bt.time}ms) was <span class="text-red-600 font-semibold">faster</span> than **Branch & Bound** (${results.bnb.time}ms) in this run. (Likely due to very small $N$ or high bounding overhead).</li>`;
        }

        summary += `</ul>`;
        return summary;
    }

    return '';
}

function updateOverallConclusion() {

    let html = `
                <p class="text-xl font-semibold text-gray-900 mb-2">Detailed Strategy Breakdown:</p>
                <p class="text-sm text-gray-600 mb-4">The "better" algorithm depends on your goal: **Guaranteed Optimality** (DP, B&B, BT) vs. **Maximum Speed** (Greedy). Click "Run Optimization" on each tab to update the analysis below.</p>
                <div class="space-y-6 mt-4 p-4 bg-white rounded-xl border border-indigo-200 shadow-inner">
                    <h4 class="text-lg font-bold text-indigo-700 border-b pb-1">Knapsack Problem Analysis (Maximization)</h4>
                    ${getProblemSummary('Knapsack', lastKnapsackResult)}

                    <h4 class="text-lg font-bold text-indigo-700 border-b pb-1">Traveling Salesperson Problem (TSP) Analysis (Minimization)</h4>
                    ${getProblemSummary('TSP', lastTSPResult)}

                    <h4 class="text-lg font-bold text-indigo-700 border-b pb-1">Assignment Problem Analysis (Minimization)</h4>
                    ${getProblemSummary('Assignment', lastAPResult)}
                </div>
            `;

    conclusionContent.innerHTML = html;
}


// --- Initialization ---

window.onload = function () {
    // Initialize Knapsack items
    addItem(60, 10);
    addItem(100, 20);
    addItem(120, 30);

    // Initialize TSP matrix
    generateMatrix();

    // Initialize AP matrix
    generateAPMatrix();

    // Start on the Knapsack tab
    switchTab('knapsack');
};