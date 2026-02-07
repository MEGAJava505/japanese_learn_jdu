const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '../drill_dokais');
const outputFile = path.join(__dirname, '../data/drill_dokkai.js');

function parseFile(content, title) {
    const questions = [];
    let currentItem = null;
    let currentQuestion = null;

    // Split by lines
    const lines = content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        // Check for New Item (Passage) start: "1番"
        const itemMatch = line.match(/^(\d+)番\s*$/);
        if (itemMatch) {
            // Save previous item
            if (currentItem) {
                if (currentQuestion) {
                    currentItem.questions.push(currentQuestion);
                    currentQuestion = null;
                }
                questions.push(currentItem);
            }

            // Start new item
            currentQuestion = null;
            currentItem = {
                id: `${title}_${itemMatch[1]}`,
                type: 'text_dokkai',
                title: title,
                number: parseInt(itemMatch[1]),
                text: '',
                questions: []
            };
            continue;
        }

        // Check for Question start: "問" or "問1" (but NOT "問題")
        // Regex: Starts with Question char, followed by optional digits, then optional space/text.
        // We ensure that if there are no digits, the next char is NOT a non-space char (like 題).
        const questionMatch = line.match(/^問(\d*)([\s　].*)?$/);
        if (questionMatch) {
            // Save previous question
            if (currentQuestion) {
                currentItem.questions.push(currentQuestion);
            }

            // Start new question
            currentQuestion = {
                text: questionMatch[2] ? questionMatch[2].trim() : '',
                options: [],
                correct: -1
            };
            continue;
        }

        // Check for Separator Line (e.g. ――――――――――――――――――)
        // This is used in Chapter 6 to separate Questions (first) from Passage (second).
        // If found, we should close the current question so subsequent text goes to item.text
        if (line.match(/^―+$/)) {
            if (currentQuestion) {
                currentItem.questions.push(currentQuestion);
                currentQuestion = null;
            }
            continue;
        }

        // Check for Options: "1.", "1．", "1 ", "1　", "+2."
        const optionMatch = line.match(/^(\+)?\s*(\d+)(?:[\.．]|\s|　)\s*(.*)$/);
        if (optionMatch) {
            if (!currentQuestion) {
                console.warn(`Warning: Option found without question in ${title}: ${line}`);
                continue;
            }

            const isCorrect = optionMatch[1] === '+';
            const optText = optionMatch[3];

            currentQuestion.options.push(optText);
            if (isCorrect) {
                // 0-based index
                currentQuestion.correct = currentQuestion.options.length - 1;
            }
            continue;
        }

        // Accumulate text
        if (currentQuestion) {
            // If inside a question, it's question text (unless options started)
            // Use a flag? Or just check if options have started?
            if (currentQuestion.options.length > 0) {
                // Continuation of last option
                currentQuestion.options[currentQuestion.options.length - 1] += ' ' + line;
            } else {
                // Continuation of question text
                currentQuestion.text += (currentQuestion.text ? '\n' : '') + line;
            }
        } else if (currentItem) {
            // Inside an item but not a question -> Passasge text
            currentItem.text += (currentItem.text ? '\n' : '') + line;
        }
    }

    // Final save
    if (currentItem) {
        if (currentQuestion) {
            currentItem.questions.push(currentQuestion);
        }
        questions.push(currentItem);
    }

    return questions;
}

// Main execution
try {
    if (!fs.existsSync(inputDir)) {
        console.error(`Directory not found: ${inputDir}`);
        process.exit(1);
    }

    const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.txt'));
    let allData = [];

    files.forEach(file => {
        const filePath = path.join(inputDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const title = file.replace('.txt', '');
        console.log(`Parsing ${file}...`);
        const items = parseFile(content, title);
        allData = allData.concat(items);
    });

    console.log(`Total parsed items: ${allData.length}`);

    const outputContent = `const drillDokkaiQuestions = ${JSON.stringify(allData, null, 2)};\n`;
    fs.writeFileSync(outputFile, outputContent);
    console.log(`Saved to ${outputFile}`);
} catch (err) {
    console.error(err);
}
