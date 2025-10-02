const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());

// Serve static files from the frontend's public directory
app.use('/public', express.static(path.join(__dirname, '../frontend/public')));

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

class Item {
    constructor(id, value, weight) {
        this.id = id;
        this.value = value;
        this.weight = weight;
        this.ratio = weight > 0 ? value / weight : 0;
    }
}

function dpKnapsack(capacity, items) {
    const n = items.length;
    const dp = Array(n + 1).fill(0).map(() => Array(capacity + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        const item = items[i - 1];
        for (let w = 1; w <= capacity; w++) {
            if (item.weight <= w) {
                const include = item.value + dp[i - 1][w - item.weight];
                const exclude = dp[i - 1][w];
                dp[i][w] = Math.max(include, exclude);
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }
    const selectedItems = [];
    let w = capacity;
    for (let i = n; i > 0 && w > 0; i--) {
        if (dp[i][w] !== dp[i - 1][w]) {
            const item = items[i - 1];
            selectedItems.push(item);
            w -= item.weight;
        }
    }
    return {
        maxValue: dp[n][capacity],
        selectedItems: selectedItems.reverse()
    };
}

function greedyKnapsack(capacity, items) {
    const sortedItems = [...items].sort((a, b) => b.ratio - a.ratio);
    let currentValue = 0;
    let currentWeight = 0;
    const selectedItems = [];

    for (const item of sortedItems) {
        if (currentWeight + item.weight <= capacity) {
            currentValue += item.value;
            currentWeight += item.weight;
            selectedItems.push(item);
        }
    }
    return {
        maxValue: currentValue,
        selectedItems: selectedItems.sort((a, b) => a.id - b.id)
    };
}

let maxBTValue;
let bestBTItems;
function backtrackingHelper(i, currentWeight, currentValue, capacity, items, currentItems) {
    if (i === items.length) {
        if (currentValue > maxBTValue) {
            maxBTValue = currentValue;
            bestBTItems = [...currentItems];
        }
        return;
    }
    const item = items[i];
    if (currentWeight + item.weight <= capacity) {
        currentItems.push(item);
        backtrackingHelper(i + 1, currentWeight + item.weight, currentValue + item.value, capacity, items, currentItems);
        currentItems.pop();
    }
    backtrackingHelper(i + 1, currentWeight, currentValue, capacity, items, currentItems);
}
function backtrackingKnapsack(capacity, items) {
    maxBTValue = 0;
    bestBTItems = [];
    backtrackingHelper(0, 0, 0, capacity, items, []);
    return {
        maxValue: maxBTValue,
        selectedItems: bestBTItems.sort((a, b) => a.id - b.id)
    };
}

let maxBNBValue;
let bestBNBItems;

function calculateBound(remainingCapacity, items, startIndex) {
    let currentCapacity = remainingCapacity;
    let boundValue = 0;
    for (let i = startIndex; i < items.length; i++) {
        const item = items[i];
        if (currentCapacity <= 0) break;
        if (item.weight <= currentCapacity) {
            boundValue += item.value;
            currentCapacity -= item.weight;
        } else {
            boundValue += item.value * (currentCapacity / item.weight);
            currentCapacity = 0;
            break;
        }
    }
    return boundValue;
}

function bnbHelper(i, currentWeight, currentValue, capacity, items, currentItems) {
    if (currentValue > maxBNBValue) {
        maxBNBValue = currentValue;
        bestBNBItems = [...currentItems];
    }
    if (i === items.length) {
        return;
    }

    const bound = currentValue + calculateBound(capacity - currentWeight, items, i);

    if (bound <= maxBNBValue) {
        return;
    }

    const item = items[i];
    if (currentWeight + item.weight <= capacity) {
        currentItems.push(item);
        bnbHelper(i + 1, currentWeight + item.weight, currentValue + item.value, capacity, items, currentItems);
        currentItems.pop();
    }
    bnbHelper(i + 1, currentWeight, currentValue, capacity, items, currentItems);
}

function bnbKnapsack(capacity, items) {
    const bnbItemsSortedByRatio = [...items].sort((a, b) => b.ratio - a.ratio);

    maxBNBValue = 0;
    bestBNBItems = [];

    bnbHelper(0, 0, 0, capacity, bnbItemsSortedByRatio, []);

    return {
        maxValue: maxBNBValue,
        selectedItems: bestBNBItems.sort((a, b) => a.id - b.id)
    };
}

const INFINITY = 1e9;

let TSP_DIST_MATRIX = [];

function tspBacktrackingHelper(currentCost, currentPath, visited) {
    const n = TSP_DIST_MATRIX.length;
    const lastCity = currentPath[currentPath.length - 1];

    if (currentCost >= minTSP_BT_Cost) {
        return;
    }

    if (currentPath.length === n) {
        const costToStart = TSP_DIST_MATRIX[lastCity][currentPath[0]];
        if (costToStart > 0) {
            const totalCost = currentCost + costToStart;
            if (totalCost < minTSP_BT_Cost) {
                minTSP_BT_Cost = totalCost;
                bestTSP_BT_Path = [...currentPath, currentPath[0]];
            }
        }
        return;
    }

    for (let nextCity = 0; nextCity < n; nextCity++) {
        if (!visited[nextCity] && TSP_DIST_MATRIX[lastCity][nextCity] > 0) {
            currentPath.push(nextCity);
            visited[nextCity] = true;

            tspBacktrackingHelper(
                currentCost + TSP_DIST_MATRIX[lastCity][nextCity],
                currentPath,
                visited
            );

            visited[nextCity] = false;
            currentPath.pop();
        }
    }
}

function tspBacktracking() {
    const n = TSP_DIST_MATRIX.length;
    minTSP_BT_Cost = INFINITY;
    bestTSP_BT_Path = [];

    const initialPath = [0];
    const visited = Array(n).fill(false);
    visited[0] = true;

    tspBacktrackingHelper(0, initialPath, visited);

    return {
        minCost: minTSP_BT_Cost === INFINITY ? -1 : minTSP_BT_Cost,
        bestPath: bestTSP_BT_Path.map(c => c + 1)
    };
}

let minTSP_BNB_Cost;
let bestTSP_BNB_Path;

function calculateTSPLowerBound(currentCost, currentPath, visited) {
    const n = TSP_DIST_MATRIX.length;
    let lowerBound = currentCost;

    for (let i = 0; i < n; i++) {
        if (!visited[i] || i === currentPath[0]) {
            let minEdge1 = INFINITY;

            for (let j = 0; j < n; j++) {
                if (i !== j && TSP_DIST_MATRIX[i][j] > 0) {
                    if (TSP_DIST_MATRIX[i][j] < minEdge1) {
                        minEdge1 = TSP_DIST_MATRIX[i][j];
                    }
                }
            }

            if (!visited[i] && minEdge1 !== INFINITY) {
                lowerBound += minEdge1;
            }
        }
    }
    return lowerBound;
}

function tspBnBHelper(currentCost, currentPath, visited) {
    const n = TSP_DIST_MATRIX.length;
    const lastCity = currentPath[currentPath.length - 1];

    const lowerBound = calculateTSPLowerBound(currentCost, currentPath, visited);

    if (lowerBound >= minTSP_BNB_Cost) {
        return;
    }

    if (currentPath.length === n) {
        const costToStart = TSP_DIST_MATRIX[lastCity][currentPath[0]];
        if (costToStart > 0) {
            const totalCost = currentCost + costToStart;
            if (totalCost < minTSP_BNB_Cost) {
                minTSP_BNB_Cost = totalCost;
                bestTSP_BNB_Path = [...currentPath, currentPath[0]];
            }
        }
        return;
    }

    for (let nextCity = 0; nextCity < n; nextCity++) {
        if (!visited[nextCity] && TSP_DIST_MATRIX[lastCity][nextCity] > 0) {
            currentPath.push(nextCity);
            visited[nextCity] = true;

            tspBnBHelper(
                currentCost + TSP_DIST_MATRIX[lastCity][nextCity],
                currentPath,
                visited
            );

            visited[nextCity] = false;
            currentPath.pop();
        }
    }
}

function tspBranchAndBound() {
    const n = TSP_DIST_MATRIX.length;
    minTSP_BNB_Cost = INFINITY;
    bestTSP_BNB_Path = [];

    const initialPath = [0];
    const visited = Array(n).fill(false);
    visited[0] = true;

    tspBnBHelper(0, initialPath, visited);

    return {
        minCost: minTSP_BNB_Cost === INFINITY ? -1 : minTSP_BNB_Cost,
        bestPath: bestTSP_BNB_Path.map(c => c + 1)
    };
}

app.post('/tsp', (req, res) => {
    const { matrix } = req.body;
    TSP_DIST_MATRIX = matrix;

    const btStart = process.hrtime();
    const btResult = tspBacktracking();
    const btEnd = process.hrtime(btStart);
    const btTime = (btEnd[0] * 1000 + btEnd[1] / 1000000).toFixed(3);

    const bnbStart = process.hrtime();
    const bnbResult = tspBranchAndBound();
    const bnbEnd = process.hrtime(bnbStart);
    const bnbTime = (bnbEnd[0] * 1000 + bnbEnd[1] / 1000000).toFixed(3);

    res.json({
        bt: { ...btResult, time: btTime },
        bnb: { ...bnbResult, time: bnbTime },
    });
});

let AP_COST_MATRIX = [];
let minAP_BT_Cost;
let bestAP_BT_Assignment;

function apBacktrackingHelper(agentIndex, currentCost, assignedTasks) {
    const n = AP_COST_MATRIX.length;

    if (currentCost >= minAP_BT_Cost) {
        return;
    }

    if (agentIndex === n) {
        if (currentCost < minAP_BT_Cost) {
            minAP_BT_Cost = currentCost;
            bestAP_BT_Assignment = [...assignedTasks];
        }
        return;
    }

    for (let task = 0; task < n; task++) {
        if (assignedTasks.indexOf(task) === -1) {
            const cost = AP_COST_MATRIX[agentIndex][task];
            assignedTasks.push(task);
            apBacktrackingHelper(
                agentIndex + 1,
                currentCost + cost,
                assignedTasks
            );
            assignedTasks.pop();
        }
    }
}

function apBacktracking() {
    const n = AP_COST_MATRIX.length;
    minAP_BT_Cost = INFINITY;
    bestAP_BT_Assignment = [];

    apBacktrackingHelper(0, 0, []);

    return {
        minCost: minAP_BT_Cost === INFINITY ? -1 : minAP_BT_Cost,
        bestAssignment: bestAP_BT_Assignment.map((taskIndex, agentIndex) => `Agent ${agentIndex + 1} → Task ${taskIndex + 1}`)
    };
}

let minAP_BNB_Cost;
let bestAP_BNB_Assignment;

function calculateAPLowerBound(agentIndex, assignedTasks) {
    const n = AP_COST_MATRIX.length;
    let remainingMinCost = 0;

    for (let i = agentIndex; i < n; i++) {
        let minCostForAgent = INFINITY;

        for (let j = 0; j < n; j++) {
            if (assignedTasks.indexOf(j) === -1) {
                minCostForAgent = Math.min(minCostForAgent, AP_COST_MATRIX[i][j]);
            }
        }
        remainingMinCost += minCostForAgent;
    }
    return remainingMinCost;
}

function apBnBHelper(agentIndex, currentCost, assignedTasks) {
    const n = AP_COST_MATRIX.length;

    if (agentIndex === n) {
        if (currentCost < minAP_BNB_Cost) {
            minAP_BNB_Cost = currentCost;
            bestAP_BNB_Assignment = [...assignedTasks];
        }
        return;
    }

    const lowerBound = currentCost + calculateAPLowerBound(agentIndex, assignedTasks);

    if (lowerBound >= minAP_BNB_Cost) {
        return;
    }

    for (let task = 0; task < n; task++) {
        if (assignedTasks.indexOf(task) === -1) {
            const cost = AP_COST_MATRIX[agentIndex][task];
            assignedTasks.push(task);
            apBnBHelper(
                agentIndex + 1,
                currentCost + cost,
                assignedTasks
            );
            assignedTasks.pop();
        }
    }
}

function apBranchAndBound() {
    const n = AP_COST_MATRIX.length;
    minAP_BNB_Cost = INFINITY;
    bestAP_BNB_Assignment = [];

    apBnBHelper(0, 0, []);

    return {
        minCost: minAP_BNB_Cost === INFINITY ? -1 : minAP_BNB_Cost,
        bestAssignment: bestAP_BNB_Assignment.map((taskIndex, agentIndex) => `Agent ${agentIndex + 1} → Task ${taskIndex + 1}`)
    };
}

app.post('/assignment', (req, res) => {
    const { matrix } = req.body;
    AP_COST_MATRIX = matrix;

    const btStart = process.hrtime();
    const btResult = apBacktracking();
    const btEnd = process.hrtime(btStart);
    const btTime = (btEnd[0] * 1000 + btEnd[1] / 1000000).toFixed(3);

    const bnbStart = process.hrtime();
    const bnbResult = apBranchAndBound();
    const bnbEnd = process.hrtime(bnbStart);
    const bnbTime = (bnbEnd[0] * 1000 + bnbEnd[1] / 1000000).toFixed(3);

    res.json({
        bt: { ...btResult, time: btTime },
        bnb: { ...bnbResult, time: bnbTime },
    });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
