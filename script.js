// ==================== 1. ĐIỀU KHIỂN TABS ====================
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }
    const target = document.getElementById(`tab-${tabId}`);
    if (target) {
        target.classList.add('active');
    }
}

function toggleRequirementLabel() {
    const type = document.getElementById('split-type').value;
    const label = document.getElementById('req-label');
    const input = document.getElementById('req-count');
    if (type === 'subnets') {
        label.innerText = 'Số mạng con cần chia:';
        input.placeholder = 'VD: 8, 16, 32...';
    } else {
        label.innerText = 'Số lượng Host/máy khả dụng:';
        input.placeholder = 'VD: 30, 60, 100...';
    }
}

// ==================== 2. LOGIC ĐỔI HỆ CƠ SỐ ====================
const fromBase = document.getElementById('fromBase');
const toBase = document.getElementById('toBase');
const inputValue = document.getElementById('inputValue');
const inputHint = document.getElementById('inputHint');
const resultValue = document.getElementById('resultValue');
const calculationSteps = document.getElementById('calculationSteps');

if (fromBase && toBase && inputValue) {
    fromBase.addEventListener('change', updateInputHint);
    fromBase.addEventListener('change', performConversion);
    toBase.addEventListener('change', performConversion);
    inputValue.addEventListener('input', performConversion);
    inputValue.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') performConversion();
    });
}

function updateInputHint() {
    const base = fromBase.value;
    const hints = {
        '2': 'Hệ 2: chỉ nhập các số 0 và 1',
        '8': 'Hệ 8: nhập các số từ 0 đến 7',
        '10': 'Hệ 10: nhập các số từ 0 đến 9',
        '16': 'Hệ 16: nhập các ký tự từ 0-9 và A-F'
    };
    inputHint.innerText = hints[base] || '';
}

function performConversion() {
    const val = inputValue.value.trim().toUpperCase();
    if (!val) {
        resultValue.innerText = '';
        calculationSteps.innerText = '';
        return;
    }

    const fBase = parseInt(fromBase.value);
    const tBase = parseInt(toBase.value);

    const regexMap = {
        2: /^[01]+$/,         8: /^[0-7]+$/,
        10: /^[0-9]+$/,         16: /^[0-9A-F]+$/
    };

    if (!regexMap[fBase].test(val)) {
        resultValue.innerText = 'Giá trị không hợp lệ!';
        calculationSteps.innerText = 'Vui lòng kiểm tra lại ký tự nhập theo đúng hệ cơ số đã chọn.';
        return;
    }

    // 1. Chuyển sang Hệ 10
    let decVal = 0;
    let steps = `1. Chuyển ${val} (cơ số ${fBase}) sang Hệ 10:\n`;
    for (let i = 0; i < val.length; i++) {
        const char = val[val.length - 1 - i];
        const num = parseInt(char, fBase);
        decVal += num * Math.pow(fBase, i);
        steps += `   ${char} × ${fBase}^${i} = ${num * Math.pow(fBase, i)}\n`;
    }
    steps += `=> Tổng thập phân = ${decVal}\n\n`;

    // 2. Chuyển từ Hệ 10 sang Hệ đích
    let finalResult = '';
    if (tBase === 10) {
        finalResult = decVal.toString();
        steps += `Kết quả ở Hệ 10: ${finalResult}`;
    } else {
        steps += `2. Chuyển ${decVal} (Hệ 10) sang cơ số ${tBase} (chia liên tiếp lấy số dư):\n`;
        let temp = decVal;
        let remainders = [];
        if (temp === 0) remainders.push('0');
        while (temp > 0) {
            let rem = temp % tBase;
            let remChar = rem.toString(tBase).toUpperCase();
            remainders.push(remChar);
            steps += `   ${temp} ÷ ${tBase} = ${Math.floor(temp / tBase)} dư ${remChar} (${rem})\n`;
            temp = Math.floor(temp / tBase);
        }
        remainders.reverse();
        finalResult = remainders.join('');
        steps += `=> Đọc các số dư từ dưới lên: ${finalResult}`;
    }

    resultValue.innerText = finalResult;
    calculationSteps.innerText = steps;
}

