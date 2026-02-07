// Global State
let currentQuestions = [];
let currentMode = '';
let currentChapter = 1;
let score = 0;
let answeredCount = 0;
let timerInterval;
let timeElapsed = 0;

// ===== THEME TOGGLE =====
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark-theme');
    html.classList.toggle('light-theme', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeButton();
}

function updateThemeButton() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const isDark = document.documentElement.classList.contains('dark-theme');
    btn.textContent = isDark ? '☀️' : '🌙';
}

// Apply saved theme on load
(function initTheme() {
    const saved = localStorage.getItem('theme');
    const html = document.documentElement;
    if (saved === 'dark') {
        html.classList.add('dark-theme');
        html.classList.remove('light-theme');
    } else if (saved === 'light') {
        html.classList.add('light-theme');
        html.classList.remove('dark-theme');
    }
    // Delay to ensure button exists
    setTimeout(updateThemeButton, 0);
})();

// Data Cache
let n2Data = null;
let isStudyMode = false;
let lastWrapper = null;
let lastDokkaiText = null;

// DOM Elements
const questionList = document.getElementById('questionList');
const testTitle = document.getElementById('testTitle');
const timerDisplay = document.getElementById('timerDisplay');
const progressInfo = document.getElementById('progressInfo');
const finishBtn = document.getElementById('finishBtn');
const resultModal = document.getElementById('resultModal');
const scoreDisplay = document.getElementById('scoreDisplay');
const studyControls = document.getElementById('studyControls');
const toggleGoi = document.getElementById('toggleGoi');
const toggleBunpoDokkai = document.getElementById('toggleBunpoDokkai');

// Constants
const QUESTIONS_PER_CHAPTER_GOI = 35; // Approx
const QUESTIONS_PER_CHAPTER_BUNPO = 32; // Increased from 25

document.addEventListener('DOMContentLoaded', async () => {
    // Parse URL params
    const urlParams = new URLSearchParams(window.location.search);
    currentMode = urlParams.get('mode') || 'combined';

    const chParam = urlParams.get('chapter');
    currentChapter = (chParam === 'random') ? 'random' : (parseInt(chParam) || 1);

    // Study Mode Flag
    const studyParam = urlParams.get('study');
    isStudyMode = (studyParam === 'true');

    // Legacy Study Mode Support: Only force isStudyMode if mode is explicitly 'study'
    if (currentMode === 'study') isStudyMode = true;

    // Load Data
    await loadData();

    // Setup UI
    setupTest();

    // Event Listeners
    finishBtn.addEventListener('click', finishTest);
    if (toggleGoi) toggleGoi.addEventListener('change', updateStudyDisplay);
    if (toggleBunpoDokkai) toggleBunpoDokkai.addEventListener('change', updateStudyDisplay);

    // Timer
    startTimer();
});

async function loadData() {
    // Data is loaded via <script> tags in test.html
    // n2QuestionsData comes from n2questions.js
    if (typeof n2QuestionsData !== 'undefined') {
        n2Data = n2QuestionsData;
    } else {
        console.error("n2QuestionsData is undefined. Check if n2questions.js is loaded correctly.");
        questionList.innerHTML = `<p style="color: var(--error-color)">Error loading data. n2questions.js not found.</p>`;
    }
}

function setupTest() {
    // Generate Questions based on Mode
    currentQuestions = generateQuestions(currentMode, currentChapter);

    // Set Title
    const modeNames = {
        'goi': '語彙 (Vocabulary)',
        'bunpo_dokkai': '文法・読解 (Grammar & Reading)',
        'combined': '全部 (Combined)',
        'shiken': '模擬テスト (Mock Test)',
        'study': 'スタディモード (Study)',
        'dokkai_drill': '読解ドリル (Reading Drill)'
    };

    let suffix = (currentChapter === 'random') ? 'ランダム (Random)' : `第${currentChapter}回`;
    if (currentMode === 'study') suffix = ''; // existing logic

    testTitle.textContent = `${modeNames[currentMode] || currentMode} - ${suffix}`;

    if (isStudyMode) {
        testTitle.textContent += ' [Study]';
    } else {
        timerDisplay.style.display = 'block';
    }

    // Study Mode Setup (LEGACY)
    if (currentMode === 'study') {
        studyControls.style.display = 'flex';
        finishBtn.style.display = 'none';
    } else {
        studyControls.style.display = 'none';

        // Handling Finish Button for New Modes
        if (currentMode === 'dokkai_drill' && isStudyMode) {
            finishBtn.style.display = 'none';
        } else {
            finishBtn.style.display = 'inline-flex';
        }
    }

    // Drill specific UI
    if (currentMode === 'dokkai_drill') {
        // Exit Button
        if (!document.getElementById('exitDrillBtn')) {
            const exitBtn = document.createElement('button');
            exitBtn.id = 'exitDrillBtn';
            exitBtn.innerText = 'Exit Drill';
            exitBtn.style.marginLeft = '15px';
            exitBtn.style.padding = '5px 10px';
            exitBtn.style.fontSize = '0.7em';
            exitBtn.style.cursor = 'pointer';
            exitBtn.style.backgroundColor = '#666';
            exitBtn.style.color = '#fff';
            exitBtn.style.border = 'none';
            exitBtn.style.borderRadius = '4px';

            exitBtn.onclick = exitDrill;
            testTitle.appendChild(exitBtn);
        }
    }

    // Render
    renderQuestions();
    updateProgress();
}

