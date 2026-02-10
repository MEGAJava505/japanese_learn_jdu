document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('statsContent');
    container.innerHTML = '';

    // Helper to calculate stats
    function calculateStats(questions) {
        if (!questions || questions.length === 0) return null;

        const counts = { 1: 0, 2: 0, 3: 0, 4: 0 }; // 1-based keys
        let total = 0;

        questions.forEach(q => {
            let ans = q.correct;
            if (ans === undefined) ans = q.answer;

            if (ans !== undefined && ans !== null) {
                // Convert to 1-based index if it's 0-based
                let val = parseInt(ans);

                if (val >= 0 && val <= 3) {
                    counts[val + 1]++;
                    total++;
                } else if (val >= 1 && val <= 4) {
                    counts[val]++;
                    total++;
                }
            }
        });

        return { counts, total };
    }

    function renderSection(title, questions) {
        if (!questions || questions.length === 0) return; // Skip if no questions

        const stats = calculateStats(questions);
        if (!stats) return;

        const { counts, total } = stats;

        // Find max for scaling
        const maxCount = Math.max(...Object.values(counts));

        // Find best option
        const bestOption = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

        let html = `
            <div class="stat-card">
                <div class="stat-title">${title} <span style="font-size:0.8em; font-weight:normal; color:#888">(${total} questions)</span></div>
                <div class="bar-chart">
        `;

        for (let i = 1; i <= 4; i++) {
            const count = counts[i];
            const pct = ((count / total) * 100).toFixed(1);
            const width = ((count / total) * 100).toFixed(1); // Scale relative to 100% width
            const isBest = i == bestOption;
            const fillClass = isBest ? 'bar-fill best-option' : 'bar-fill';

            html += `
                <div class="bar-row">
                    <div class="bar-label">Option ${i}</div>
                    <div class="bar-track">
                        <div class="${fillClass}" style="width: ${width}%">
                            ${count} (${pct}%)
                        </div>
                    </div>
                </div>
            `;
        }

        html += `
                </div>
                <p style="margin-top:10px; font-size:0.9em">
                    Most frequent: <strong>Option ${bestOption}</strong>
                </p>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', html);
    }

    // 1. Drill Dokkai
    const drillQs = [];
    let drillPassageCount = 0;
    if (window.drillDokkaiQuestions) {
        drillPassageCount = window.drillDokkaiQuestions.length;
        window.drillDokkaiQuestions.forEach(b => drillQs.push(...(b.questions || [])));
    }
    renderSection(`Drill Dokkai (Reading Drills) <span style="font-size:0.8em">(${drillPassageCount} Passages)</span>`, drillQs);

    // 2. Goi (Vocabulary)
    const goiQs = [];
    if (window.n2QuestionsStructured && window.n2QuestionsStructured['文字・語彙']) {
        const data = window.n2QuestionsStructured['文字・語彙'];
        if (Array.isArray(data)) {
            data.forEach(item => {
                if (Array.isArray(item)) goiQs.push(...item); // If chapter based
                else {
                    // It might be object with reading/writing keys
                    if (item.reading) goiQs.push(...item.reading);
                    if (item.writing) goiQs.push(...item.writing);
                    if (item.formation) goiQs.push(...item.formation);
                    if (item.context) goiQs.push(...item.context);
                    if (item.paraphrase) goiQs.push(...item.paraphrase);
                    if (item.usage) goiQs.push(...item.usage);
                }
            });
        }
    }
    renderSection("Goi (Vocabulary)", goiQs);

    // 3. Bunpo (Grammar)
    const bunpoQs = [];
    if (window.n2QuestionsStructured && window.n2QuestionsStructured['文法']) {
        const data = window.n2QuestionsStructured['文法'];
        if (Array.isArray(data)) {
            data.forEach(item => {
                if (Array.isArray(item)) bunpoQs.push(...item);
                else bunpoQs.push(item);
            });
        }
    }
    renderSection("Bunpo (Grammar)", bunpoQs);

    // 4. Photo Dokkai
    const photoQs = [];
    if (window.photoTests) {
        window.photoTests.forEach(pt => photoQs.push(...(pt.questions || [])));
    }
    renderSection("Photo Dokkai (Shiken)", photoQs);

    // 4. Combined Shiken Pool
    const shikenQs = [];
    if (window.n2QuestionsData) {
        if (window.n2QuestionsData['文字・語彙']) shikenQs.push(...window.n2QuestionsData['文字・語彙']);
        if (window.n2QuestionsData['文法']) shikenQs.push(...window.n2QuestionsData['文法']);
        if (window.n2QuestionsData['星問題']) shikenQs.push(...window.n2QuestionsData['星問題']);
    }
    shikenQs.push(...photoQs);
    renderSection("Shiken (Full Mock Test Pool)", shikenQs);

    // 5. Simulated Shiken (54 Tests)
    // Helper from app.js
    function classifyGoiQuestions(goiAll) {
        const buckets = { reading: [], writing: [], formation: [], context: [], paraphrase: [], usage: [] };
        goiAll.forEach(q => {
            const text = q.question;
            if (!text.includes('<u>') && !text.includes('(') && !text.includes('（')) { buckets.usage.push(q); return; }
            if (text.includes('(') || text.includes('（')) {
                const avgLen = q.options.reduce((sum, opt) => sum + opt.length, 0) / q.options.length;
                if (avgLen <= 2.2) buckets.formation.push(q);
                else buckets.context.push(q);
                return;
            }
            if (text.includes('<u>')) {
                const optionsAreKana = q.options.every(opt => /^[\u3040-\u309f\u30a0-\u30ff\u30fc]+$/.test(opt));
                const match = text.match(/<u>(.*?)<\/u>/);
                const content = match ? match[1] : '';
                const isTargetKana = /^[\u3040-\u309f\u30a0-\u30ff\u30fc]+$/.test(content);
                if (optionsAreKana) buckets.reading.push(q);
                else if (isTargetKana) buckets.writing.push(q);
                else buckets.paraphrase.push(q);
            } else { buckets.context.push(q); }
        });
        return buckets;
    }

    const QUESTIONS_PER_TYPE = { reading: 5, writing: 5, formation: 5, context: 7, paraphrase: 5, usage: 5 };

    if (window.n2QuestionsData) {
        const goiAll = window.n2QuestionsData['文字・語彙'] || [];
        const bunpoAll = window.n2QuestionsData['文法'] || [];
        const starAll = window.n2QuestionsData['星問題'] || [];
        const photoTests = window.photoTests || [];

        const buckets = classifyGoiQuestions(goiAll);

        let simGoi = [];
        let simBunpo = [];
        let simDokkai = [];
        const NUM_TESTS = 1000; // 1000 iterations for accurate Monte Carlo simulation

        for (let t = 0; t < NUM_TESTS; t++) {
            // GOI (Questions 1-32)
            Object.keys(buckets).forEach(type => {
                const count = QUESTIONS_PER_TYPE[type] || 5;
                const randomSet = buckets[type].sort(() => 0.5 - Math.random()).slice(0, count);
                simGoi.push(...randomSet);
            });

            // BUNPO (Questions 33-49)
            // Mondai 7: Normal Grammar (12 Qs)
            const mondai7 = bunpoAll.sort(() => 0.5 - Math.random()).slice(0, 12);
            simBunpo.push(...mondai7);

            // Mondai 8: Star Questions (5 Qs)
            const mondai8 = starAll.sort(() => 0.5 - Math.random()).slice(0, 5);
            simBunpo.push(...mondai8);

            // DOKKAI (Questions 50-54)
            if (photoTests.length > 0) {
                const r = Math.floor(Math.random() * photoTests.length);
                const d = photoTests[r];
                if (d && d.questions) {
                    simDokkai.push(...d.questions);
                }
            }
        }

        // Render aggregated and split sections
        renderSection(`Simulated Shiken - Goi Part (Q1-32) <span style="font-size:0.8em">[${simGoi.length} Qs]</span>`, simGoi);
        renderSection(`Simulated Shiken - Bunpo Part (Q33-49) <span style="font-size:0.8em">[${simBunpo.length} Qs]</span>`, simBunpo);
        renderSection(`Simulated Shiken - Dokkai Part (Q50-54) <span style="font-size:0.8em">[${simDokkai.length} Qs]</span>`, simDokkai);

        // No Photo Dokkai Aggregate (Q1-49)
        const noPhotoSim = [...simGoi, ...simBunpo];
        renderSection(`Simulated Shiken - No Photo Dokkai (Q1-49) <span style="font-size:0.8em; color:var(--secondary-color)">[Monte Carlo: ${noPhotoSim.length} Qs]</span>`, noPhotoSim);

        // Overall Aggregate
        const allSim = [...simGoi, ...simBunpo, ...simDokkai];
        renderSection(`Simulated Shiken - Full Test (Aggregated) <span style="font-size:0.8em; color:var(--primary-color)">[Monte Carlo: ${state_questions_count()} Qs]</span>`, allSim);

        function state_questions_count() { return allSim.length; }
    }

    // 6. Detailed Photo Dokkai Analysis (Q50 - Q54)
    function analyzePhotoDokkai() {
        if (!window.photoTests || window.photoTests.length === 0) return;

        // Data structure: 5 questions (index 0-4 corresponding to Q50-Q54)
        // Each has counts for options 1-4
        const questionStats = Array(5).fill(null).map(() => ({ 1: 0, 2: 0, 3: 0, 4: 0, total: 0 }));

        window.photoTests.forEach(test => {
            if (!test.questions) return;
            test.questions.forEach((q, idx) => {
                if (idx >= 5) return; // Only first 5 questions (50-54)

                let ans = q.correct;
                // Convert 0-based index to 1-based option
                if (ans >= 0 && ans <= 3) ans += 1;

                if (ans >= 1 && ans <= 4) {
                    questionStats[idx][ans]++;
                    questionStats[idx].total++;
                }
            });
        });

        // Render container
        let html = `
            <div class="stat-card" style="border-left: 5px solid #9C27B0;">
                <div class="stat-title" style="color: #9C27B0;">Photo Dokkai: Question Breakdown (Q50 - Q54)</div>
                <p style="margin-bottom: 20px; color: var(--text-secondary);">Analysis of the most frequent correct option for each specific question number across all 15 chapters.</p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
        `;

        const questionLabels = ["Q50", "Q51", "Q52", "Q53", "Q54"];

        questionStats.forEach((stats, idx) => {
            const label = questionLabels[idx];
            const total = stats.total;
            const maxCount = Math.max(...Object.values(stats).slice(0, 4)); // Only check option counts

            // Find best option
            let bestOption = 1;
            let maxVal = 0;
            for (let i = 1; i <= 4; i++) {
                if (stats[i] > maxVal) { maxVal = stats[i]; bestOption = i; }
            }

            html += `
                <div style="background: var(--bg-color); padding: 15px; border-radius: 8px;">
                    <h4 style="margin: 0 0 10px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
                        ${label} <span style="font-weight: normal; font-size: 0.8em; color: #888">(${total} samples)</span>
                    </h4>
            `;

            for (let i = 1; i <= 4; i++) {
                const count = stats[i];
                const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
                const width = total > 0 ? ((count / total) * 100) : 0;

                let color = '#ccc';
                let fontWeight = 'normal';

                if (count > 0 && count === maxVal) {
                    color = '#4CAF50'; // Green for most frequent
                    fontWeight = 'bold';
                } else if (count > 0) {
                    color = '#2196F3'; // Blue for presence
                }

                html += `
                    <div style="display: flex; align-items: center; margin-bottom: 6px; font-size: 0.9em;">
                        <span style="width: 20px; font-weight: bold; color: #666;">${i}</span>
                        <div style="flex-grow: 1; background: #e0e0e0; height: 16px; border-radius: 4px; overflow: hidden;">
                            <div style="width: ${width}%; background: ${color}; height: 100%;"></div>
                        </div>
                        <span style="width: 35px; text-align: right; margin-left: 5px; font-weight: ${fontWeight};">${count}</span>
                    </div>
                `;
            }

            html += `
                <div style="margin-top: 5px; font-size: 0.85em; text-align: right; color: var(--text-secondary);">
                    Most frequent: <strong>Option ${bestOption}</strong>
                </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', html);
    }

    analyzePhotoDokkai();

});
