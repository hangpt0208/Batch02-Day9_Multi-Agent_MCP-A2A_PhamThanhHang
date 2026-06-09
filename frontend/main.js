// --- Constants and Configuration ---
const REGISTRY_URL = 'http://localhost:10000';
const CUSTOMER_AGENT_URL = 'http://localhost:10100';

// Mock Answers for Simulated Mode
const SIMULATED_ANSWERS = {
  contract_tax: {
    question: "Vi phạm hợp đồng và trốn thuế có hậu quả pháp lý gì?",
    final_answer: `## Phân Tích Pháp Lý (Legal Analysis)
Hành vi vi phạm hợp đồng thương mại sẽ dẫn đến trách nhiệm bồi thường thiệt hại và phạt vi phạm theo quy định của Bộ luật Dân sự và Luật Thương mại. Trừ trường hợp bất khả kháng, bên vi phạm phải bồi thường toàn bộ thiệt hại vật chất thực tế phát sinh.

---

## Phân Tích Thuế (Tax Analysis)
Hành vi trốn thuế (Tax Evasion) cấu thành vi phạm pháp luật nghiêm trọng. 
- Theo Luật Quản lý Thuế Việt Nam và các bộ luật hình sự quốc tế (như 26 U.S.C. § 7201 của Mỹ), hành vi cố ý trốn thuế có thể dẫn đến phạt hành chính lên tới 1-3 lần số thuế trốn hoặc xử lý hình sự phạt tù lên đến 5 năm đối với cá nhân.
- Doanh nghiệp có thể chịu mức phạt tiền nặng và bị thu hồi giấy phép kinh doanh.

---

## Phân Tích Tuân Thủ (Regulatory Compliance Analysis)
Vi phạm đồng thời hợp đồng và nghĩa vụ thuế sẽ kích hoạt các cuộc điều tra tuân thủ từ các cơ quan quản lý (như SEC hoặc Ủy ban cạnh tranh). Doanh nghiệp sẽ bị xếp hạng tín nhiệm thấp, vi phạm các điều khoản tuân thủ nội bộ và đối mặt với rủi ro bị cổ đông kiện tụng vì thiếu trách nhiệm quản trị (Fiduciary Duty).

---

*Khuyến nghị: Tài liệu này chỉ mang tính chất tham khảo học tập. Doanh nghiệp cần tham vấn ý kiến chính thức của Luật sư được cấp phép trước khi đưa ra quyết định.*`,
    steps: [
      { type: 'system', text: 'Bắt đầu xử lý câu hỏi: "Vi phạm hợp đồng và trốn thuế có hậu quả pháp lý gì?"' },
      { type: 'customer', text: 'Nhận câu hỏi pháp lý từ người dùng. Bắt đầu phân loại...', activeNodes: ['customer'], activeFlows: [] },
      { type: 'customer', text: 'Nhận thấy câu hỏi chứa yếu tố pháp lý phức tạp. Cần chuyển tiếp đến Law Agent. Truy vấn Registry...', activeNodes: ['customer', 'registry'], activeFlows: ['flow-cust-reg'] },
      { type: 'registry', text: 'Nhận yêu cầu tìm kiếm agent thực hiện tác vụ "legal_question"...', activeNodes: ['registry'], activeFlows: [] },
      { type: 'registry', text: 'Tìm thấy Law Agent tại địa chỉ: http://localhost:10101. Trả về kết quả.', activeNodes: ['customer', 'registry'], activeFlows: ['flow-reg-cust'] },
      { type: 'customer', text: 'Nhận địa chỉ Law Agent. Tiến hành chuyển tiếp câu hỏi pháp lý...', activeNodes: ['customer', 'law'], activeFlows: ['flow-cust-law'] },
      { type: 'law', text: 'Law Agent (Trưởng nhóm pháp lý) tiếp nhận câu hỏi. Thực hiện phân tích luật dân sự/thương mại ban đầu.', activeNodes: ['law'], activeFlows: [] },
      { type: 'law', text: 'Kích hoạt Router để xác định các chuyên gia hỗ trợ. Phân tích nội dung phát hiện từ khóa "tax/thuế" và "compliance/tuân thủ".', activeNodes: ['law'], activeFlows: [] },
      { type: 'law', text: 'Yêu cầu Registry cung cấp địa chỉ của Tax Agent và Compliance Agent.', activeNodes: ['law', 'registry'], activeFlows: ['flow-law-reg'] },
      { type: 'registry', text: 'Khớp từ khóa tác vụ: "tax_question" -> tax-agent (Port 10102), "compliance_question" -> compliance-agent (Port 10103).', activeNodes: ['registry'], activeFlows: [] },
      { type: 'registry', text: 'Gửi địa chỉ các chuyên gia về cho Law Agent.', activeNodes: ['law', 'registry'], activeFlows: ['flow-reg-law'] },
      { type: 'law', text: 'Bắt đầu ủy quyền (delegation) song song (Parallel execution qua LangGraph Send API)...', activeNodes: ['law', 'tax', 'compliance'], activeFlows: ['flow-law-tax', 'flow-law-comp'] },
      { type: 'tax', text: 'Tax Agent tiếp nhận câu hỏi. Kích hoạt công cụ "search_tax_law" tra cứu cơ sở dữ liệu luật thuế...', activeNodes: ['tax'], activeFlows: [] },
      { type: 'compliance', text: 'Compliance Agent tiếp nhận câu hỏi. Kích hoạt công cụ "search_compliance_law" tra cứu chuẩn mực tuân thủ...', activeNodes: ['compliance'], activeFlows: [] },
      { type: 'tax', text: 'Tra cứu thành công (Điều 26 U.S.C. § 7201 - Trốn thuế là trọng tội). Hoàn thành báo cáo thuế, gửi lại Law Agent.', activeNodes: ['law', 'tax'], activeFlows: ['flow-tax-law'] },
      { type: 'compliance', text: 'Tra cứu thành công (Phạt CCPA/GDPR và vi phạm quy định SOX tài chính). Hoàn thành báo cáo tuân thủ, gửi lại Law Agent.', activeNodes: ['law', 'compliance'], activeFlows: ['flow-comp-law'] },
      { type: 'law', text: 'Thu thập đủ báo cáo chuyên môn. Bắt đầu tổng hợp tài liệu pháp lý tổng thể và viết các phần kết luận.', activeNodes: ['law'], activeFlows: [] },
      { type: 'law', text: 'Tổng hợp hoàn tất. Trả lời đầy đủ được chuyển về cho Customer Agent.', activeNodes: ['customer', 'law'], activeFlows: ['flow-law-cust'] },
      { type: 'customer', text: 'Customer Agent nhận kết quả, định dạng hiển thị cho người dùng thân thiện.', activeNodes: ['customer'], activeFlows: [] },
      { type: 'system', text: 'Xử lý thành công. Hoàn thành luồng giao tiếp A2A.' }
    ]
  },
  
  data_gdpr: {
    question: "Rò rỉ dữ liệu khách hàng sẽ bị xử phạt như thế nào theo GDPR?",
    final_answer: `## Phân Tích Pháp Lý (Legal Analysis)
Việc làm lộ dữ liệu cá nhân của khách hàng vi phạm nghiêm trọng thỏa thuận bảo mật thông tin (NDA) và nghĩa vụ bảo mật trong hợp đồng dịch vụ. Khách hàng có quyền chấm dứt hợp đồng ngay lập tức và khởi kiện đòi bồi thường toàn bộ thiệt hại uy tín và tài chính.

---

## Phân Tích Tuân Thuế & Bảo Vệ Dữ Liệu (Compliance Analysis)
Dưới góc độ Quy chế Bảo vệ Dữ liệu Chung (GDPR):
- Doanh nghiệp phải đối mặt với mức phạt hành chính cực kỳ nặng nề lên tới **20 triệu EUR** hoặc **4% tổng doanh thu toàn cầu** hàng năm của năm tài chính trước đó (tùy số nào lớn hơn).
- Nghĩa vụ báo cáo: Doanh nghiệp bắt buộc phải thông báo cho cơ quan quản lý bảo vệ dữ liệu có thẩm quyền trong vòng **72 giờ** kể từ khi phát hiện sự cố, trừ khi vụ rò rỉ không gây rủi ro cho quyền tự do cá nhân.

---

*Lưu ý: Không phát hiện yếu tố vi phạm pháp luật thuế khóa trong câu hỏi này, do đó Tax Agent được bỏ qua trong luồng xử lý tự động.*`,
    steps: [
      { type: 'system', text: 'Bắt đầu xử lý câu hỏi: "Rò rỉ dữ liệu khách hàng sẽ bị xử phạt như thế nào theo GDPR?"' },
      { type: 'customer', text: 'Nhận câu hỏi pháp lý từ người dùng. Phân loại nội dung...', activeNodes: ['customer'], activeFlows: [] },
      { type: 'customer', text: 'Truy vấn Registry để định vị Law Agent...', activeNodes: ['customer', 'registry'], activeFlows: ['flow-cust-reg'] },
      { type: 'registry', text: 'Trả về Law Agent tại http://localhost:10101.', activeNodes: ['customer', 'registry'], activeFlows: ['flow-reg-cust'] },
      { type: 'customer', text: 'Chuyển tiếp câu hỏi sang Law Agent...', activeNodes: ['customer', 'law'], activeFlows: ['flow-cust-law'] },
      { type: 'law', text: 'Law Agent tiếp nhận câu hỏi. Kích hoạt phân tích định hướng.', activeNodes: ['law'], activeFlows: [] },
      { type: 'law', text: 'Kích hoạt Router. Câu hỏi chứa từ khóa "GDPR/dữ liệu". Quyết định: cần chuyên gia Tuân thủ (Compliance), KHÔNG cần chuyên gia Thuế.', activeNodes: ['law'], activeFlows: [] },
      { type: 'law', text: 'Yêu cầu Registry trả về địa chỉ của Compliance Agent.', activeNodes: ['law', 'registry'], activeFlows: ['flow-law-reg'] },
      { type: 'registry', text: 'Trả về: compliance-agent (Port 10103).', activeNodes: ['law', 'registry'], activeFlows: ['flow-reg-law'] },
      { type: 'law', text: 'Ủy quyền đơn lẻ đến Compliance Agent...', activeNodes: ['law', 'compliance'], activeFlows: ['flow-law-comp'] },
      { type: 'compliance', text: 'Compliance Agent tiếp nhận câu hỏi. Tra cứu luật bảo vệ dữ liệu bằng công cụ "search_compliance_law"...', activeNodes: ['compliance'], activeFlows: [] },
      { type: 'compliance', text: 'Phân tích hoàn tất (Phạt 4% doanh thu toàn cầu). Gửi báo cáo tuân thủ về Law Agent.', activeNodes: ['law', 'compliance'], activeFlows: ['flow-comp-law'] },
      { type: 'law', text: 'Nhận báo cáo tuân thủ dữ liệu. Tổng hợp với phân tích pháp lý dân sự chung.', activeNodes: ['law'], activeFlows: [] },
      { type: 'law', text: 'Gửi kết quả hoàn chỉnh về cho Customer Agent.', activeNodes: ['customer', 'law'], activeFlows: ['flow-law-cust'] },
      { type: 'customer', text: 'Customer Agent nhận kết quả, trả về cho người dùng.', activeNodes: ['customer'], activeFlows: [] },
      { type: 'system', text: 'Xử lý thành công. Hoàn thành luồng giao tiếp A2A.' }
    ]
  },

  contract_only: {
    question: "Công ty đơn phương hủy hợp đồng mà không báo trước có vi phạm không?",
    final_answer: `## Phân Tích Pháp Lý (Legal Analysis)
Việc đơn phương chấm dứt hợp đồng thương mại mà không có căn cứ pháp luật hoặc không báo trước theo thời hạn thỏa thuận cấu thành hành vi vi phạm hợp đồng nghiêm trọng.
- Bên vi phạm có nghĩa vụ bồi thường toàn bộ thiệt hại phát sinh trực tiếp do việc chấm dứt hợp đồng trái pháp luật gây ra.
- Bên bị vi phạm có quyền áp dụng các chế tài: phạt vi phạm hợp đồng (nếu có thỏa thuận), yêu cầu bồi thường thiệt hại, hoặc tạm ngừng thực hiện nghĩa vụ tương ứng.

---

*Lưu ý: Câu hỏi chỉ xoay quanh tranh chấp dân sự/thương mại thuần túy. Hệ thống tự động bỏ qua chuyên gia Thuế và chuyên gia Tuân thủ để tối ưu hóa hiệu năng.*`,
    steps: [
      { type: 'system', text: 'Bắt đầu xử lý câu hỏi: "Công ty đơn phương hủy hợp đồng mà không báo trước có vi phạm không?"' },
      { type: 'customer', text: 'Nhận câu hỏi pháp lý từ người dùng. Phân loại nội dung...', activeNodes: ['customer'], activeFlows: [] },
      { type: 'customer', text: 'Truy vấn Registry để định vị Law Agent...', activeNodes: ['customer', 'registry'], activeFlows: ['flow-cust-reg'] },
      { type: 'registry', text: 'Trả về Law Agent tại http://localhost:10101.', activeNodes: ['customer', 'registry'], activeFlows: ['flow-reg-cust'] },
      { type: 'customer', text: 'Chuyển tiếp câu hỏi sang Law Agent...', activeNodes: ['customer', 'law'], activeFlows: ['flow-cust-law'] },
      { type: 'law', text: 'Law Agent tiếp nhận câu hỏi. Kích hoạt phân tích pháp lý cơ bản.', activeNodes: ['law'], activeFlows: [] },
      { type: 'law', text: 'Kích hoạt Router. Phân tích nội dung cho thấy không chứa từ khóa thuế hoặc tuân thủ quy chế đặc biệt. Quyết định: tự xử lý, không cần chuyên gia phụ trợ.', activeNodes: ['law'], activeFlows: [] },
      { type: 'law', text: 'Đi thẳng đến bước tổng hợp (Skip Tax & Compliance agents).', activeNodes: ['law'], activeFlows: [] },
      { type: 'law', text: 'Gửi kết quả hoàn chỉnh về cho Customer Agent.', activeNodes: ['customer', 'law'], activeFlows: ['flow-law-cust'] },
      { type: 'customer', text: 'Customer Agent nhận kết quả, trả về cho người dùng.', activeNodes: ['customer'], activeFlows: [] },
      { type: 'system', text: 'Xử lý thành công. Hoàn thành luồng giao tiếp A2A.' }
    ]
  }
};

