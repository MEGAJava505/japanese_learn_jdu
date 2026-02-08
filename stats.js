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
                // In counting script we established:
                // n2questions.js (vocab): 0-3 index ? Let's check. 
                // Step 2945 view_file n2questions.js: "answer": 2. options length 4. 
                // Usually these are 1-based in some raw data, but app.js treats them as indices?
                // Let's re-verify app.js handleAnswer.
                // Wait, if answer is 2, and options are [0,1,2,3], then it's 2.
                // In analyze_answers.js I used `counts[ans]++`.

                // CRITICAL: We need to know if 'ans' is 0-based or 1-based index in the raw data.
                // In n2questions.js, checking Step 2945... options are arrays.
                // If answer is 2, it points to the 3rd option?
                // Analyze_answers.js output showed distributions.

                // Let's assume the raw data is consistent 0-based index for now, 
                // except maybe some parts.
                // Actually, let's stick to what analyze_answers.js did: just count the value.
                // Most values were 0,1,2,3.

                let val = parseInt(ans);
                // Shift to 1-based for display "Option 1..4"
                // If the data is 0-3, we add 1.
                // If data is 1-4, we keep it.
                // Based on analysis output "Option 1: ...", and standard array indexing, 
                // values are likely 0-3.

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
    if (window.drillDokkaiQuestions) {
        window.drillDokkaiQuestions.forEach(b => drillQs.push(...(b.questions || [])));
    }
    renderSection("Drill Dokkai (Reading Drills)", drillQs);

    // 2. Bunpo (Grammar)
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

    // 3. Photo Dokkai
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

});