// Update display based on study mode checkbox toggles
function updateStudyDisplay() {
    const showGoi = toggleGoi ? toggleGoi.checked : true;
    const showBunpoDokkai = toggleBunpoDokkai ? toggleBunpoDokkai.checked : true;

    // Find all question sections and toggle visibility
    const allSections = document.querySelectorAll('.section-block');
    allSections.forEach(section => {
        const id = section.id || '';
        // GOI sections have type 'goi' in their class or id
        const isGoi = id.includes('goi') || section.querySelector('[data-type="goi"]');
        // Bunpo/Dokkai sections
        const isBunpoDokkai = id.includes('bunpo') || id.includes('dokkai') ||
            section.querySelector('[data-type="bunpo"]') ||
            section.querySelector('[data-type="dokkai"]');

        if (isGoi && !isBunpoDokkai) {
            section.style.display = showGoi ? '' : 'none';
        } else if (isBunpoDokkai && !isGoi) {
            section.style.display = showBunpoDokkai ? '' : 'none';
        }
        // If both or neither, show based on any checked
    });

    // Also hide/show dokkai wrapper if exists
    const dokkaiWrapper = document.querySelector('.dokkai-wrapper');
    if (dokkaiWrapper) {
        dokkaiWrapper.style.display = showBunpoDokkai ? '' : 'none';
    }

    updateProgress();
}

const QUESTIONS_PER_TYPE = {
    reading: 5,
    writing: 5,
    formation: 5,
    context: 7,
    paraphrase: 5,
    usage: 5
};

function classifyGoiQuestions(goiAll) {
    const buckets = {
        reading: [],
        writing: [],
        formation: [],
        context: [],
        paraphrase: [],
        usage: []
    };

    goiAll.forEach(q => {
        const text = q.question;

        // Mondai 6: Usage (No underline, no blank)
        if (!text.includes('<u>') && !text.includes('(') && !text.includes('（')) {
            buckets.usage.push(q);
            return;
        }

        // Mondai 3 & 4: Blanks (Formation / Context)
        if (text.includes('(') || text.includes('（')) {
            // Heuristic: Formation options are usually Short (1-2 chars). Context are longer.
            // Increased threshold to 2.2 to capture 2-char compounds in Formation.
            const avgLen = q.options.reduce((sum, opt) => sum + opt.length, 0) / q.options.length;
            if (avgLen <= 2.2) {
                buckets.formation.push(q);
            } else {
                buckets.context.push(q);
            }
            return;
        }

        // Mondai 1, 2, 5: Underlines (Reading, Writing, Paraphrase)
        if (text.includes('<u>')) {
            const match = text.match(/<u>(.*?)<\/u>/);
            const content = match ? match[1] : '';

            const optionsAreKana = q.options.every(opt => /^[\u3040-\u309f\u30a0-\u30ff\u30fc]+$/.test(opt));

            if (optionsAreKana) {
                // Options are Kana -> Reading (Mondai 1)
                buckets.reading.push(q);
            } else {
                // Options have Kanji.
                // Check Target Content.
                const isTargetKana = /^[\u3040-\u309f\u30a0-\u30ff\u30fc]+$/.test(content);

                if (isTargetKana) {
                    // Target is Kana, Options are Kanji -> Writing (Mondai 2)
                    buckets.writing.push(q);
                } else {
                    // Target has Kanji, Options have Kanji -> Paraphrase (Mondai 5)
                    buckets.paraphrase.push(q);
                }
            }
            return;
        }

        // Fallback
        buckets.context.push(q);
    });

    return buckets;
}

