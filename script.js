const visualizerContainer = document.getElementById('visualizer-container');
// Replace native select with custom logic
// const algorithmSelect = document.getElementById('algorithm-select');
const customSelect = document.getElementById('custom-algorithm-select');
const selectTrigger = document.getElementById('algorithm-trigger');
const selectOptions = document.getElementById('algorithm-options');
const algorithmValueInput = document.getElementById('algorithm-value');

// Mock the algorithmSelect object to keep existing code working with minimal changes
const algorithmSelect = {
    get value() {
        return algorithmValueInput.value;
    },
    set value(val) {
        algorithmValueInput.value = val;
        // Update UI text
        const option = document.querySelector(`.option[data-value="${val}"]`);
        if (option) {
            selectTrigger.innerText = option.innerText;
        }
    },
    addEventListener: (event, callback) => {
        // We will handle the 'change' event manually in the custom dropdown logic
        if (event === 'change') {
            algorithmSelect._changeCallback = callback;
        }
    },
    _changeCallback: null
};
const generateBtn = document.getElementById('generate-btn');
const playBtn = document.getElementById('play-btn');
const stepBtn = document.getElementById('step-btn');
const resetBtn = document.getElementById('reset-btn');
const speedSlider = document.getElementById('speed-slider');
const codeDisplay = document.getElementById('code-display');
const comparisonCountSpan = document.getElementById('comparison-count');
const swapCountSpan = document.getElementById('swap-count');

// Complexity Elements
const timeBestEl = document.getElementById('time-best');
const timeAvgEl = document.getElementById('time-avg');
const timeWorstEl = document.getElementById('time-worst');
const spaceComplexityEl = document.getElementById('space-complexity');

// State
let array = [];
let isPlaying = false;
let isPaused = false;
let speed = 50;
const ARRAY_SIZE = 20;
let sorter = null; // Generator instance
let comparisonCount = 0;
let swapCount = 0;
let animationDelay = 500;