// ==================== 3. THUẬT TOÁN TỰ ĐỘNG CHIA MẠNG CON ====================
function solveSubnet(e) {
    e.preventDefault();

    const ipStr = document.getElementById('network-ip').value.trim();
    const splitType = document.getElementById('split-type').value;
    const countReq = parseInt(document.getElementById('req-count').value);

    const octets = ipStr.split('.').map(Number);
    if (octets.length !== 4 || octets.some(o => isNaN(o) || o < 0 || o > 255)) {
        alert("Địa chỉ IP không hợp lệ! Vui lòng nhập đúng dạng x.x.x.x (0-255).");
        return;
    }

    const firstOctet = octets[0];
    let netClass = '', defaultPrefix = 24, defaultMask = '255.255.255.0';
    if (firstOctet >= 1 && firstOctet <= 126) {
        netClass = 'A'; defaultPrefix = 8; defaultMask = '255.0.0.0';
    } else if (firstOctet >= 128 && firstOctet <= 191) {
        netClass = 'B'; defaultPrefix = 16; defaultMask = '255.255.0.0';
    } else if (firstOctet >= 192 && firstOctet <= 223) {
        netClass = 'C'; defaultPrefix = 24; defaultMask = '255.255.255.0';
    } else {
        alert("Vui lòng nhập địa chỉ mạng thuộc lớp A, B hoặc C.");
        return;
    }

    let totalDefaultHostBits = 32 - defaultPrefix;
    let borrowBits = 0;
    let remainHostBits = 0;
    let subnetsCount = 0;
    let analysisHtml = '';

    if (splitType === 'subnets') {
        borrowBits = Math.ceil(Math.log2(countReq));
        if (borrowBits > totalDefaultHostBits - 2) {
            alert(`Không thể chia thành ${countReq} mạng con vì không đủ số bit Host!`);
            return;
        }
        subnetsCount = countReq;
        remainHostBits = totalDefaultHostBits - borrowBits;
        const targetOctetNum = Math.floor((defaultPrefix + borrowBits - 1) / 8) + 1;

        analysisHtml = `
            <p>• Địa chỉ <strong>${ipStr}</strong> thuộc mạng <strong>lớp ${netClass}</strong>, có Subnet Mask mặc định là: <strong>${defaultMask} (/${defaultPrefix})</strong>.</p>
            <p>• Vì cần chia thành <strong>${countReq} mạng con</strong>, số bit cần mượn từ HostID thỏa mãn: <strong>2<sup>x</sup> ≥ ${countReq}  ⇒  x = ${borrowBits} bit</strong>.<br>
               Do đó, ta mượn ${borrowBits} bit đầu tiên của octet thứ ${targetOctetNum} (phần HostID).</p>
        `;
    } else {
        remainHostBits = Math.ceil(Math.log2(countReq + 2));
        borrowBits = totalDefaultHostBits - remainHostBits;
        if (borrowBits < 0) {
            alert(`Mạng lớp ${netClass} không đủ địa chỉ IP để cấp cho ${countReq} host mỗi mạng!`);
            return;
        }
        subnetsCount = Math.pow(2, borrowBits);
        const targetOctetNum = Math.floor((defaultPrefix + borrowBits - 1) / 8) + 1;

        analysisHtml = `
            <p>• Địa chỉ <strong>${ipStr}</strong> thuộc mạng <strong>lớp ${netClass}</strong>, có Subnet Mask mặc định là: <strong>${defaultMask} (/${defaultPrefix})</strong>.</p>
            <p>• Vì mỗi mạng con cần tối thiểu <strong>${countReq} Host</strong>, ta áp dụng công thức: <strong>2<sup>y</sup> - 2 ≥ ${countReq}  ⇒  y = ${remainHostBits} bit</strong> dành cho Host.</p>
            <p>• Số bit cần mượn từ phần HostID: <strong>x = ${totalDefaultHostBits} - ${remainHostBits} = ${borrowBits} bit</strong> (mượn tại octet thứ ${targetOctetNum}).</p>
        `;
    }

    const newPrefix = defaultPrefix + borrowBits;
    const totalHosts = Math.pow(2, remainHostBits);
    const usableHosts = totalHosts - 2;

    const maskInt = (0xFFFFFFFF << (32 - newPrefix)) >>> 0;
    const newMaskDec = [
        (maskInt >>> 24) & 255,
        (maskInt >>> 16) & 255,
        (maskInt >>> 8) & 255,
        maskInt & 255
    ].join('.');

    const newMaskBin = [
        ((maskInt >>> 24) & 255).toString(2).padStart(8, '0'),
        ((maskInt >>> 16) & 255).toString(2).padStart(8, '0'),
        ((maskInt >>> 8) & 255).toString(2).padStart(8, '0'),
        (maskInt & 255).toString(2).padStart(8, '0')
    ].join('.');

    const targetOctetIndex = Math.floor((newPrefix - 1) / 8);
    const bitsInTargetOctet = newPrefix - (targetOctetIndex * 8);
    const step = Math.pow(2, 8 - bitsInTargetOctet);

    analysisHtml += `
        <p>⇒ <strong>Địa chỉ Subnet Mask mới:</strong><br>
           Nhị phân: <code>${newMaskBin}</code><br>
           Thập phân: <strong>${newMaskDec}</strong> (Ký hiệu tiền tố: <strong>/${newPrefix}</strong>)</p>
        <p>• <strong>Số bit còn lại cho Host:</strong> ${remainHostBits} bit.</p>
        <p>• <strong>Bước nhảy trên octet thứ ${targetOctetIndex + 1}:</strong> 2<sup>${8 - bitsInTargetOctet}</sup> = <strong>${step}</strong> (tức mỗi mạng con cách nhau ${step} đơn vị ở octet ${targetOctetIndex + 1}).</p>
        <p>• Mỗi mạng con có: <strong>2<sup>${remainHostBits}</sup> = ${totalHosts}</strong> địa chỉ IP (trong đó có ${totalHosts} - 2 = <strong>${usableHosts}</strong> địa chỉ IP khả dụng cho các thiết bị host).</p>
    `;

    document.getElementById('subnet-steps').innerHTML = analysisHtml;

    // 1. Render bảng địa chỉ
    renderSubnetTable(octets, borrowBits, subnetsCount, totalHosts, targetOctetIndex);

    // 2. Render giải thích phép tính nhẩm & bản chất nhị phân
    renderQuickMathExplanation(step, targetOctetIndex + 1, remainHostBits, totalHosts);

    document.getElementById('subnet-result').style.display = 'block';
}