// State Variables
let isLiveMode = false;
let isExecuting = false;
let hasAutoDetected = false;

// DOM Elements
const btnModeSimulated = document.getElementById('btn-mode-simulated');
const btnModeLive = document.getElementById('btn-mode-live');
const modelNameEl = document.getElementById('model-name');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const chatMessagesContainer = document.getElementById('chat-messages-container');
const terminalConsoleContainer = document.getElementById('terminal-console-container');
const btnClearConsole = document.getElementById('btn-clear-console');
const currentStateLabel = document.getElementById('current-state-label');

// Node elements
const nodes = {
  registry: document.getElementById('node-registry'),
  customer: document.getElementById('node-customer'),
  law: document.getElementById('node-law'),
  tax: document.getElementById('node-tax'),
  compliance: document.getElementById('node-compliance')
};

// Flow Line elements
const flows = {
  'flow-cust-reg': document.getElementById('flow-cust-reg'),
  'flow-cust-law': document.getElementById('flow-cust-law'),
  'flow-law-reg': document.getElementById('flow-law-reg'),
  'flow-law-tax': document.getElementById('flow-law-tax'),
  'flow-law-comp': document.getElementById('flow-law-comp'),
  'flow-reg-cust': document.getElementById('flow-reg-cust'),
  'flow-reg-law': document.getElementById('flow-reg-law'),
  'flow-tax-law': document.getElementById('flow-tax-law'),
  'flow-comp-law': document.getElementById('flow-comp-law'),
  'flow-law-cust': document.getElementById('flow-law-cust')
};

