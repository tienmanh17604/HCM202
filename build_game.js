const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('questions.json', 'utf8'));

// Sample 60 Vietnamese student names with realistic MSSVs for simulation & test
const simulatedStudents = [
  { name: "Nguyễn Văn An", mssv: "SE170123" },
  { name: "Trần Thị Mai", mssv: "HE180456" },
  { name: "Lê Hoàng Long", mssv: "SE172345" },
  { name: "Phạm Minh Đức", mssv: "IA180789" },
  { name: "Vũ Phương Thảo", mssv: "SE173210" },
  { name: "Đỗ Gia Huy", mssv: "SS170987" },
  { name: "Bùi Tuấn Kiệt", mssv: "SE171122" },
  { name: "Ngô Thùy Linh", mssv: "HE181234" },
  { name: "Đặng Quốc Bảo", mssv: "SE172567" },
  { name: "Hoàng Khánh Vy", mssv: "SS180111" },
  { name: "Dương Minh Trí", mssv: "SE174567" },
  { name: "Lý Hải Đăng", mssv: "IA180333" },
  { name: "Mai Thanh Trúc", mssv: "HE182345" },
  { name: "Hồ Nhật Nam", mssv: "SE175678" },
  { name: "Trịnh Diệu Hoa", mssv: "SS170444" },
  { name: "Võ Quang Khải", mssv: "SE176789" },
  { name: "Đinh Thu Hà", mssv: "HE183456" },
  { name: "Phan Tiến Đạt", mssv: "SE177890" },
  { name: "Cao Ngọc Ánh", mssv: "SS180555" },
  { name: "Lâm Quốc Cường", mssv: "SE178901" },
  { name: "Tạ Thị Kim Oanh", mssv: "HE184567" },
  { name: "Châu Vĩnh Phúc", mssv: "SE179012" },
  { name: "Lương Hoài An", mssv: "SS170666" },
  { name: "Đoàn Minh Quân", mssv: "SE170345" },
  { name: "Nguyễn Thị Ngọc Bích", mssv: "HE185678" },
  { name: "Trần Quang Dũng", mssv: "SE171456" },
  { name: "Lê Thị Thu Thủy", mssv: "SS180777" },
  { name: "Phạm Hùng Cường", mssv: "IA180888" },
  { name: "Vũ Bảo Ngọc", mssv: "SE172678" },
  { name: "Đỗ Thành Đạt", mssv: "HE186789" },
  { name: "Bùi Mỹ Duyên", mssv: "SS170888" },
  { name: "Ngô Văn Thắng", mssv: "SE173789" },
  { name: "Đặng Thị Huyền", mssv: "HE187890" },
  { name: "Hoàng Trọng Nghĩa", mssv: "SE174890" },
  { name: "Dương Thị Kim Ngân", mssv: "SS180999" },
  { name: "Lý Thế Dân", mssv: "IA180999" },
  { name: "Mai Hồng Sơn", mssv: "SE175901" },
  { name: "Hồ Quỳnh Như", mssv: "HE188901" },
  { name: "Trịnh Bá Phong", mssv: "SS171000" },
  { name: "Võ Thị Bích Thảo", mssv: "SE176012" },
  { name: "Đinh Xuân Trường", mssv: "HE189012" },
  { name: "Phan Yến Nhi", mssv: "SS181111" },
  { name: "Cao Bá Quát", mssv: "IA181111" },
  { name: "Lâm Thị Diễm My", mssv: "SE177123" },
  { name: "Tạ Hữu Bình", mssv: "HE180001" },
  { name: "Châu Thị Cẩm Tú", mssv: "SS171222" },
  { name: "Lương Gia Hân", mssv: "SE178234" },
  { name: "Đoàn Văn Hậu", mssv: "HE180112" },
  { name: "Nguyễn Hải Yến", mssv: "SS181333" },
  { name: "Trần Anh Khoa", mssv: "IA181222" },
  { name: "Lê Đức Phúc", mssv: "SE179345" },
  { name: "Phạm Thúy Hằng", mssv: "HE180223" },
  { name: "Vũ Đình Trọng", mssv: "SS171444" },
  { name: "Đỗ Thị Kiều Oanh", mssv: "SE170456" },
  { name: "Bùi Quốc Huy", mssv: "HE180334" },
  { name: "Ngô Tuấn Anh", mssv: "SS181555" },
  { name: "Đặng Thị Thùy Dung", mssv: "IA181333" },
  { name: "Hoàng Nhật Minh", mssv: "SE171567" },
  { name: "Dương Văn Toàn", mssv: "HE180445" },
  { name: "Trần Phương Linh", mssv: "SS171666" }
];

console.log('Total simulated students:', simulatedStudents.length);
console.log('Total questions:', questions.length);

fs.writeFileSync('game_data.json', JSON.stringify({ questions, simulatedStudents }, null, 2), 'utf8');
console.log('Wrote game_data.json successfully');