function generateQuestions(mode, chapter) {
    let questions = [];
    const goiAll = n2Data['文字・語彙'] || [];
    const bunpoAll = n2Data['文法'] || [];

    // Dokkai (photoTests is global)
    // ... (rest is same logic, verify below)

    const formatQ = (q, type, index, subType = null) => ({
        ...q,
        type: type,
        subType: subType,
        id: `${type}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        userAnswer: null
    });

    // --- GOI Mode ---
    // --- GOI Mode ---
    if (mode === 'goi' || mode === 'combined' || mode === 'study' || mode === 'shiken') {
        const goiStructured = (typeof n2QuestionsStructured !== 'undefined') ? n2QuestionsStructured['文字・語彙'] : [];
        const goiLinear = n2Data['文字・語彙'] || [];

        if (mode === 'shiken') {
            let allQuestions = goiLinear;
            const buckets = classifyGoiQuestions(allQuestions);

            // Ensure we pick correctly
            Object.keys(buckets).forEach(type => {
                const count = QUESTIONS_PER_TYPE[type] || 5;
                const randomSet = buckets[type].sort(() => 0.5 - Math.random()).slice(0, count);
                questions.push(...randomSet.map((q, i) => formatQ(q, 'goi', i, type)));
            });
        } else {
            // ... existing chapter logic ...
            if (goiStructured.length > 0) {
                const chapterData = goiStructured[chapter - 1];
                if (chapterData) {
                    const order = ['reading', 'writing', 'formation', 'context', 'paraphrase', 'usage'];
                    order.forEach(type => {
                        const qs = chapterData[type] || [];
                        questions.push(...qs.map((q, i) => formatQ(q, 'goi', i, type)));
                    });
                }
            } else {
                // Dynamic Structure Fallback
                const OFFSETS = { reading: 0, writing: 75, formation: 150, context: 225, paraphrase: 330, usage: 405 };
                const COUNTS = { reading: 5, writing: 5, formation: 5, context: 7, paraphrase: 5, usage: 5 };
                const chIdx = chapter - 1;
                Object.keys(OFFSETS).forEach(type => {
                    const start = OFFSETS[type] + (chIdx * COUNTS[type]);
                    const end = start + COUNTS[type];
                    if (start < goiLinear.length) {
                        questions.push(...goiLinear.slice(start, end).map((q, i) => formatQ(q, 'goi', i, type)));
                    }
                });
            }
        }
    }

    if (mode === 'bunpo_dokkai' || mode === 'combined' || mode === 'study' || mode === 'shiken') {
        const bunpoStructured = (typeof n2QuestionsStructured !== 'undefined') ? n2QuestionsStructured['文法'] : [];
        const starAll = n2Data['星問題'] || [];

        // Bunpo Logic
        if (mode === 'shiken') {
            // Mondai 7: Normal Grammar (12 Qs)
            const mondai7 = bunpoAll.sort(() => 0.5 - Math.random()).slice(0, 12);
            questions.push(...mondai7.map((q, i) => formatQ(q, 'bunpo', i)));

            // Mondai 8: Star Questions (5 Qs)
            const mondai8 = starAll.sort(() => 0.5 - Math.random()).slice(0, 5);
            questions.push(...mondai8.map((q, i) => formatQ(q, 'bunpo', i + 12))); // Offset index

            // Random Dokkai (1 set)
            if (typeof photoTests !== 'undefined' && photoTests.length > 0) {
                // Get 1 random index
                const r = Math.floor(Math.random() * photoTests.length);
                const d = photoTests[r];
                questions.push({
                    type: 'dokkai',
                    image: d.image.replace('./dokkai_photo', 'data/dokkai_photo'),
                    questions: d.questions.map((q, i) => ({ ...q, id: `dokkai_${r}_${i}` }))
                });
            }

        } else {
            // ... existing chapter logic ...
            if (bunpoStructured.length > 0) {
                const chQuestions = bunpoStructured[chapter - 1] || [];
                questions.push(...chQuestions.map((q, i) => formatQ(q, 'bunpo', i)));
            } else {
                // Fallback
            }

            // Add Dokkai (photoTests) for bunpo_dokkai, combined, and study modes
            if ((mode === 'bunpo_dokkai' || mode === 'combined' || mode === 'study') && typeof photoTests !== 'undefined' && photoTests.length > 0) {
                // Get dokkai for current chapter (1-based index)
                const chapterIndex = parseInt(chapter) - 1;
                if (photoTests[chapterIndex]) {
                    const d = photoTests[chapterIndex];
                    questions.push({
                        type: 'dokkai',
                        image: d.image.replace('./dokkai_photo', 'data/dokkai_photo'),
                        questions: d.questions.map((q, i) => ({ ...q, id: `dokkai_${chapterIndex}_${i}` }))
                    });
                }
            }
        }
    }

    if (mode === 'dokkai_drill') {
        const textDokkai = (typeof drillDokkaiQuestions !== 'undefined') ? drillDokkaiQuestions : [];

        let filtered = [];
        if (chapter === 'random') {
            // Pick random 10 items
            const shuffled = [...textDokkai].sort(() => 0.5 - Math.random());
            filtered = shuffled.slice(0, 10);
        } else {
            // Filter by chapter (title starts with "N ...")
            filtered = textDokkai.filter(item => item.title.startsWith(`${chapter} `));
        }

        filtered.forEach((item, idx) => {
            questions.push({
                ...item,
                type: 'text_dokkai',
                id: `text_dokkai_${chapter}_${idx}`,
                // Mark if it's chapter 6 for special styling (monospaced table-like)
                isTableLayout: item.title.includes('情報検索'),
                questions: item.questions.map((q, qIdx) => ({
                    ...q,
                    answer: q.correct,
                    userAnswer: null
                }))
            });
        });
    }

    // Sort combined questions? 
    // Usually standard test order: GOI -> BUNPO -> DOKKAI
    // The current push order ensures GOI first, then BUNPO, then DOKKAI.

    return questions;
}

function renderQuestions() {
    questionList.innerHTML = '';

    // Current Active Container
    let currentContainer = null;
    let lastSectionType = '';
    let bunpoCounter = 0;

    // Grouping
    lastWrapper = null;
    lastDokkaiText = null;

    let globalIndex = 0;
    // If we are in 'bunpo_dokkai' mode (Chapter), Bunpo questions usually start at Q33 in the book.
    if ((currentMode === 'bunpo_dokkai' || currentMode === 'study') && currentQuestions.some(q => q.type === 'bunpo')) {
        globalIndex = 32;
    }

    currentQuestions.forEach((item) => {
        let sectionIdentifier = '';
        let headerText = '';

        // Determine Section Identifier and Header
        if (item.type === 'goi') {
            sectionIdentifier = `goi_${item.subType || 'misc'}`;
            if (lastSectionType !== sectionIdentifier) {
                switch (item.subType) {
                    case 'reading': headerText = '問題1　＿の言葉の読み方として最もよいものを、１・２・３・４から一つ選びなさい。'; break;
                    case 'writing': headerText = '問題2　＿の言葉を漢字で書くとき、最もよいものを１・２・３・４から一つ選びなさい。'; break;
                    case 'formation': headerText = '問題3　（　）に入れるのに最もよいものを、１・２・３・４から一つ選びなさい。'; break;
                    case 'context': headerText = '問題4　（　）に入れるのに最もよいものを、１・２・３・４から一つ選びなさい。'; break;
                    case 'paraphrase': headerText = '問題5　＿の言葉に意味が最も近いものを、１・２・３・４から一つ選びなさい。'; break;
                    case 'usage': headerText = '問題6　次の言葉の使い方として最もよいものを、１・２・３・４から一つ選びなさい。'; break;
                }
            }
        } else if (item.type === 'bunpo') {
            // Bunpo Logic: Mondai 7 (0-11) or Mondai 8 (Star)
            // We need to track bunpoCounter to know when to switch blocks
            const isStar = (bunpoCounter >= 12);
            sectionIdentifier = isStar ? 'bunpo_star' : 'bunpo_normal';

            if (lastSectionType !== sectionIdentifier) {
                // Define header on switch
                if (!isStar) headerText = '問題7　次の文の（　）に入れるのに最もよいものを、１・２・３・４から一つ選びなさい。';
                else headerText = '問題8　次の文の　★　に入る最もよいものを、１・２・３・４から一つ選びなさい。';
            }
            bunpoCounter++;
        } else if (item.type === 'dokkai') {
            sectionIdentifier = 'dokkai_section';
            if (lastSectionType !== sectionIdentifier) {
                headerText = '読解 (Reading Comprehension)';
            }
        } else if (item.type === 'text_dokkai') {
            sectionIdentifier = `text_dokkai_${item.title}`;
            if (lastSectionType !== sectionIdentifier) {
                headerText = item.title;
            }
        }

        // If Section Changed, Create New Container
        if (lastSectionType !== sectionIdentifier) {
            currentContainer = document.createElement('div');
            currentContainer.className = 'section-block';
            currentContainer.id = `section-${sectionIdentifier}`;

            if (headerText) {
                const headerDiv = document.createElement('div');
                headerDiv.className = 'mondai-header';
                headerDiv.style.fontWeight = 'bold';
                headerDiv.style.marginBottom = '20px';
                headerDiv.style.paddingLeft = '5px';
                headerDiv.style.borderLeft = '4px solid var(--secondary-color)';
                headerDiv.innerText = headerText;
                currentContainer.appendChild(headerDiv);
            }

            questionList.appendChild(currentContainer);
            lastSectionType = sectionIdentifier;
        }

        // Render Item into Current Container
        if (item.type === 'dokkai') {
            // ... Render Dokkai Item (Image + subquestions) ...
            const wrapper = document.createElement('div');
            wrapper.className = 'question-block dokkai-wrapper'; // Flex wrapper

            // Left Column: Image
            const leftCol = document.createElement('div');
            leftCol.className = 'dokkai-left';

            const img = document.createElement('img');
            img.src = item.image;
            img.className = 'question-image';
            leftCol.appendChild(img);
            wrapper.appendChild(leftCol);

            // Right Column: Questions
            const rightCol = document.createElement('div');
            rightCol.className = 'dokkai-right';

            item.questions.forEach((q, qIndex) => {
                globalIndex++;
                const qDiv = document.createElement('div');
                qDiv.className = 'dokkai-question-item';
                qDiv.style.marginBottom = '30px';

                // 01.png logic check
                const isZeroPrefix = /\/(0\d+)\.(png|jpg|jpeg)$/i.test(item.image);
                if (!isZeroPrefix) {
                    const text = document.createElement('div');
                    text.className = 'question-text';
                    text.innerHTML = `(${globalIndex}) ${q.text}`;
                    qDiv.appendChild(text);
                }

                // Options
                const optGrid = document.createElement('div');
                optGrid.className = 'options-grid';
                q.options.forEach((opt, optIdx) => {
                    const btn = document.createElement('button');
                    btn.className = 'option-btn';
                    btn.innerHTML = `${optIdx + 1}. ${opt}`;
                    btn.onclick = () => handleAnswer(q, optIdx, btn, optGrid);
                    if (currentMode === 'study') {
                        btn.disabled = true;
                        if (optIdx === q.correct) btn.classList.add('correct');
                    }
                    optGrid.appendChild(btn);
                });
                qDiv.appendChild(optGrid);
                rightCol.appendChild(qDiv);
            });
            wrapper.appendChild(rightCol);
            currentContainer.appendChild(wrapper);

        } else if (item.type === 'text_dokkai') {
            let wrapper;
            if (item.text === lastDokkaiText && lastWrapper) {
                wrapper = lastWrapper;
            } else {
                wrapper = document.createElement('div');
                wrapper.className = 'question-block dokkai-wrapper';
                wrapper.style.width = '100%';
                wrapper.style.marginBottom = '30px';

                const textDiv = document.createElement('div');
                textDiv.className = 'dokkai-text';
                textDiv.style.whiteSpace = 'pre-wrap';
                textDiv.style.padding = '20px';
                textDiv.style.background = '#f9f9f9';
                textDiv.style.color = '#333';
                textDiv.style.borderRadius = '8px';
                textDiv.style.marginBottom = '20px';
                textDiv.style.lineHeight = '1.8';
                textDiv.style.fontSize = '1.1em';
                textDiv.style.border = '1px solid #ddd';

                if (item.isTableLayout) {
                    textDiv.style.fontFamily = '"Consolas", "Monaco", "Courier New", monospace';
                    textDiv.style.fontSize = '1em';
                }

                textDiv.innerText = item.text;
                wrapper.appendChild(textDiv);

                currentContainer.appendChild(wrapper);
                lastWrapper = wrapper;
                lastDokkaiText = item.text;
            }

            item.questions.forEach((q, qIndex) => {
                globalIndex++;
                const qDiv = document.createElement('div');
                qDiv.className = 'dokkai-question-item';
                qDiv.style.marginBottom = '30px';
                qDiv.style.padding = '15px';
                qDiv.style.borderLeft = '3px solid var(--primary-color)';
                // qDiv.style.background = '#fff'; // Removed to fix white background issue

                const text = document.createElement('div');
                text.className = 'question-text';
                text.style.fontWeight = 'bold';
                text.style.marginBottom = '10px';
                text.innerHTML = `(${globalIndex}) ${q.text}`;
                qDiv.appendChild(text);

                const optGrid = document.createElement('div');
                optGrid.className = 'options-grid';
                q.options.forEach((opt, optIdx) => {
                    const btn = document.createElement('button');
                    btn.className = 'option-btn';
                    btn.innerHTML = `${optIdx + 1}. ${opt}`;

                    if (q.userAnswer === optIdx) {
                        btn.classList.add('selected');
                        // Only apply interactive feedback if NOT in Study Mode (which is now passive)
                        // Wait, if we are in Study Mode, we show answer ANYWAY.
                        // So this block is for Test Mode reviews or if we allowed interaction.

                        // If Test Mode and answered, show selection.
                        // Feedback is seemingly delayed in Test Mode.
                    }

                    btn.onclick = () => handleAnswer(q, optIdx, btn, optGrid);

                    // Study Mode: ALWAYS show correct answer and disable
                    if (isStudyMode || currentMode === 'study') {
                        btn.disabled = true;
                        if (optIdx === q.answer) btn.classList.add('correct');
                    }
                    optGrid.appendChild(btn);
                });
                qDiv.appendChild(optGrid);
                wrapper.appendChild(qDiv);
            });

        } else {
            // Render Normal Question
            globalIndex++;
            const wrapper = document.createElement('div');
            wrapper.className = 'question-block';

            const qText = item.question;
            const text = document.createElement('div');
            text.className = 'question-text';
            text.innerHTML = `(${globalIndex}) ${qText}`;
            wrapper.appendChild(text);

            const optGrid = document.createElement('div');
            optGrid.className = 'options-grid';
            item.options.forEach((opt, optIdx) => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.innerHTML = `${optIdx + 1}. ${opt}`;
                btn.onclick = () => handleAnswer(item, optIdx, btn, optGrid);
                if (currentMode === 'study') {
                    btn.disabled = true;
                    // Fix correct highlighting usage
                    let correctIdx = (typeof item.answer === 'string') ? item.options.indexOf(item.answer) : item.answer;
                    if (optIdx === correctIdx || opt === item.answer) {
                        btn.classList.add('correct');
                    }
                }
                optGrid.appendChild(btn);
            });
            wrapper.appendChild(optGrid);
            currentContainer.appendChild(wrapper);
        }
    });
}



function handleAnswer(item, selectedIdx, btn, container) {
    if (currentMode === 'study' && !isStudyMode) return; // Legacy read-only
    if (item.userAnswer !== null) return;

    // Update State
    const isFirstTime = (item.userAnswer === null);
    item.userAnswer = selectedIdx;
    if (isFirstTime) answeredCount++;

    // Clear previous
    Array.from(container.children).forEach(b => {
        b.classList.remove('selected', 'correct', 'incorrect');
    });
    btn.classList.add('selected');

    // Check correctness
    let isCorrect = false;
    let correctIdx = -1;
    if (typeof item.answer === 'number') {
        correctIdx = item.answer;
        isCorrect = (selectedIdx === correctIdx);
    } else {
        isCorrect = (item.options[selectedIdx] === item.answer);
        correctIdx = item.options.indexOf(item.answer);
    }

    // FEEDBACK STRATEGY
    // Always provide immediate feedback for all modes
    // Study Mode is handled elsewhere (read-only, pre-marked)
    // Test Mode (including Drill Test): Immediate feedback on selection

    if (isCorrect) {
        btn.classList.add('correct');
        score++;
    } else {
        btn.classList.add('incorrect');
        if (correctIdx !== -1 && container.children[correctIdx]) {
            container.children[correctIdx].classList.add('correct');
        }
    }
    // Disable siblings to prevent changing answer
    Array.from(container.children).forEach(b => b.disabled = true);

    updateProgress();
}

function exitDrill() {
    window.location.href = 'shiken_dokkai.html';
}

function updateStudyDisplay() {
    const showGoi = toggleGoi.checked;
    const showBunpo = toggleBunpoDokkai.checked;

    const goiSec = document.getElementById('section-goi');
    const bunpoSec = document.getElementById('section-bunpo-dokkai');

    if (goiSec) goiSec.style.display = showGoi ? 'block' : 'none';
    if (bunpoSec) bunpoSec.style.display = showBunpo ? 'block' : 'none';
}

function updateProgress() {
    let total = 0;
    // Calculate total questions (flatten dokkai)
    currentQuestions.forEach(q => {
        if (q.type === 'dokkai') total += q.questions.length;
        else if (q.type === 'text_dokkai') total += q.questions.length;
        else total++;
    });

    progressInfo.textContent = `${answeredCount} / ${total}`;
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeElapsed++;
        const mins = Math.floor(timeElapsed / 60).toString().padStart(2, '0');
        const secs = (timeElapsed % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${mins}:${secs}`;
    }, 1000);
}