// Algorithms Data
const algorithms = {
    bubble: {
        name: 'Bubble Sort',
        code: `public void bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // swap arr[j+1] and arr[j]
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`,
        complexity: {
            best: 'Ω(n)',
            avg: 'Θ(n²)',
            worst: 'O(n²)',
            space: 'O(1)'
        },
        // Generator function for Bubble Sort
        run: function* (arr) {
            const n = arr.length;
            yield { type: 'line', line: 2 }; // int n = arr.length;

            for (let i = 0; i < n - 1; i++) {
                yield { type: 'line', line: 3 }; // for (int i = 0; i < n - 1; i++)

                for (let j = 0; j < n - i - 1; j++) {
                    yield { type: 'line', line: 4 }; // for (int j = 0; j < n - i - 1; j++)

                    yield { type: 'compare', indices: [j, j + 1], line: 5 }; // if (arr[j] > arr[j + 1])

                    if (arr[j] > arr[j + 1]) {
                        yield { type: 'line', line: 7 }; // int temp = arr[j];

                        // Swap in array
                        let temp = arr[j];
                        arr[j] = arr[j + 1];
                        arr[j + 1] = temp;

                        yield { type: 'swap', indices: [j, j + 1], line: 8 }; // arr[j] = arr[j + 1];
                        yield { type: 'line', line: 9 }; // arr[j + 1] = temp;
                    }
                }
                // Mark n-i-1 as sorted
                yield { type: 'sorted', index: n - i - 1 };
            }
            yield { type: 'sorted', index: 0 }; // First element is sorted
        }
    },
    selection: {
        name: 'Selection Sort',
        code: `public void selectionSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        int min_idx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[min_idx]) {
                min_idx = j;
            }
        }
        // Swap the found minimum element with the first
        int temp = arr[min_idx];
        arr[min_idx] = arr[i];
        arr[i] = temp;
    }
}`,
        complexity: {
            best: 'Ω(n²)',
            avg: 'Θ(n²)',
            worst: 'O(n²)',
            space: 'O(1)'
        },
        run: function* (arr) {
            const n = arr.length;
            yield { type: 'line', line: 2 }; // int n = arr.length;

            for (let i = 0; i < n - 1; i++) {
                yield { type: 'line', line: 3 }; // for (int i = 0; i < n - 1; i++)
                let min_idx = i;
                yield { type: 'line', line: 4 }; // int min_idx = i;

                for (let j = i + 1; j < n; j++) {
                    yield { type: 'line', line: 5 }; // for (int j = i + 1; j < n; j++)

                    yield { type: 'compare', indices: [j, min_idx], line: 6 }; // if (arr[j] < arr[min_idx])

                    if (arr[j] < arr[min_idx]) {
                        min_idx = j;
                        yield { type: 'line', line: 7 }; // min_idx = j;
                    }
                }

                yield { type: 'line', line: 11 }; // int temp = arr[min_idx];

                // Swap
                let temp = arr[min_idx];
                arr[min_idx] = arr[i];
                arr[i] = temp;

                yield { type: 'swap', indices: [min_idx, i], line: 12 }; // arr[min_idx] = arr[i];
                yield { type: 'line', line: 13 }; // arr[i] = temp;

                yield { type: 'sorted', index: i };
            }
            yield { type: 'sorted', index: n - 1 }; // Last element is sorted
        }
    },
    insertion: {
        name: 'Insertion Sort',
        code: `public void insertionSort(int[] arr) {
    int n = arr.length;
    for (int i = 1; i < n; ++i) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j = j - 1;
        }
        arr[j + 1] = key;
    }
}`,
        complexity: {
            best: 'Ω(n)',
            avg: 'Θ(n²)',
            worst: 'O(n²)',
            space: 'O(1)'
        },
        run: function* (arr) {
            const n = arr.length;
            yield { type: 'line', line: 2 }; // int n = arr.length;

            // First element is trivially sorted in the sorted portion
            yield { type: 'sorted', index: 0 };

            for (let i = 1; i < n; ++i) {
                yield { type: 'line', line: 3 }; // for (int i = 1; i < n; ++i)

                let key = arr[i];
                yield { type: 'line', line: 4 }; // int key = arr[i];

                let j = i - 1;
                yield { type: 'line', line: 5 }; // int j = i - 1;

                while (j >= 0) {
                    yield { type: 'compare', indices: [j, j + 1], line: 6 }; // while (j >= 0 && arr[j] > key)

                    if (arr[j] > key) {
                        yield { type: 'line', line: 7 }; // arr[j + 1] = arr[j];

                        let temp = arr[j + 1];
                        arr[j + 1] = arr[j];
                        arr[j] = temp;

                        yield { type: 'swap', indices: [j, j + 1], line: 7 };

                        j = j - 1;
                        yield { type: 'line', line: 8 }; // j = j - 1;
                    } else {
                        break;
                    }
                }

                yield { type: 'line', line: 10 };

                // Mark the sorted portion (0 to i are sorted relative to each other)
                for (let k = 0; k <= i; k++) yield { type: 'sorted', index: k };
            }
        }
    },
    quick: {
        name: 'Quick Sort',
        type: 'bar',
        code: `public void quickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int partition(int[] arr, int low, int high) {
    int pivot = arr[high];
    int i = (low - 1);
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    int temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    return i + 1;
}`,
        complexity: {
            best: 'Ω(n log(n))',
            avg: 'Θ(n log(n))',
            worst: 'O(n²)',
            space: 'O(log(n))'
        },
        run: function* (arr) {
            yield* quickSortHelper(arr, 0, arr.length - 1);
            // Mark all as sorted at the end
            for (let i = 0; i < arr.length; i++) yield { type: 'sorted', index: i };
        }
    },
    merge: {
        name: 'Merge Sort',
        type: 'bar',
        code: `public void mergeSort(int[] arr, int l, int r) {
    if (l < r) {
        int m = l + (r - l) / 2;
        mergeSort(arr, l, m);
        mergeSort(arr, m + 1, r);
        merge(arr, l, m, r);
    }
}

void merge(int[] arr, int l, int m, int r) {
    // Find sizes of two subarrays to be merged
    int n1 = m - l + 1;
    int n2 = r - m;
    int L[] = new int[n1];
    int R[] = new int[n2];
    // Copy data to temp arrays
    for (int i = 0; i < n1; ++i) L[i] = arr[l + i];
    for (int j = 0; j < n2; ++j) R[j] = arr[m + 1 + j];
    // Merge the temp arrays
    int i = 0, j = 0;
    int k = l;
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) {
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        k++;
    }
    while (i < n1) { arr[k] = L[i]; i++; k++; }
    while (j < n2) { arr[k] = R[j]; j++; k++; }
}`,
        complexity: {
            best: 'Ω(n log(n))',
            avg: 'Θ(n log(n))',
            worst: 'O(n log(n))',
            space: 'O(n)'
        },
        run: function* (arr) {
            yield* mergeSortHelper(arr, 0, arr.length - 1);
            // Mark all as sorted at the end
            for (let i = 0; i < arr.length; i++) yield { type: 'sorted', index: i };
        }
    },
    bst: {
        name: 'BST Insertion',
        type: 'tree',
        code: `public void insert(int key) {
    root = insertRec(root, key);
}

Node insertRec(Node root, int key) {
    if (root == null) {
        root = new Node(key);
        return root;
    }
    if (key < root.key)
        root.left = insertRec(root.left, key);
    else if (key > root.key)
        root.right = insertRec(root.right, key);
    return root;
}`,
        complexity: {
            best: 'Ω(log(n))',
            avg: 'Θ(log(n))',
            worst: 'O(n)',
            space: 'O(n)'
        },
        run: function* (arr) {
            // For BST, we visualize insertion of each element from the array into the tree
            // We need to maintain the tree state visually
            clearTree();
            let root = null;

            for (let i = 0; i < arr.length; i++) {
                const val = arr[i];
                yield { type: 'line', line: 2 }; // insert(key)

                if (!root) {
                    root = { val, left: null, right: null, x: 50, y: 10, level: 0, id: `node-${val}` };
                    yield { type: 'tree-insert', node: root, parent: null };
                    yield { type: 'line', line: 6 }; // root = new Node(key)
                    continue;
                }

                let current = root;
                let parent = null;
                let level = 0;

                // Visualize traversal to find spot
                while (true) {
                    yield { type: 'tree-compare', node: current };
                    yield { type: 'line', line: 9 }; // if (key < root.key)

                    if (val < current.val) {
                        if (current.left === null) {
                            yield { type: 'line', line: 10 }; // root.left = insertRec...
                            current.left = { val, left: null, right: null, x: current.x - (20 / (level + 1)), y: current.y + 15, level: level + 1, id: `node-${val}` };
                            yield { type: 'tree-insert', node: current.left, parent: current };
                            break;
                        }
                        current = current.left;
                        level++;
                    } else {
                        yield { type: 'line', line: 11 }; // else if (key > root.key)
                        if (current.right === null) {
                            yield { type: 'line', line: 12 }; // root.right = insertRec...
                            current.right = { val, left: null, right: null, x: current.x + (20 / (level + 1)), y: current.y + 15, level: level + 1, id: `node-${val}` };
                            yield { type: 'tree-insert', node: current.right, parent: current };
                            break;
                        }
                        current = current.right;
                        level++;
                    }
                }
            }
        }
    }
};

