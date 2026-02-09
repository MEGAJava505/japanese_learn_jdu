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

// DOM Elements (initialized in DOMContentLoaded)
let questionList, testTitle, timerDisplay, progressInfo, finishBtn, resultModal, scoreDisplay, studyControls, toggleGoi, toggleBunpoDokkai;

// Constants
const QUESTIONS_PER_CHAPTER_GOI = 35; // Approx
const QUESTIONS_PER_CHAPTER_BUNPO = 32; // Increased from 25

// SECRET TOKEN OBFUSCATION
// Token check removed by user request

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize DOM Elements
    questionList = document.getElementById('questionList');
    testTitle = document.getElementById('testTitle');
    timerDisplay = document.getElementById('timerDisplay');
    progressInfo = document.getElementById('progressInfo');
    finishBtn = document.getElementById('finishBtn');
    resultModal = document.getElementById('resultModal');
    scoreDisplay = document.getElementById('scoreDisplay');
    studyControls = document.getElementById('studyControls');
    toggleGoi = document.getElementById('toggleGoi');
    toggleBunpoDokkai = document.getElementById('toggleBunpoDokkai');

    // Check if we are on the test page
    if (!questionList) {
        // Not on test page (e.g. index.html)
        // Theme logic is handled separately or by common code above
        return;
    }

    // Parse URL params
    const urlParams = new URLSearchParams(window.location.search);
    currentMode = urlParams.get('mode') || 'combined';

    const chParam = urlParams.get('chapter');
    currentChapter = (chParam === 'random' || chParam === 'full') ? chParam : (parseInt(chParam) || 1);

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
    if (finishBtn) finishBtn.addEventListener('click', finishTest);

    // Re-query elements to ensure they exist (though we just did)
    // Actually, toggleGoi / Bunpo might be null if not study mode or not present
    if (toggleGoi) {
        toggleGoi.addEventListener('change', () => {
            updateStudyDisplay();
        });
    }
    if (toggleBunpoDokkai) {
        toggleBunpoDokkai.addEventListener('change', () => {
            updateStudyDisplay();
        });
    }

    // Timer
    startTimer();
});