// Health badges
const healthBadges = {
  registry: document.getElementById('health-registry'),
  customer: document.getElementById('health-customer'),
  law: document.getElementById('health-law'),
  tax: document.getElementById('health-tax'),
  compliance: document.getElementById('health-compliance')
};

// --- Helper Functions ---

function logToConsole(message, type = 'system') {
  const line = document.createElement('div');
  line.className = `console-line ${type}`;
  
  const timestamp = new Date().toLocaleTimeString();
  line.textContent = `[${timestamp}] ${message}`;
  
  terminalConsoleContainer.appendChild(line);
  terminalConsoleContainer.scrollTop = terminalConsoleContainer.scrollHeight;
}

function addChatMessage(sender, text, type = 'agent') {
  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  
  const senderEl = document.createElement('div');
  senderEl.className = 'message-sender';
  senderEl.textContent = sender;
  msg.appendChild(senderEl);
  
  const textEl = document.createElement('div');
  textEl.className = 'message-text';
  
  // Basic markdown compiler for H2 headers and horizontal lines
  let html = text
    .replace(/## (.*)/g, '<h2>$1</h2>')
    .replace(/---/g, '<hr>');
  textEl.innerHTML = html;
  
  msg.appendChild(textEl);
  chatMessagesContainer.appendChild(msg);
  chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  return msg;
}

function clearVisualizer() {
  Object.values(nodes).forEach(n => n.classList.remove('active'));
  Object.values(flows).forEach(f => f.classList.remove('active'));
  currentStateLabel.textContent = 'IDLE';
  currentStateLabel.className = 'status-indicator-label';
}

function setVisualizerState(activeNodeKeys = [], activeFlowKeys = [], label = 'EXECUTING') {
  clearVisualizer();
  
  activeNodeKeys.forEach(key => {
    if (nodes[key]) nodes[key].classList.add('active');
  });
  
  activeFlowKeys.forEach(key => {
    if (flows[key]) flows[key].classList.add('active');
  });
  
  currentStateLabel.textContent = label;
  if (label !== 'IDLE') {
    currentStateLabel.className = 'status-indicator-label active';
  }
}

// Generate UUID for message/send requests
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// --- Dynamic Simulated Engine ---
function generateDynamicSimulatedResponse(question) {
  const questionLower = question.toLowerCase();
  
  // Determine routing flags based on key words
  let needsTax = false;
  let needsCompliance = false;
  
  if (/\b(thuế|tax|evasion|trốn|phạt thuế|cpa|irs|valuation|pricing|import|nhập khẩu|khấu trừ)\b/i.test(questionLower)) {
    needsTax = true;
  }
  if (/\b(compliance|sec|sarbanes|sox|gdpr|ccpa|privacy|dữ liệu|bảo mật|rò rỉ|tiết lộ|thông tin|quy chế|luật|nghị định|giấy phép|regulation)\b/i.test(questionLower)) {
    needsCompliance = true;
  }
  
  // Construct dynamic legal answer in markdown
  let lawAnalysis = `## Phân Tích Pháp Lý (Legal Analysis)
Liên quan đến câu hỏi tùy chỉnh của bạn về: "${question}"
- Dưới góc độ hợp đồng và luật dân sự/kinh doanh: Mọi giao dịch hoặc cam kết phải được lập thành văn bản rõ ràng. Việc vi phạm cam kết hoặc thực hiện hành vi đơn phương trái thỏa thuận sẽ làm phát sinh trách nhiệm bồi thường thiệt hại (civil damages) và chịu phạt vi phạm.
- Các bên bị ảnh hưởng có quyền khởi kiện hoặc gửi đơn tố cáo lên các cơ quan chức năng để bảo vệ quyền lợi hợp pháp của mình.`;

  let taxAnalysis = "";
  if (needsTax) {
    taxAnalysis = `## Phân Tích Thuế (Tax Analysis)
Phân tích khía cạnh Thuế cho nội dung truy vấn của bạn:
- Hành vi trốn tránh nghĩa vụ thuế, gian lận tờ khai hải quan, hoặc tránh thuế bất hợp pháp bị nghiêm cấm theo luật quản lý thuế.
- Người nộp thuế có thể bị truy thu đủ số thuế, phạt tiền từ 1 đến 3 lần số thuế trốn thuế và tính tiền chậm nộp 0.03%/ngày.
- Đối với các vụ việc nghiêm trọng hoặc có tổ chức, hành vi này sẽ bị truy cứu hình sự về tội trốn thuế theo Bộ luật Hình sự hiện hành.`;
  }

  let complianceAnalysis = "";
  if (needsCompliance) {
    complianceAnalysis = `## Phân Tích Tuân Thủ & Quy Chế (Compliance Analysis)
Về mặt quy chuẩn an toàn bảo mật và tuân thủ quy chế:
- Việc rò rỉ dữ liệu hoặc vi phạm các quy chế nội bộ/quốc tế sẽ trực tiếp kích hoạt quy trình điều tra trách nhiệm.
- Theo quy định GDPR (nếu đối tượng là công dân EU) hoặc các nghị định bảo vệ dữ liệu cá nhân trong nước, tổ chức vi phạm đối mặt với các mức phạt tiền hành chính đặc biệt nghiêm khắc lên đến 4% tổng doanh thu toàn cầu.
- Tổ chức có nghĩa vụ khắc phục sự cố và báo cáo cơ quan giám sát trong thời gian luật định kể từ thời điểm phát hiện.`;
  }

  let disclaimer = `---

*Khuyến nghị: Phản hồi trên được tạo tự động bởi công cụ lập luận chuyên gia trong chế độ Mô phỏng (Simulated Mode). Đây là câu trả lời mang tính chất mô phạm giáo dục, không thay thế cho ý kiến tư vấn pháp lý chính thức.*`;

  let finalAnswerParts = [lawAnalysis];
  if (needsTax) finalAnswerParts.push(taxAnalysis);
  if (needsCompliance) finalAnswerParts.push(complianceAnalysis);
  finalAnswerParts.push(disclaimer);

  // Build steps
  let steps = [
    { type: 'system', text: `Bắt đầu phân tích câu hỏi tùy chỉnh: "${question}"` },
    { type: 'customer', text: 'Customer Agent nhận câu hỏi tùy chỉnh từ người dùng. Tiến hành phân loại nội dung...', activeNodes: ['customer'], activeFlows: [] },
    { type: 'customer', text: 'Nhận thấy câu hỏi cần sự phân tích chuyên môn sâu. Gọi Registry tìm địa chỉ Law Agent...', activeNodes: ['customer', 'registry'], activeFlows: ['flow-cust-reg'] },
    { type: 'registry', text: 'Registry tra cứu cơ sở dữ liệu tác vụ "legal_question" -> Law Agent (Port 10101).', activeNodes: ['registry'], activeFlows: [] },
    { type: 'registry', text: 'Gửi kết quả định vị Law Agent về cho Customer Agent.', activeNodes: ['customer', 'registry'], activeFlows: ['flow-reg-cust'] },
    { type: 'customer', text: 'Chuyển tiếp câu hỏi sang Law Agent để bắt đầu chu trình phân tích pháp lý.', activeNodes: ['customer', 'law'], activeFlows: ['flow-cust-law'] },
    { type: 'law', text: 'Law Agent tiếp nhận câu hỏi. Thực hiện phân tích luật thương mại và dân sự cơ bản.', activeNodes: ['law'], activeFlows: [] },
    { type: 'law', text: `Kích hoạt Router phân tích định tuyến: needs_tax=${needsTax}, needs_compliance=${needsCompliance}.`, activeNodes: ['law'], activeFlows: [] }
  ];

  if (needsTax || needsCompliance) {
    steps.push({ type: 'law', text: `Gửi yêu cầu khám phá Registry cho các dịch vụ chuyên môn cần thiết...`, activeNodes: ['law', 'registry'], activeFlows: ['flow-law-reg'] });
    steps.push({ type: 'registry', text: `Tìm thấy địa chỉ: ${[needsTax ? 'tax-agent (10102)' : '', needsCompliance ? 'compliance-agent (10103)' : ''].filter(Boolean).join(' và ')}.`, activeNodes: ['registry'], activeFlows: [] });
    steps.push({ type: 'registry', text: `Gửi phản hồi định vị về cho Law Agent.`, activeNodes: ['law', 'registry'], activeFlows: ['flow-reg-law'] });

    let activeNodesList = ['law'];
    let activeFlowsList = [];
    if (needsTax) { activeNodesList.push('tax'); activeFlowsList.push('flow-law-tax'); }
    if (needsCompliance) { activeNodesList.push('compliance'); activeFlowsList.push('flow-law-comp'); }

    steps.push({ type: 'law', text: `Tiến hành ủy quyền (delegation) song song đến các agent chuyên môn tương ứng.`, activeNodes: activeNodesList, activeFlows: activeFlowsList });

    if (needsTax) {
      steps.push({ type: 'tax', text: 'Tax Agent tiếp nhận. Thực hiện tra cứu cơ sở kiến thức bằng công cụ "search_tax_law".', activeNodes: ['tax'], activeFlows: [] });
    }
    if (needsCompliance) {
      steps.push({ type: 'compliance', text: 'Compliance Agent tiếp nhận. Thực hiện tra cứu cơ sở kiến thức bằng công cụ "search_compliance_law".', activeNodes: ['compliance'], activeFlows: [] });
    }

    let returnNodesList = ['law'];
    let returnFlowsList = [];
    if (needsTax) { returnNodesList.push('tax'); returnFlowsList.push('flow-tax-law'); }
    if (needsCompliance) { returnNodesList.push('compliance'); returnFlowsList.push('flow-comp-law'); }

    steps.push({ type: 'system', text: 'Các chuyên gia đang phân tích dữ liệu song song và soạn thảo phản hồi...', activeNodes: returnNodesList, activeFlows: [] });
    steps.push({ type: 'law', text: 'Nhận kết quả phân tích chuyên môn và tổng hợp tài liệu.', activeNodes: returnNodesList, activeFlows: returnFlowsList });
  } else {
    steps.push({ type: 'law', text: 'Bỏ qua việc lấy ý kiến từ chuyên gia Thuế và Tuân thủ vì câu hỏi không chứa các yếu tố này.', activeNodes: ['law'], activeFlows: [] });
  }

  steps.push({ type: 'law', text: 'Hoàn thành tổng hợp văn bản pháp lý. Gửi lại cho Customer Agent.', activeNodes: ['customer', 'law'], activeFlows: ['flow-law-cust'] });
  steps.push({ type: 'customer', text: 'Customer Agent biên dịch lại văn bản cho thân thiện với người dùng.', activeNodes: ['customer'], activeFlows: [] });
  steps.push({ type: 'system', text: 'Xử lý thành công. Hoàn tất chuỗi tương tác A2A.' });

  return {
    question: question,
    final_answer: finalAnswerParts.join("\n\n"),
    steps: steps
  };
}

// Check local services health status
async function updateServicesHealth() {
  try {
    const regResp = await fetch(`${REGISTRY_URL}/agents`, { 
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    });
    
    if (regResp.ok) {
      healthBadges.registry.className = 'health-badge status-online';
      const data = await regResp.json();
      const registeredAgents = data.agents || [];
      
      const names = {
        'customer-agent': 'customer',
        'law-agent': 'law',
        'tax-agent': 'tax',
        'compliance-agent': 'compliance'
      };
      
      // Reset badges to offline first
      Object.keys(names).forEach(k => {
        healthBadges[names[k]].className = 'health-badge status-offline';
      });
      
      registeredAgents.forEach(agent => {
        const key = names[agent.agent_name];
        if (key && healthBadges[key]) {
          healthBadges[key].className = 'health-badge status-online';
        }
      });

      // Auto-detect and switch to Live Mode ONCE on page load if local agents are running
      if (!hasAutoDetected && registeredAgents.length > 0) {
        hasAutoDetected = true;
        isLiveMode = true;
        btnModeLive.classList.add('active');
        btnModeSimulated.classList.remove('active');
        logToConsole('[AUTO-DETECT] Phát hiện hệ thống Agent cục bộ đang hoạt động! Tự động chuyển sang chế độ CHẠY THẬT (Live API).', 'system');
        addChatMessage('Hệ thống', 'Đã phát hiện thấy các Agent cục bộ đang chạy. Tự động chuyển sang chế độ <strong>Chạy Thật (Live API)</strong>.', 'system');
      }
    } else {
      setAllOffline();
    }
  } catch (e) {
    setAllOffline();
    // If auto detect failed and we haven't notify, mark auto-detected so we don't spam
    if (!hasAutoDetected) {
      hasAutoDetected = true;
      logToConsole('[AUTO-DETECT] Không tìm thấy hệ thống Agent cục bộ. Giữ chế độ mặc định: MÔ PHỎNG (Offline).', 'system');
    }
  }
}

function setAllOffline() {
  Object.values(healthBadges).forEach(badge => {
    badge.className = 'health-badge status-offline';
  });
}

// Run Simulation Data Step-by-Step
async function runSimulationData(data) {
  if (!data) return;
  
  isExecuting = true;
  chatSendBtn.disabled = true;
  chatInput.disabled = true;
  
  const steps = data.steps;
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    
    // Log message to terminal console
    logToConsole(step.text, step.type);
    
    // Update SVG visualizer active states
    if (step.activeNodes || step.activeFlows) {
      const labelState = step.type.toUpperCase() + ' PROCESSING';
      setVisualizerState(step.activeNodes, step.activeFlows, labelState);
    }
    
    // Micro-delay between steps to create animation effects
    await new Promise(resolve => setTimeout(resolve, 1200));
  }
  
  // Show Final Message in Chat
  addChatMessage('Customer Agent', data.final_answer, 'agent');
  
  clearVisualizer();
  isExecuting = false;
  chatSendBtn.disabled = false;
  chatInput.disabled = false;
}