// Helper Generators
function* quickSortHelper(arr, low, high) {
    yield { type: 'line', line: 2 }; // if (low < high)
    if (low < high) {
        yield { type: 'line', line: 3 }; // int pi = partition(arr, low, high);

        const pi = yield* partition(arr, low, high);

        yield { type: 'line', line: 4 }; // quickSort(arr, low, pi - 1);
        yield* quickSortHelper(arr, low, pi - 1);

        yield { type: 'line', line: 5 }; // quickSort(arr, pi + 1, high);
        yield* quickSortHelper(arr, pi + 1, high);
    }
}

function* partition(arr, low, high) {
    let pivot = arr[high];
    yield { type: 'line', line: 10 }; // int pivot = arr[high];

    let i = (low - 1);
    yield { type: 'line', line: 11 }; // int i = (low - 1);

    for (let j = low; j < high; j++) {
        yield { type: 'line', line: 12 }; // for (int j = low; j < high; j++)

        yield { type: 'compare', indices: [j, high], line: 13 }; // if (arr[j] < pivot)

        if (arr[j] < pivot) {
            i++;
            yield { type: 'line', line: 14 }; // i++;

            yield { type: 'line', line: 15 }; // int temp = arr[i];

            let temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;

            yield { type: 'swap', indices: [i, j], line: 16 }; // arr[i] = arr[j];
            yield { type: 'line', line: 17 }; // arr[j] = temp;
        }
    }

    yield { type: 'line', line: 20 }; // int temp = arr[i + 1];

    let temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;

    yield { type: 'swap', indices: [i + 1, high], line: 21 }; // arr[i + 1] = arr[high];
    yield { type: 'line', line: 22 }; // arr[high] = temp;

    yield { type: 'line', line: 23 }; // return i + 1;
    return i + 1;
}