function finishTest() {
    clearInterval(timerInterval);

    let total = 0;
    currentQuestions.forEach(q => {
        if (q.type === 'dokkai') total += q.questions.length;
        else if (q.type === 'text_dokkai') total += q.questions.length;
        else total++;
    });

    scoreDisplay.textContent = `Score: ${score} / ${total}`;
    resultModal.style.display = 'flex';
}

// ===== FURIGANA HELPER =====
(function initFuriganaHelper() {
    const popup = document.getElementById('furiganaPopup');
    const content = document.getElementById('furiganaContent');
    const headerJishoLink = document.getElementById('jishoLink');

    if (!popup) return; // Not on test page

    // Hide popup on mousedown (before new selection starts)
    document.addEventListener('mousedown', () => {
        popup.style.display = 'none';
    });

    // Hide popup on scroll
    window.addEventListener('scroll', () => {
        popup.style.display = 'none';
    }, { passive: true });

    // Fetch reading from Jisho API (using CORS proxy)
    async function fetchReading(word) {
        try {
            const jishoUrl = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(word)}`;
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(jishoUrl)}`;
            const response = await fetch(proxyUrl);
            const proxyData = await response.json();
            const data = JSON.parse(proxyData.contents);

            if (data.data && data.data.length > 0) {
                const entry = data.data[0];
                const reading = entry.japanese[0].reading || entry.japanese[0].word || word;
                const meanings = entry.senses.slice(0, 2).map(s => s.english_definitions.slice(0, 3).join(', ')).join('; ');
                return { reading, meanings };
            }
            return null;
        } catch (e) {
            console.error('Jisho API error:', e);
            return null;
        }
    }

    // Handle text selection (on mouseup)
    document.addEventListener('mouseup', async (e) => {
        // Small delay to ensure selection is complete
        setTimeout(async () => {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();

            // Only show for Japanese text (has kanji/hiragana/katakana)
            if (selectedText.length >= 1 && selectedText.length <= 30 && /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(selectedText)) {
                // Position popup near selection (fixed position, no scroll offset needed)
                const rect = selection.getRangeAt(0).getBoundingClientRect();
                popup.style.left = Math.min(rect.left, window.innerWidth - 300) + 'px';
                popup.style.top = (rect.bottom + 5) + 'px';

                // Show loading
                content.innerHTML = `<span style="color:#7c4dff; font-weight:500;">${selectedText}</span> <span style="color:#999;">...</span>`;

                // Update header Jisho link
                if (headerJishoLink) {
                    headerJishoLink.href = `https://jisho.org/search/${encodeURIComponent(selectedText)}`;
                }

                popup.style.display = 'block';

                // Fetch reading
                const result = await fetchReading(selectedText);
                if (result) {
                    content.innerHTML = `<span style="color:#7c4dff; font-weight:500;">${selectedText}</span> — <span style="color:#00897b;">${result.reading}</span><br><span style="color:#666; font-size:0.85em;">${result.meanings}</span>`;
                } else {
                    content.innerHTML = `<span style="color:#7c4dff; font-weight:500;">${selectedText}</span> <span style="color:#999;">— not found</span>`;
                }
            }
        }, 10);
    });
})();