// Call live local REST endpoint
async function runLiveQuery(question) {
  isExecuting = true;
  chatSendBtn.disabled = true;
  chatInput.disabled = true;
  
  addChatMessage('Khách hàng', question, 'user');
  logToConsole(`Khởi động truy vấn live. Gửi đến Customer Agent tại: ${CUSTOMER_AGENT_URL}`, 'user');
  
  // Pulse Customer Node as active
  setVisualizerState(['customer'], [], 'CUSTOMER CONNECTING');
  
  // Inject registry querying animations
  let animTimer = setTimeout(() => {
    setVisualizerState(['customer', 'registry'], ['flow-cust-reg'], 'REGISTRY QUERYING');
    logToConsole('[CUSTOMER] Kiểm tra Registry định vị Law Agent...', 'registry');
  }, 1000);

  let animTimer2 = setTimeout(() => {
    setVisualizerState(['customer', 'law'], ['flow-cust-law'], 'DELEGATING LAW');
    logToConsole('[CUSTOMER] Chuyển tiếp tác vụ pháp lý đến Law Agent...', 'law');
  }, 2500);

  let animTimer3 = setTimeout(() => {
    setVisualizerState(['law', 'tax', 'compliance'], ['flow-law-tax', 'flow-law-comp'], 'PARALLEL SOLVING');
    logToConsole('[LAW] Nhận diện từ khóa pháp luật. Kích hoạt xử lý song song Tax và Compliance...', 'law');
  }, 5000);

  const requestBody = {
    id: generateUUID(),
    jsonrpc: "2.0",
    method: "message/send",
    params: {
      message: {
        role: "user",
        parts: [
          {
            kind: "text",
            text: question
          }
        ],
        message_id: generateUUID()
      }
    }
  };

  try {
    const response = await fetch(`${CUSTOMER_AGENT_URL}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(120000) // 2 minutes timeout
    });

    // Clean up animation timers
    clearTimeout(animTimer);
    clearTimeout(animTimer2);
    clearTimeout(animTimer3);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    logToConsole(`Đã nhận phản hồi từ Customer Agent.`, 'customer');
    
    // Parse the A2A response
    let answerText = "";
    if (data.result) {
      const result = data.result;
      if (result.artifacts && result.artifacts.length > 0) {
        result.artifacts.forEach(art => {
          if (art.parts) {
            art.parts.forEach(part => {
              if (part.text) answerText += part.text;
            });
          }
        });
      } else if (result.parts && result.parts.length > 0) {
        result.parts.forEach(part => {
          if (part.text) answerText += part.text;
        });
      }
    }

    if (!answerText) {
      answerText = "Không nhận được phản hồi định dạng văn bản phù hợp. Kết quả raw: " + JSON.stringify(data);
    }

    // Return visualizer path to Customer and then IDLE
    setVisualizerState(['customer'], ['flow-law-cust'], 'CUSTOMER RETURNING');
    await new Promise(resolve => setTimeout(resolve, 1000));

    addChatMessage('Customer Agent', answerText, 'agent');

  } catch (error) {
    clearTimeout(animTimer);
    clearTimeout(animTimer2);
    clearTimeout(animTimer3);
    
    logToConsole(`Lỗi kết nối hoặc xử lý Live API: ${error.message}`, 'error');
    addChatMessage('Hệ thống', `Không thể kết nối đến Customer Agent ở cổng 10100. Hãy đảm bảo tất cả dịch vụ đã được khởi động bằng start_all.py và có CORS. Chi tiết lỗi: ${error.message}`, 'system');
  } finally {
    clearVisualizer();
    isExecuting = false;
    chatSendBtn.disabled = false;
    chatInput.disabled = false;
  }
}

// --- Event Handlers ---

// Toggle to Simulated Mode
btnModeSimulated.addEventListener('click', () => {
  if (isExecuting) return;
  isLiveMode = false;
  btnModeSimulated.classList.add('active');
  btnModeLive.classList.remove('active');
  logToConsole('Chuyển sang chế độ MÔ PHỎNG (Offline). Tải các kịch bản mẫu sẵn có.', 'system');
  updateServicesHealth();
});

// Toggle to Live Mode
btnModeLive.addEventListener('click', () => {
  if (isExecuting) return;
  isLiveMode = true;
  btnModeLive.classList.add('active');
  btnModeSimulated.classList.remove('active');
  logToConsole('Chuyển sang chế độ CHẠY THẬT (Live API). Kết nối cổng 10000 và 10100...', 'system');
  updateServicesHealth();
});

// Clear console log
btnClearConsole.addEventListener('click', () => {
  terminalConsoleContainer.innerHTML = '<div class="console-line system">[SYSTEM] Console cleared.</div>';
});

// Send Chat Input
chatSendBtn.addEventListener('click', () => {
  const val = chatInput.value.trim();
  if (!val || isExecuting) return;
  
  chatInput.value = '';
  
  if (isLiveMode) {
    runLiveQuery(val);
  } else {
    // Check if matching preset keys first
    let presetKey = null;
    if (val === "Vi phạm hợp đồng và trốn thuế có hậu quả pháp lý gì?") {
      presetKey = "contract_tax";
    } else if (val === "Rò rỉ dữ liệu khách hàng sẽ bị xử phạt như thế nào theo GDPR?") {
      presetKey = "data_gdpr";
    } else if (val === "Công ty đơn phương hủy hợp đồng mà không báo trước có vi phạm không?") {
      presetKey = "contract_only";
    }

    if (presetKey) {
      addChatMessage('Khách hàng', val, 'user');
      runSimulationData(SIMULATED_ANSWERS[presetKey]);
    } else {
      // Dynamic mock generation for arbitrary user input
      addChatMessage('Khách hàng', val, 'user');
      const dynamicData = generateDynamicSimulatedResponse(val);
      runSimulationData(dynamicData);
    }
  }
});

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    chatSendBtn.click();
  }
});

// Preset buttons clicks
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (isExecuting) return;
    const type = btn.getAttribute('data-question');
    if (isLiveMode) {
      const questionText = btn.querySelector('p').textContent;
      runLiveQuery(questionText);
    } else {
      addChatMessage('Khách hàng', SIMULATED_ANSWERS[type].question, 'user');
      runSimulationData(SIMULATED_ANSWERS[type]);
    }
  });
});

// Initial health check load
updateServicesHealth();
logToConsole('Khởi động visualizer thành công. Chế độ mặc định: Mô phỏng.', 'system');
