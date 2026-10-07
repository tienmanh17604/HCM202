const fs = require('fs');
const questions = JSON.parse(fs.readFileSync('questions.json', 'utf8'));

let csv = 'Question Text,Question Type,Option 1,Option 2,Option 3,Option 4,Correct Answer,Time in seconds\n';

for (let q of questions) {
  const cleanQ = '"' + q.question.replace(/"/g, '""') + '"';
  const opt1 = '"' + q.options[0].replace(/"/g, '""') + '"';
  const opt2 = '"' + q.options[1].replace(/"/g, '""') + '"';
  const opt3 = '"' + q.options[2].replace(/"/g, '""') + '"';
  const opt4 = '"' + q.options[3].replace(/"/g, '""') + '"';
  const correctNum = q.correct + 1;
  csv += `${cleanQ},Multiple Choice,${opt1},${opt2},${opt3},${opt4},${correctNum},20\n`;
}

fs.writeFileSync('hcm202_quiz_kahoot_quizizz.csv', '\uFEFF' + csv, 'utf8');
console.log('Created hcm202_quiz_kahoot_quizizz.csv successfully!');
