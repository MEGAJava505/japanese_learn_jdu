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

        // Overall Aggregate
        const allSim = [...simGoi, ...simBunpo, ...simDokkai];
        renderSection(`Simulated Shiken - Full Test (Aggregated) <span style="font-size:0.8em; color:var(--primary-color)">[Monte Carlo: ${state_questions_count()} Qs]</span>`, allSim);

        function state_questions_count() { return allSim.length; }
    }

});
