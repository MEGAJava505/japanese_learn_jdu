const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/n2questions_structured.js');
let content = fs.readFileSync(filePath, 'utf8');

function shuffle(array, originalIndex) {
    const element = array[originalIndex];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array.indexOf(element);
}

const match = content.match(/window\.n2QuestionsStructured\s*=\s*(\{[\s\S]*\});/);
if (!match) {
    console.error('No match');
    process.exit(1);
}

let data;
try {
    data = JSON.parse(match[1]);
} catch (e) {
    console.error('Parse error', e);
    process.exit(1);
}

// Iterate through all chapters in 文字・語彙
const goiData = data["文字・語彙"];
goiData.forEach((chapter, chIdx) => {
    if (chapter.usage) {
        chapter.usage.forEach((q, qIdx) => {
            if (q.options && q.options.length === 4 && q.answer === 0) {
                q.answer = shuffle(q.options, q.answer);
                console.log(`Shuffled Goi Ch${chIdx + 1} Usage Q${qIdx + 1}`);
            }
        });
    }
});

const newContent = `window.n2QuestionsStructured = ${JSON.stringify(data, null, 2)};`;
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('All Goi Usage shuffled successfully.');