function* mergeSortHelper(arr, l, r) {
    yield { type: 'line', line: 2 }; // if (l < r)
    if (l < r) {
        let m = Math.floor(l + (r - l) / 2);
        yield { type: 'line', line: 3 }; // int m = l + (r - l) / 2;

        yield { type: 'line', line: 4 }; // mergeSort(arr, l, m);
        yield* mergeSortHelper(arr, l, m);

        yield { type: 'line', line: 5 }; // mergeSort(arr, m + 1, r);
        yield* mergeSortHelper(arr, m + 1, r);

        yield { type: 'line', line: 6 }; // merge(arr, l, m, r);
        yield* merge(arr, l, m, r);
    }
}

function* merge(arr, l, m, r) {
    let n1 = m - l + 1;
    let n2 = r - m;

    let L = new Array(n1);
    let R = new Array(n2);

    for (let i = 0; i < n1; ++i) L[i] = arr[l + i];
    for (let j = 0; j < n2; ++j) R[j] = arr[m + 1 + j];

    let i = 0, j = 0;
    let k = l;

    yield { type: 'line', line: 22 }; // while (i < n1 && j < n2)

    while (i < n1 && j < n2) {
        yield { type: 'compare', indices: [k, k], line: 23 };

        if (L[i] <= R[j]) {
            arr[k] = L[i];
            yield { type: 'line', line: 24 };
            yield { type: 'set', index: k, value: L[i], line: 24 };
            i++;
        } else {
            arr[k] = R[j];
            yield { type: 'line', line: 27 };
            yield { type: 'set', index: k, value: R[j], line: 27 };
            j++;
        }
        k++;
    }

    while (i < n1) {
        arr[k] = L[i];
        yield { type: 'set', index: k, value: L[i], line: 32 };
        i++;
        k++;
    }

    while (j < n2) {
        arr[k] = R[j];
        yield { type: 'set', index: k, value: R[j], line: 33 };
        j++;
        k++;
    }
}

// Initialization
function init() {
    generateArray();
    updateAlgorithmInfo();

    generateBtn.addEventListener('click', () => {
        reset();
        generateArray();
    });

    generateBtn.addEventListener('click', () => {
        reset();
        generateArray();
    });

    // Custom Dropdown Logic
    selectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        customSelect.classList.toggle('open');
    });

    selectOptions.addEventListener('click', (e) => {
        if (e.target.classList.contains('option')) {
            const value = e.target.getAttribute('data-value');
            const text = e.target.innerText;

            // Update UI
            selectTrigger.innerText = text;
            algorithmValueInput.value = value;
            customSelect.classList.remove('open');

            // Trigger change callback
            if (algorithmSelect._changeCallback) {
                algorithmSelect._changeCallback();
            }
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            customSelect.classList.remove('open');
        }
    });

    /* 
    algorithmSelect.addEventListener('change', () => {
        reset();
        updateAlgorithmInfo();
    });
    */
    // Re-bind the callback since we mocked addEventListener
    algorithmSelect.addEventListener('change', () => {
        reset();
        updateAlgorithmInfo();
    });

    speedSlider.addEventListener('input', (e) => {
        // Speed 1-100. Delay should be high when speed is low.
        // Map 1 -> 1000ms, 100 -> 10ms
        const val = parseInt(e.target.value);
        animationDelay = 1000 - (val * 9.9);
    });

    playBtn.addEventListener('click', togglePlay);
    stepBtn.addEventListener('click', step);
    resetBtn.addEventListener('click', reset);
}