function renderSubnetTable(octets, borrowBits, subnetsCount, totalHosts, targetOctetIndex) {
    const tbody = document.getElementById('subnet-table-body');
    tbody.innerHTML = '';

    const baseInt = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
    const maxRender = Math.min(subnetsCount, 128);

    for (let i = 0; i < maxRender; i++) {
        const netInt = (baseInt + i * totalHosts) >>> 0;
        const firstHostInt = (netInt + 1) >>> 0;
        const bcastInt = (netInt + totalHosts - 1) >>> 0;
        const lastHostInt = (bcastInt - 1) >>> 0;

        const sttBin = borrowBits > 0 ? i.toString(2).padStart(borrowBits, '0') : '0';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="font-weight: 600;">${sttBin}</td>
            <td>${formatIpWithBinary(netInt, targetOctetIndex)}</td>
            <td>${formatIpWithBinary(firstHostInt, targetOctetIndex)}</td>
            <td>${formatIpWithBinary(lastHostInt, targetOctetIndex)}</td>
            <td>${formatIpWithBinary(bcastInt, targetOctetIndex)}</td>
            <td>Bộ phận ${i + 1}</td>
        `;
        tbody.appendChild(row);
    }

    if (subnetsCount > 128) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="6" style="padding: 10px; color: #64748b; font-style: italic;">(Đã hiển thị trước 128 / ${subnetsCount} mạng con đầu tiên)</td>`;
        tbody.appendChild(tr);
    }
}

function formatIpWithBinary(ipInt, targetIndex) {
    const o = [
        (ipInt >>> 24) & 255,
        (ipInt >>> 16) & 255,
        (ipInt >>> 8) & 255,
        ipInt & 255
    ];

    const decStr = o.join('.');
    const binOctet = o[targetIndex].toString(2).padStart(8, '0');

    let binDisplay = '';
    if (targetIndex === 2) {
        binDisplay = `${o[0]}.${o[1]}.${binOctet}.${o[3]}`;
    } else if (targetIndex === 3) {
        binDisplay = `${o[0]}.${o[1]}.${o[2]}.${binOctet}`;
    } else {
        binDisplay = decStr;
    }

    return `<div>${binDisplay}</div><div style="font-weight: 600; color: #4f46e5;">${decStr}</div>`;
}

