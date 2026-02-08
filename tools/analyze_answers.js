const fs = require('fs');
const path = require('path');

// Mock window globally
global.window = {};

// Helper to write log
function log(msg) {
    fs.appendFileSync(path.join(__dirname, '../analysis_results.txt'), msg + '\n', 'utf8');
}

// Reset log file
fs.writeFileSync(path.join(__dirname, '../analysis_results.txt'), '', 'utf8');

// Load Data Files with Error Handling
function loadScript(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        // Simple eval in global scope if possible, or just eval
        // We replace 'const textDokkaiQuestions' might be an issue if it's not on window
        // Let's check drill_dokkai.js content logic. 
        // It says "window.drillDokkaiQuestions = ..." in my previous view_file, 
        // wait, let me check view_file of drill_dokkai.js again.
        // Step 2944: "window.drillDokkaiQuestions = ["
        // So it should be fine.

        eval(content);
        log(`Loaded ${path.basename(filePath)}`);
    } catch (e) {
        log(`Error loading ${path.basename(filePath)}: ${e.message}`);
    }
}

// Helper to count answers
function countAnswers(questions, label) {
    const counts = { 0: 0, 1: 0, 2: 0, 3: 0 };
    let total = 0;

    if (!questions || questions.length === 0) {
        log(`\n--- ${label} ---`);
        log("No questions found.");
        return;
    }

    questions.forEach(q => {
        let ans = q.correct;
        if (ans === undefined) ans = q.answer;

        if (ans !== undefined && ans !== null) {
            // Ensure ans is an integer
            ans = parseInt(ans);
            if (counts[ans] !== undefined) {
                counts[ans]++;
                total++;
            }
        }
    });

    log(`\n--- ${label} ---`);
    log(`Total Questions: ${total}`);
    if (total > 0) {
        for (let i = 0; i < 4; i++) {
            const pct = ((counts[i] / total) * 100).toFixed(2);
            log(`Option ${i + 1}: ${counts[i]} (${pct}%)`);
        }

        const max = Math.max(...Object.values(counts));
        const maxIndices = Object.keys(counts).filter(k => counts[k] === max).map(k => parseInt(k) + 1);
        log(`Most Frequent: Option ${maxIndices.join(', ')}`);
    }
}

// Execute Loading
loadScript(path.join(__dirname, '../data/n2questions.js'));
loadScript(path.join(__dirname, '../data/n2questions_structured.js'));
loadScript(path.join(__dirname, '../data/drill_dokkai.js'));
loadScript(path.join(__dirname, '../data/n2dokkai_script.js'));

// 1. Drill Dokkai
const drillQs = [];
if (window.drillDokkaiQuestions) {
    window.drillDokkaiQuestions.forEach(block => {
        if (block.questions) {
            drillQs.push(...block.questions);
        }
    });
} else if (window.textDokkaiQuestions) {
    // Fallback if variable name changed
    window.textDokkaiQuestions.forEach(block => {
        if (block.questions) {
            drillQs.push(...block.questions);
        }
    });
}
countAnswers(drillQs, "Drill Dokkai");

// 2. Bunpo + Dokkai (Grammar Section)
const bunpoQs = [];
if (window.n2QuestionsStructured && window.n2QuestionsStructured['文法']) {
    const grammarData = window.n2QuestionsStructured['文法'];
    if (Array.isArray(grammarData)) {
        grammarData.forEach(item => {
            if (Array.isArray(item)) {
                bunpoQs.push(...item);
            } else {
                bunpoQs.push(item);
            }
        });
    }
}
countAnswers(bunpoQs, "Bunpo (Grammar Section from Structured)");

// Check for Structured Dokkai
const strucDokkaiQs = [];
if (window.n2QuestionsStructured && window.n2QuestionsStructured['読解']) {
    const dData = window.n2QuestionsStructured['読解'];
    if (Array.isArray(dData)) {
        dData.forEach(item => {
            if (Array.isArray(item)) {
                strucDokkaiQs.push(...item);
            } else {
                strucDokkaiQs.push(item);
            }
        });
    }
}
countAnswers(strucDokkaiQs, "Bunpo + Dokkai (Dokkai Section from Structured)");

// Photo Dokkai (Distinct)
const photoQs = [];
if (window.photoTests) {
    window.photoTests.forEach(pt => {
        if (pt.questions) photoQs.push(...pt.questions);
    });
}
countAnswers(photoQs, "Photo Dokkai (Shiken/Random)");

// 3. Shiken (Mock Test Pool)
const shikenQs = [];
if (window.n2QuestionsData) {
    if (window.n2QuestionsData['文字・語彙']) shikenQs.push(...window.n2QuestionsData['文字・語彙']);
    if (window.n2QuestionsData['文法']) shikenQs.push(...window.n2QuestionsData['文法']);
    if (window.n2QuestionsData['星問題']) shikenQs.push(...window.n2QuestionsData['星問題']);
}
// Add Photo Tests to Shiken pool as well
if (window.photoTests) {
    window.photoTests.forEach(pt => {
        if (pt.questions) shikenQs.push(...pt.questions);
    });
}
countAnswers(shikenQs, "Shiken (Mock Test Pool - All Types)");