function generateArray() {
    array = [];

    // Always clear visualizer to regenerate bars
    visualizerContainer.innerHTML = '';

    // Re-add SVG if it was wiped (it might be wiped by innerHTML = '')
    if (!document.getElementById('tree-svg')) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = "tree-svg";
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.position = "absolute";
        svg.style.top = "0";
        svg.style.left = "0";
        svg.style.pointerEvents = "none";
        // SVG should be visible if BST is active, but we'll handle display in updateAlgorithmInfo/reset
        // actually let's just default it to hidden and let updateAlgorithmInfo toggle it
        svg.style.display = "none";
        visualizerContainer.appendChild(svg);
        treeSvg = svg; // Update global ref
    }

    // In BST mode, we might want to clear the tree nodes if we are regenerating the array
    const algoKey = algorithmSelect.value;
    if (algoKey === 'bst') {
        clearTree();
    }

    for (let i = 0; i < ARRAY_SIZE; i++) {
        const value = Math.floor(Math.random() * 80) + 10;
        array.push(value);

        // Always create bars
        const bar = document.createElement('div');
        bar.classList.add('bar');
        bar.style.height = `${value * 5}px`;
        bar.id = `bar-${i}`;

        const label = document.createElement('span');
        label.classList.add('bar-label');
        label.innerText = value;
        bar.appendChild(label);

        visualizerContainer.appendChild(bar);
    }

    // Ensure SVG is on top or bottom? 
    // It is absolute positioned, so order in DOM matters for z-index if not specified.
    // But we want bars to be visible.
    // Let's make sure updateAlgorithmInfo sets the correct state.
    updateAlgorithmInfo();
}