// ==================== 4. GIẢI THÍCH CHI TIẾT CÁCH TÍNH NHẨM ====================
function renderQuickMathExplanation(step, octetNum, hostBits, totalHosts) {
    const box = document.getElementById('subnet-explanation-box');
    if (!box) return;

    box.innerHTML = `
        <h3 style="color: #065f46; margin-bottom: 10px; font-size: 1.05rem;">1. Quy tắc tính nhẩm 4 bước trong đầu (Không cần đổi nhị phân):</h3>
        <ol style="margin-left: 20px; line-height: 1.8; color: #1e293b;">
            <li><strong>Tính cột Đ/c mạng con:</strong> Mạng đầu tiên bắt đầu bằng <code>0</code>, các mạng kế tiếp cứ <strong>cộng dồn bước nhảy ${step}</strong> ở octet thứ ${octetNum} (ví dụ: 0, ${step}, ${step * 2}, ${step * 3}...).</li>
            <li><strong>Tính cột Broadcast:</strong> Lấy địa chỉ mạng con kế tiếp <strong>trừ đi 1</strong> đơn vị (ví dụ: mạng 2 bắt đầu từ ${step} thì Broadcast mạng 1 là <code>${step} - 1 = ${step - 1}</code>). Mạng con cuối cùng chạm trần 255.</li>
            <li><strong>Tính Đ/c đầu tiên:</strong> Lấy địa chỉ mạng con <strong>cộng thêm 1</strong> (VD: 0 + 1 = 1, ${step} + 1 = ${step + 1}...).</li>
            <li><strong>Tính Đ/c cuối cùng:</strong> Lấy địa chỉ Broadcast <strong>trừ đi 1</strong> (VD: ${step - 1} - 1 = <code>${step - 2}</code>).</li>
        </ol>

        <hr style="border: none; border-top: 1px dashed #86efac; margin: 15px 0;">

        <h3 style="color: #065f46; margin-bottom: 10px; font-size: 1.05rem;">2. Bản chất nhị phân của các con số:</h3>
        <ul style="margin-left: 20px; line-height: 1.8; color: #1e293b;">
            <li>Mỗi mạng con có <strong>${hostBits} bit</strong> dành cho Host (tổng 2<sup>${hostBits}</sup> = ${totalHosts} địa chỉ).</li>
            <li><strong>Địa chỉ mạng:</strong> Toàn bộ ${hostBits} bit Host đều là số <code>0</code> ⇒ Đổi sang thập phân sẽ ra số nhỏ nhất của dải.</li>
            <li><strong>Địa chỉ Broadcast:</strong> Toàn bộ ${hostBits} bit Host đều bật lên số <code>1</code> ⇒ Đổi sang thập phân sẽ ra số lớn nhất của dải.</li>
            <li><strong>Địa chỉ cuối cùng:</strong> Bit cuối cùng là <code>0</code>, các bit Host còn lại là <code>1</code> (VD: đuôi <code>...111110</code>) ⇒ Giá trị luôn luôn bằng <strong>Broadcast - 1</strong>.</li>
        </ul>
    `;
}

// ==================== 5. XUẤT RA FILE WORD (.DOC) THEO MẪU BÀI NỘP ====================
function exportToWord() {
    const stepsContent = document.getElementById('subnet-steps').innerHTML;
    const tableContent = document.getElementById('subnet-result-table').outerHTML;
    const ipStr = document.getElementById('network-ip').value.trim();
    const countReq = document.getElementById('req-count').value;
    const splitType = document.getElementById('split-type').value;

    const deBai = splitType === 'subnets'
        ? `Cho địa chỉ mạng ${ipStr}. Hãy chia địa chỉ mạng này thành ${countReq} mạng con để phân bổ cho ${countReq} bộ phận khác nhau trong một cơ quan.`
        : `Cho địa chỉ mạng ${ipStr}. Hãy chia địa chỉ mạng này sao cho mỗi mạng con đáp ứng tối thiểu ${countReq} thiết bị host.`;

    const htmlDoc = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Bài tập chia mạng con</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; color: #000; }
          h2 { font-size: 15pt; font-weight: bold; margin-bottom: 8px; }
          p { margin: 6px 0; }
          table { border-collapse: collapse; width: 100%; margin-top: 15px; }
          th, td { border: 1px solid #000; padding: 6px; text-align: center; font-size: 11pt; }
          th { background-color: #f2f2f2; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>BÀI TẬP: CHIA MẠNG CON</h2>
        <p><strong>BÀI TẬP:</strong> ${deBai}</p>
        <p><strong>Giải:</strong></p>
        <div>${stepsContent}</div>
        <p style="margin-top: 15px;"><strong>Vùng địa chỉ của các mạng con:</strong></p>
        ${tableContent}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlDoc], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bai_Tap_Chia_Mang_Con_${ipStr.replace(/\./g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}