async function loadData() {
    // Data is loaded via <script> tags in test.html
    // Check global window object first, then fallback to local scope check
    if (typeof window.n2QuestionsData !== 'undefined') {
        n2Data = window.n2QuestionsData;
    } else if (typeof n2QuestionsData !== 'undefined') {
        n2Data = n2QuestionsData;
    } else {
        console.error("n2QuestionsData is undefined. Check if n2questions.js is loaded correctly.");
        if (questionList) {
            questionList.innerHTML = `<p style="color: var(--error-color)">Error loading data. n2questions.js not found.</p>`;
        }
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

    // NEW: Chapter Selector Logic (Global for Study & Combined)
    const chapterSelectWrapper = document.querySelector('.chapter-selector-wrapper');
    const chapterSelect = document.getElementById('chapterSelect');

    if (chapterSelect && chapterSelectWrapper) {
        if (currentMode === 'study' || currentMode === 'combined') {
            chapterSelectWrapper.style.display = 'flex'; // Ensure visible
            chapterSelect.innerHTML = '';

            // "Random" Option - ONLY for Study Mode
            if (currentMode === 'study') {
                const randOpt = document.createElement('option');
                randOpt.value = 'random';
                randOpt.textContent = 'Random';
                if (currentChapter === 'random') randOpt.selected = true;
                chapterSelect.appendChild(randOpt);
            }

            // Chapters 1-15
            for (let i = 1; i <= 15; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `第${i}回`;
                if (parseInt(currentChapter) === i) {
                    option.selected = true;
                }
                chapterSelect.appendChild(option);
            }
        } else {
            // Hide for other modes
            chapterSelectWrapper.style.display = 'none';
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

        // Scroll to Top Button
        createScrollTopBtn();
    }



    // Render
    renderQuestions();

    // Initial study display update
    if (isStudyMode && currentMode === 'study') {
        updateStudyDisplay();
    }

    updateProgress();
}

// Update display based on study mode checkbox toggles
function updateStudyDisplay() {
    const tGoi = document.getElementById('toggleGoi');
    const tBunpo = document.getElementById('toggleBunpoDokkai');

    if (!tGoi || !tBunpo) return;

    const showGoi = tGoi.checked;
    const showBunpoDokkai = tBunpo.checked;

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
            section.style.display = showGoi ? 'block' : 'none';
        } else if (isBunpoDokkai && !isGoi) {
            section.style.display = showBunpoDokkai ? 'block' : 'none';
        }
    });

    // Also hide/show dokkai wrappers (extra safety)
    const dokkaiWrappers = document.querySelectorAll('.dokkai-wrapper');
    dokkaiWrappers.forEach(wrapper => {
        // If wrapper is NOT inside a hidden section, we might need to toggle it manually?
        // Actually, if the section is hidden, the wrapper is hidden.
        // But if the wrapper is standalone (legacy?), toggle it.
        // Generally safe to toggle based on BunpoDokkai flag if it's a dokkai wrapper.
        if (wrapper.closest('.section-block')) return; // handled by section
        wrapper.style.display = showBunpoDokkai ? '' : 'none';
    });

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
    if (!n2Data) return [];
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
    // --- GOI Mode ---
    if (mode === 'goi' || mode === 'combined' || mode === 'study' || mode === 'shiken') {
        const goiStructured = (window.n2QuestionsStructured) ? window.n2QuestionsStructured['文字・語彙'] : [];
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
            if (goiStructured && goiStructured.length > 0) {
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
        const bunpoStructured = (window.n2QuestionsStructured) ? window.n2QuestionsStructured['文法'] : [];
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
            if (window.photoTests && window.photoTests.length > 0) {
                // Get 1 random index
                const r = Math.floor(Math.random() * window.photoTests.length);
                const d = window.photoTests[r];
                questions.push({
                    type: 'dokkai',
                    image: d.image.replace('./dokkai_photo', 'data/dokkai_photo'),
                    questions: d.questions.map((q, i) => ({ ...q, id: `dokkai_${r}_${i}` }))
                });
            }

        } else {
            // ... existing chapter logic ...
            if (bunpoStructured && bunpoStructured.length > 0) {
                const chQuestions = bunpoStructured[chapter - 1] || [];
                questions.push(...chQuestions.map((q, i) => formatQ(q, 'bunpo', i)));
            } else {
                // Fallback
            }

            // Add Dokkai (photoTests) for bunpo_dokkai, combined, and study modes
            if ((mode === 'bunpo_dokkai' || mode === 'combined' || mode === 'study') && window.photoTests && window.photoTests.length > 0) {
                // Get dokkai for current chapter (1-based index)
                const chapterIndex = parseInt(chapter) - 1;
                if (window.photoTests[chapterIndex]) {
                    const d = window.photoTests[chapterIndex];
                    questions.push({
                        type: 'dokkai',
                        image: d.image.replace('./dokkai_photo', 'data/dokkai_photo'),
                        questions: d.questions.map((q, i) => ({
                            ...q,
                            id: `dokkai_${chapterIndex}_${i}`,
                            userAnswer: null, // Critical for clickability
                            answer: q.correct // Normalize key
                        }))
                    });
                }
            }
        }
    }

    if (mode === 'dokkai_drill') {
        const textDokkai = (window.drillDokkaiQuestions) ? window.drillDokkaiQuestions : [];

        let filtered = [];
        if (chapter === 'full') {
            // Full Test: Group by difficulty, shuffle within groups, concatenate
            const easy = textDokkai.filter(item => item.title.startsWith('1 ') || item.title.startsWith('2 '));
            const medium = textDokkai.filter(item => item.title.startsWith('3 ') || item.title.startsWith('4 '));
            const hard = textDokkai.filter(item => item.title.startsWith('5 '));
            const table = textDokkai.filter(item => item.title.startsWith('6 '));

            // Shuffle each group
            const shuffle = arr => [...arr].sort(() => 0.5 - Math.random());
            filtered = [...shuffle(easy), ...shuffle(medium), ...shuffle(hard), ...shuffle(table)];
        } else if (chapter === 'random') {
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

    // Photo Dokkai mode (15 photo-based dokkai tests)
    if (mode === 'photo_dokkai') {
        const photoTests = window.photoTests || [];

        if (chapter === 'full') {
            // All 15 photo dokkai
            photoTests.forEach((d, idx) => {
                questions.push({
                    type: 'dokkai',
                    title: `第${idx + 1}回`, // Add Chapter Title
                    image: d.image.replace('./dokkai_photo', 'data/dokkai_photo'),
                    questions: d.questions.map((q, qIdx) => ({
                        ...q,
                        id: `photo_dokkai_${idx}_${qIdx}`,
                        userAnswer: null,
                        answer: q.correct
                    }))
                });
            });
        }
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
    // Only start at 32 if we are NOT showing Goi questions (otherwise Goi would start at 33)
    const hasGoi = currentQuestions.some(q => q.type === 'goi');
    const hasBunpo = currentQuestions.some(q => q.type === 'bunpo');

    if ((currentMode === 'bunpo_dokkai' || currentMode === 'study') && !hasGoi && hasBunpo) {
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
            if (item.title) {
                // Specific title (e.g. 第1回 for Photo Dokkai)
                sectionIdentifier = `dokkai_${item.title}`;
                if (lastSectionType !== sectionIdentifier) {
                    headerText = item.title;
                }
            } else {
                sectionIdentifier = 'dokkai_section';
                if (lastSectionType !== sectionIdentifier) {
                    headerText = '読解 (Reading Comprehension)';
                }
            }
        } else if (item.type === 'text_dokkai') {
            sectionIdentifier = `text_dokkai_${item.title}`;
            // Don't show category headers in Full Test mode (chapter === 'full')
            if (lastSectionType !== sectionIdentifier && currentChapter !== 'full') {
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
                    if (isStudyMode || currentMode === 'study') {
                        // Modified for Text Zoom: Don't disable, make clickable
                        btn.classList.add('study-option');
                        btn.onclick = (e) => {
                            e.stopPropagation();
                            showTextZoom(btn); // Pass btn element
                        };
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

                // Add click-to-zoom functionality
                // Disabled per user request (Main text should not zoom)


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

                    // Add selection check to onclick handlers
                    btn.onclick = (e) => {
                        if (q.userAnswer != null) return; // Prevent changing answer if already selected
                        handleAnswer(q, optIdx, btn, optGrid);
                    };

                    // Study Mode: Interactive Zoom (don't disable)
                    if (isStudyMode || currentMode === 'study') {
                        // btn.disabled = true; // REMOVED to allow click-to-zoom
                        btn.classList.add('study-option');
                        btn.onclick = (e) => {
                            e.stopPropagation();
                            showTextZoom(btn);
                        };
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
                if (isStudyMode || currentMode === 'study') {
                    // Modified for Text Zoom
                    btn.classList.add('study-option');
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        showTextZoom(btn); // Pass btn element
                    };
                    // Fix correct highlighting usage
                    const actualAnswer = (item.answer !== undefined) ? item.answer : item.correct;
                    let correctIdx = (typeof actualAnswer === 'number') ? actualAnswer : item.options.indexOf(actualAnswer);

                    if (optIdx === correctIdx) {
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
    if (item.userAnswer != null) return; // Use loose inequality to catch undefined

    // Update State
    const isFirstTime = (item.userAnswer == null);
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

    // Support both 'answer' and 'correct' keys
    const actualAnswer = (item.answer !== undefined) ? item.answer : item.correct;

    if (typeof actualAnswer === 'number') {
        correctIdx = actualAnswer;
        isCorrect = (selectedIdx === correctIdx);
    } else {
        isCorrect = (item.options[selectedIdx] === actualAnswer);
        correctIdx = item.options.indexOf(actualAnswer);
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




function updateProgress() {
    // Hide progress in Study Mode as per user request
    if (isStudyMode) {
        if (progressInfo) progressInfo.style.display = 'none';
        return;
    } else {
        if (progressInfo) progressInfo.style.display = 'block'; // Ensure visible otherwise
    }

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
    let wrongAnswers = [];

    currentQuestions.forEach(q => {
        if (q.type === 'dokkai') {
            total += q.questions.length;
        } else if (q.type === 'text_dokkai') {
            total += q.questions.length;
            // Collect wrong answers for review
            q.questions.forEach((subQ, idx) => {
                if (subQ.userAnswer !== null && subQ.userAnswer !== subQ.correct) {
                    wrongAnswers.push({
                        passage: q,
                        questionIndex: idx,
                        question: subQ
                    });
                }
            });
        } else {
            total++;
        }
    });

    // Full Test mode: Show review if there are errors
    if (currentMode === 'dokkai_drill' && currentChapter === 'full' && wrongAnswers.length > 0) {
        showFullTestReview(wrongAnswers, score, total);
        return;
    }

    scoreDisplay.textContent = `Score: ${score} / ${total}`;
    resultModal.style.display = 'flex';
}

// Show error review screen for Full Test mode
function showFullTestReview(wrongAnswers, finalScore, totalQuestions) {
    // Hide normal result modal
    resultModal.style.display = 'none';

    // Create review container
    const reviewContainer = document.createElement('div');
    reviewContainer.id = 'fullTestReview';
    reviewContainer.className = 'review-container';
    reviewContainer.innerHTML = `
        <div class="review-header">
            <h2>結果: ${finalScore} / ${totalQuestions}</h2>
            <p>間違えた問題 (${wrongAnswers.length}問)</p>
            <button onclick="exitDrill()" class="exit-btn" style="margin-top: 10px;">戻る (Back)</button>
        </div>
        <div class="review-questions"></div>
    `;

    const questionsDiv = reviewContainer.querySelector('.review-questions');

    // Group by passage
    const passageMap = new Map();
    wrongAnswers.forEach(item => {
        const passageId = item.passage.id;
        if (!passageMap.has(passageId)) {
            passageMap.set(passageId, { passage: item.passage, questions: [] });
        }
        passageMap.get(passageId).questions.push(item);
    });

    // Render each passage with wrong questions
    passageMap.forEach(({ passage, questions }) => {
        const passageDiv = document.createElement('div');
        passageDiv.className = 'review-passage';

        // Passage text
        let textHtml = passage.text.replace(/\n/g, '<br>');
        textHtml = textHtml.replace(/（注\d+）/g, '<span class="annotation">$&</span>');
        textHtml = textHtml.replace(/「([^」]+)」/g, '<span class="quoted">「$1」</span>');

        passageDiv.innerHTML = `
            <h3 class="review-passage-title">${passage.title}</h3>
            <div class="review-passage-text">${textHtml}</div>
            <div class="review-options-list"></div>
        `;

        const optionsList = passageDiv.querySelector('.review-options-list');

        questions.forEach(item => {
            const q = item.question;
            const qDiv = document.createElement('div');
            qDiv.className = 'review-question-item';
            qDiv.innerHTML = `<p class="review-question-text">${q.text}</p>`;

            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'review-options';
            q.options.forEach((opt, idx) => {
                const optBtn = document.createElement('div');
                optBtn.className = 'review-option';
                optBtn.textContent = `${idx + 1}. ${opt}`;

                // Highlight correct answer in green
                if (idx === q.correct) {
                    optBtn.classList.add('review-correct');
                }
                // Highlight user's wrong answer in red
                if (idx === q.userAnswer && q.userAnswer !== q.correct) {
                    optBtn.classList.add('review-incorrect');
                }

                optionsDiv.appendChild(optBtn);
            });
            qDiv.appendChild(optionsDiv);
            optionsList.appendChild(qDiv);
        });

        questionsDiv.appendChild(passageDiv);
    });

    // Clear main content and show review
    questionList.innerHTML = '';
    questionList.appendChild(reviewContainer);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

// Text Zoom Helpers (Inline)
async function showTextZoom(element) {
    // Close any other zoomed elements first
    const currentZoomed = document.querySelector('.zoomed-text');
    if (currentZoomed && currentZoomed !== element) {
        closeZoom(currentZoomed);
    }

    const isZoomed = element.classList.toggle('zoomed-text');

    // Create overlay if not exists - REMOVED per user request
    /*
    let overlay = document.getElementById('zoomOverlay');
    if (!overlay) { ... }
    */

    if (isZoomed) {
        // overlay.style.display = 'block';

        // Instructions for Furigana (Generic for all zoomed items)
        /* REMOVED per user request
        if (!element.querySelector('.zoom-instructions')) {
             ...
        }
        */

        // Add click-outside listener to close
        const clickOutsideHandler = (e) => {
            if (!element.contains(e.target) && !e.target.closest('#furiganaPopover')) {
                closeZoom(element);
                document.removeEventListener('mousedown', clickOutsideHandler);
            }
        };
        // Delay adding listener to avoid immediate close
        setTimeout(() => {
            document.addEventListener('mousedown', clickOutsideHandler);
        }, 50);

        // Add selection listener for Furigana (works for both Text and Options)
        element.onmouseup = async (e) => {
            const selection = window.getSelection().toString().trim();
            if (selection && selection.length > 0 && selection.length < 20) {
                // Show popover
                showFuriganaPopover(selection, e.clientX, e.clientY);
                e.stopPropagation(); // Prevent other clicks
            }
        };

        // Styling for "In-Place" Zoom: Scale only, no fixed position
        element.style.position = 'relative';
        element.style.zIndex = '100';
        element.style.transform = 'scale(1.05)'; // Slight increase
        element.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
        element.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
        element.style.cursor = 'text';
        // Ensure background is solid
        element.style.background = 'var(--surface-color)';
        element.style.borderRadius = '8px';
        element.style.border = '1px solid var(--primary-color)';

        // Default logic for buttons (Options)
        if (!element.querySelector('.furigana-info')) {
            let text = element.textContent.trim();
            text = text.replace(/^\d+\.\s*/, '');

            // Limit length for API safety
            if (text.length > 30) return;

            const result = await fetchReading(text);
            if (result) {
                const infoDiv = document.createElement('div');
                infoDiv.className = 'furigana-info';

                const readingDiv = document.createElement('div');
                readingDiv.className = 'furigana-reading';
                readingDiv.textContent = result.reading;

                const meaningDiv = document.createElement('div');
                meaningDiv.className = 'furigana-meaning';
                meaningDiv.textContent = result.meanings;

                infoDiv.appendChild(readingDiv);
                infoDiv.appendChild(meaningDiv);

                element.appendChild(infoDiv);
            }
        }
    } else {
        closeZoom(element);
    }
}

function closeZoom(element) {
    element.classList.remove('zoomed-text');
    element.style.position = '';
    element.style.top = '';
    element.style.left = '';
    element.style.transform = '';
    element.style.zIndex = '';
    element.style.width = '';
    element.style.maxWidth = '';
    element.style.maxHeight = '';
    element.style.overflowY = '';
    element.style.background = '';
    element.style.padding = '';
    element.style.boxShadow = '';
    element.style.border = '';
    element.style.borderRadius = '';
    element.style.cursor = ''; // Reset cursor
    element.style.transition = ''; // Reset transition
    element.onmouseup = null;

    // Also remove the Furigana Info if it was auto-added (for buttons)
    const info = element.querySelector('.furigana-info');
    if (info) info.remove();
}

// Helper for Furigana Popover
async function showFuriganaPopover(text, x, y) {
    let popover = document.getElementById('furiganaPopover');
    if (!popover) {
        popover = document.createElement('div');
        popover.id = 'furiganaPopover';
        popover.style.position = 'fixed';
        popover.style.background = 'var(--surface-color)';
        popover.style.border = '1px solid var(--primary-color)';
        popover.style.padding = '10px';
        popover.style.borderRadius = '8px';
        popover.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        popover.style.zIndex = '1001';
        popover.style.maxWidth = '300px';
        document.body.appendChild(popover);

        // Close on click outside
        document.addEventListener('mousedown', (e) => {
            if (popover.style.display === 'block' && !popover.contains(e.target)) {
                popover.style.display = 'none';
            }
        });
    }

    popover.innerHTML = '<div style="text-align:center;">Loading...</div>';
    popover.style.left = `${x}px`;
    popover.style.top = `${y + 15}px`;
    popover.style.display = 'block';

    const result = await fetchReading(text);
    if (result) {
        popover.innerHTML = `
            <div style="color:var(--primary-color); font-weight:bold; font-size:1.2em; margin-bottom:4px;">${result.reading}</div>
            <div style="font-size:0.9em; line-height:1.4;">${result.meanings}</div>
        `;
    } else {
        popover.innerHTML = '<div style="color:var(--error-color);">No definition found</div>';
    }
}

// Global Jisho API Fetcher
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

// Function to handle chapter change in Study Mode
function changeChapter(newChapter) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('chapter', newChapter);
    // Keep mode as study
    if (!urlParams.get('mode')) urlParams.set('mode', 'study');
    window.location.search = urlParams.toString();
}

function createScrollTopBtn() {
    if (document.getElementById('scrollTopBtn')) return; // Avoid duplicates

    const btn = document.createElement('button');
    btn.id = 'scrollTopBtn';
    btn.className = 'scroll-top-btn';
    btn.innerHTML = '&uarr;'; // Up arrow
    btn.title = 'Scroll to Top (上へ)';

    // Add accessibility
    btn.setAttribute('aria-label', 'Scroll to Top');

    // Scroll event listener
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    // Click event
    btn.onclick = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    document.body.appendChild(btn);
}