function updateAlgorithmInfo() {
    const algoKey = algorithmSelect.value;
    const algo = algorithms[algoKey];

    // Update Code Display
    const lines = algo.code.trim().split('\n');
    const formattedCode = lines.map((line, index) => {
        // Basic Syntax Highlighting
        let highlightedLine = escapeHtml(line);

        // Comments
        if (highlightedLine.includes('//')) {
            const parts = highlightedLine.split('//');
            highlightedLine = parts[0] + `<span class="token-comment">//${parts.slice(1).join('//')}</span>`;
        } else {
            // Keywords
            const keywords = ['public', 'void', 'int', 'for', 'while', 'if', 'else', 'return', 'new', 'break', 'continue'];
            keywords.forEach(kw => {
                const regex = new RegExp(`\\b${kw}\\b`, 'g');
                highlightedLine = highlightedLine.replace(regex, `<span class="token-keyword">${kw}</span>`);
            });

            // Types (simple heuristic)
            const types = ['Node'];
            types.forEach(type => {
                const regex = new RegExp(`\\b${type}\\b`, 'g');
                highlightedLine = highlightedLine.replace(regex, `<span class="token-type">${type}</span>`);
            });
        }

        return `<div class="code-line" id="line-${index + 1}"><span class="line-num">${index + 1}</span>${highlightedLine}</div>`;
    }).join('');
    codeDisplay.innerHTML = formattedCode;

    // Update Complexity
    if (algo.complexity) {
        timeBestEl.textContent = algo.complexity.best || '-';
        timeAvgEl.textContent = algo.complexity.avg || '-';
        timeWorstEl.textContent = algo.complexity.worst || '-';
        spaceComplexityEl.textContent = algo.complexity.space || '-';
    }

    // Handle view switching
    if (algoKey === 'bst') {
        // Don't hide bars for BST anymore
        document.querySelectorAll('.bar').forEach(b => b.style.display = 'block');
        if (treeSvg) treeSvg.style.display = 'block';
        clearTree();
    } else {
        document.querySelectorAll('.bar').forEach(b => b.style.display = 'block');
        if (treeSvg) treeSvg.style.display = 'none';
    }
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function reset() {
    isPlaying = false;
    isPaused = false;
    sorter = null;
    playBtn.textContent = 'Play';
    playBtn.classList.remove('secondary');
    playBtn.classList.add('primary');

    // Reset bars color
    const bars = document.querySelectorAll('.bar');
    bars.forEach(bar => {
        bar.className = 'bar';
        bar.style.display = 'block'; // Ensure visible
    });

    comparisonCount = 0;
    swapCount = 0;
    updateStats();

    // Remove active line highlights
    document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active'));

    // If BST, clear tree
    if (algorithmSelect.value === 'bst') {
        clearTree();
        if (treeSvg) treeSvg.style.display = 'block';
    } else {
        if (treeSvg) treeSvg.style.display = 'none';
    }
}

function updateStats() {
    comparisonCountSpan.textContent = comparisonCount;
    swapCountSpan.textContent = swapCount;
}

function togglePlay() {
    if (isPlaying) {
        // Pause
        isPlaying = false;
        isPaused = true;
        playBtn.textContent = 'Play';
    } else {
        // Play
        isPlaying = true;
        isPaused = false;
        playBtn.textContent = 'Pause';
        playLoop();
    }
}

async function playLoop() {
    while (isPlaying) {
        const finished = step();
        if (finished) {
            isPlaying = false;
            playBtn.textContent = 'Play';
            break;
        }
        await new Promise(resolve => setTimeout(resolve, animationDelay));
    }
}

function step() {
    if (!sorter) {
        // Initialize generator with a copy of the array to avoid reference issues if we were to restart
        // But here we want to sort the actual array state
        const algoKey = algorithmSelect.value;
        // We pass a copy for logic, but we need to reflect changes on the UI based on indices
        // Actually, passing the real array is fine as long as we don't mutate it externally
        sorter = algorithms[algoKey].run([...array]);
    }

    const { value, done } = sorter.next();

    if (done) {
        return true;
    }

    handleAction(value);
    return false;
}

function handleAction(action) {
    // Reset previous highlights
    document.querySelectorAll('.bar').forEach(b => {
        if (!b.classList.contains('sorted')) {
            b.className = 'bar';
        }
    });
    document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active'));

    // Highlight Code Line
    if (action.line) {
        const lineEl = document.getElementById(`line-${action.line}`);
        if (lineEl) {
            lineEl.classList.add('active');
            // Fix Jitter: Use manual scrollTop instead of scrollIntoView
            const container = lineEl.parentElement.parentElement; // .code-container
            // We want to center the line
            const containerHeight = container.clientHeight;
            const lineTop = lineEl.offsetTop;
            const lineHeight = lineEl.offsetHeight;

            // Calculate desired scroll position
            const targetScroll = lineTop - (containerHeight / 2) + (lineHeight / 2);

            container.scrollTo({
                top: targetScroll,
                behavior: 'smooth'
            });
        }
    }

    // Handle Visuals
    if (action.type === 'compare') {
        comparisonCount++;
        const [i, j] = action.indices;
        const bar1 = document.getElementById(`bar-${i}`);
        const bar2 = document.getElementById(`bar-${j}`);
        if (bar1) bar1.classList.add('compare');
        if (bar2) bar2.classList.add('compare');
    } else if (action.type === 'swap') {
        swapCount++;
        const [i, j] = action.indices;
        const bar1 = document.getElementById(`bar-${i}`);
        const bar2 = document.getElementById(`bar-${j}`);

        if (bar1 && bar2) {
            bar1.classList.add('swap');
            bar2.classList.add('swap');

            // Swap heights in DOM
            const h1 = bar1.style.height;
            const h2 = bar2.style.height;
            bar1.style.height = h2;
            bar2.style.height = h1;

            // Swap labels
            const l1 = bar1.querySelector('.bar-label').innerText;
            const l2 = bar2.querySelector('.bar-label').innerText;
            bar1.querySelector('.bar-label').innerText = l2;
            bar2.querySelector('.bar-label').innerText = l1;

            // Update internal array state for consistency (though generator has its own copy, 
            // we need to keep `array` global var in sync if we want to support "reset to current state" later, 
            // but for now generator drives everything)
        }
    } else if (action.type === 'sorted') {
        const bar = document.getElementById(`bar-${action.index}`);
        if (bar) bar.classList.add('sorted');
    } else if (action.type === 'set') {
        // Used for Merge Sort overwrites
        const bar = document.getElementById(`bar-${action.index}`);
        if (bar) {
            bar.style.height = `${action.value * 5}px`;
            bar.querySelector('.bar-label').innerText = action.value;
            bar.classList.add('swap'); // Flash red to show change
        }
    } else if (action.type === 'tree-insert') {
        drawNode(action.node, action.parent);
    } else if (action.type === 'tree-compare') {
        const nodeEl = document.getElementById(action.node.id);
        if (nodeEl) {
            nodeEl.classList.add('compare');
            setTimeout(() => nodeEl.classList.remove('compare'), animationDelay * 0.8);
        }
    }

    updateStats();
}

// Tree Visualization Helpers
let treeSvg = document.getElementById('tree-svg');

function clearTree() {
    document.querySelectorAll('.tree-node').forEach(el => el.remove());
    if (treeSvg) treeSvg.innerHTML = ''; // Clear edges
}

function drawNode(node, parent) {
    // Calculate position
    // We use percentage for X to be responsive, and fixed px for Y
    // Root is at 50%, 50px
    // Children spread out based on level
    // Improved logic: use a width that halves every level

    // Initial spread width (percentage of container)
    const initialSpread = 50;

    // If root
    if (!parent) {
        node.visualX = 50; // Center
        node.visualY = 40;
    } else {
        // Determine direction
        const isLeft = node.val < parent.val;
        // Calculate offset based on level. Level 0 is root.
        // Level 1 offset = 25, Level 2 = 12.5, etc.
        const level = node.level;
        const offset = initialSpread / Math.pow(2, level);

        node.visualX = parent.visualX + (isLeft ? -offset : offset);
        node.visualY = parent.visualY + 60; // Fixed vertical spacing
    }

    const containerWidth = visualizerContainer.clientWidth;
    const xPos = (node.visualX / 100) * containerWidth;
    const yPos = node.visualY;

    const nodeEl = document.createElement('div');
    nodeEl.classList.add('tree-node');
    nodeEl.id = node.id;
    nodeEl.innerText = node.val;
    nodeEl.style.left = `${xPos - 18}px`; // Center the 36px node
    nodeEl.style.top = `${yPos - 18}px`;

    // Animate entrance
    nodeEl.style.transform = 'scale(0)';
    visualizerContainer.appendChild(nodeEl);

    // Trigger reflow
    nodeEl.offsetHeight;
    nodeEl.style.transform = 'scale(1)';

    if (parent) {
        const parentX = (parent.visualX / 100) * containerWidth;
        const parentY = parent.visualY;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', parentX);
        line.setAttribute('y1', parentY + 18); // Bottom of parent
        line.setAttribute('x2', xPos);
        line.setAttribute('y2', yPos - 18); // Top of child
        line.classList.add('tree-edge');
        treeSvg.appendChild(line);
    }
}

// Resizable Layout Logic
const resizerV = document.getElementById('resizer-v');
const resizerH = document.getElementById('resizer-h');
const visualizationSection = document.querySelector('.visualization-section');
const infoSection = document.querySelector('.info-section');
const codePanel = document.querySelector('.code-panel');
const complexityPanel = document.querySelector('.complexity-panel');
const mainContainer = document.querySelector('main');

let isResizingV = false;
let isResizingH = false;

resizerV.addEventListener('mousedown', (e) => {
    isResizingV = true;
    resizerV.classList.add('active');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
});

resizerH.addEventListener('mousedown', (e) => {
    isResizingH = true;
    resizerH.classList.add('active');
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', (e) => {
    if (!isResizingV && !isResizingH) return;

    if (isResizingV) {
        // Calculate new width for visualization section
        // We need to account for the offset of the main container
        const containerRect = mainContainer.getBoundingClientRect();
        const newWidth = e.clientX - containerRect.left;

        // Min width constraints
        if (newWidth > 200 && newWidth < containerRect.width - 200) {
            // Use flex-basis for smooth resizing
            visualizationSection.style.flex = `0 0 ${newWidth}px`;
            // The info section will take the remaining space automatically if we set it to flex: 1
            // But currently it has flex: 1, so we just need to make sure visualizationSection doesn't grow/shrink automatically
            // Actually, let's set both to explicit widths or flex-basis
            // Simpler: Set flex-basis on visualizationSection, let infoSection be flex: 1
        }
    }

    if (isResizingH) {
        // Calculate height for code panel
        const infoRect = infoSection.getBoundingClientRect();
        const newHeight = e.clientY - infoRect.top;

        if (newHeight > 100 && newHeight < infoRect.height - 100) {
            codePanel.style.flex = `0 0 ${newHeight}px`;
            // complexityPanel is flex: 1, so it will adjust
        }
    }
});

document.addEventListener('mouseup', () => {
    if (isResizingV) {
        isResizingV = false;
        resizerV.classList.remove('active');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }
    if (isResizingH) {
        isResizingH = false;
        resizerH.classList.remove('active');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }
});

init();
