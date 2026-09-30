// ==================== 1. ĐIỀU KHIỂN CHUYỂN TAB ====================
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    if (window.event && window.event.target) {
        window.event.target.classList.add('active');
    }
    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) {
        targetTab.classList.add('active');
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
        label.innerText = 'Số Host/máy cần mỗi mạng con:';
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

    // Kiểm tra ký tự hợp lệ
    const regexMap = {
        2: /^[01]+$/,         8: /^[0-7]+$/,
        10: /^[0-9]+$/,         16: /^[0-9A-F]+$/
    };

    if (!regexMap[fBase].test(val)) {
        resultValue.innerText = 'Giá trị nhập không hợp lệ!';
        calculationSteps.innerText = 'Vui lòng kiểm tra lại ký tự nhập theo đúng hệ cơ số đã chọn.';
        return;
    }

    // Đổi sang Thập phân (Hệ 10)
    let decVal = 0;
    let steps = `1. Chuyển ${val} (cơ số ${fBase}) sang Hệ 10:\n`;
    for (let i = 0; i < val.length; i++) {
        const char = val[val.length - 1 - i];
        const num = parseInt(char, fBase);
        decVal += num * Math.pow(fBase, i);
        steps += `   ${char} × ${fBase}^${i} = ${num * Math.pow(fBase, i)}\n`;
    }
    steps += `=> Tổng thập phân = ${decVal}\n\n`;

    // Đổi từ Hệ 10 sang Hệ đích
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
        steps += `=> Đọc số dư từ dưới lên: ${finalResult}`;
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

    // Xác định lớp mạng và Prefix mặc định
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
    let borrowBits = 0; // x: số bit mượn
    let remainHostBits = 0; // y: số bit cho host
    let subnetsCount = 0;
    let analysisHtml = '';

    if (splitType === 'subnets') {
        borrowBits = Math.ceil(Math.log2(countReq));
        if (borrowBits > totalDefaultHostBits - 2) {
            alert(`Không thể chia thành ${countReq} mạng con vì không đủ bit Host!`);
            return;
        }
        subnetsCount = countReq;
        remainHostBits = totalDefaultHostBits - borrowBits;
        const targetOctetNum = Math.floor((defaultPrefix + borrowBits - 1) / 8) + 1;

        analysisHtml = `
            <p>• Địa chỉ <strong>${ipStr}</strong> thuộc mạng <strong>lớp ${netClass}</strong>, có Subnet Mask mặc định là: <strong>${defaultMask} (/${defaultPrefix})</strong>.</p>
            <p>• Vì cần chia thành <strong>${countReq} mạng con</strong>, số bit cần mượn từ HostID thỏa mãn: <strong>2<sup>x</sup> ≥ ${countReq}  =>  x = ${borrowBits} bit</strong>.<br>
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
            <p>• Vì mỗi mạng con cần tối thiểu <strong>${countReq} Host</strong>, ta áp dụng công thức: <strong>2<sup>y</sup> - 2 ≥ ${countReq}  =>  y = ${remainHostBits} bit</strong> dành cho Host.</p>
            <p>• Số bit cần mượn từ phần HostID: <strong>x = ${totalDefaultHostBits} - ${remainHostBits} = ${borrowBits} bit</strong> (mượn tại octet thứ ${targetOctetNum}).</p>
        `;
    }

    const newPrefix = defaultPrefix + borrowBits;
    const totalHosts = Math.pow(2, remainHostBits);
    const usableHosts = totalHosts - 2;

    // Tính Subnet Mask nhị phân và thập phân
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

    // Tính bước nhảy
    const targetOctetIndex = Math.floor((newPrefix - 1) / 8);
    const bitsInTargetOctet = newPrefix - (targetOctetIndex * 8);
    const step = Math.pow(2, 8 - bitsInTargetOctet);

    analysisHtml += `
        <p>=> <strong>Địa chỉ Subnet Mask mới:</strong><br>
           Nhị phân: <code>${newMaskBin}</code><br>
           Thập phân: <strong>${newMaskDec}</strong> (Ký hiệu tiền tố: <strong>/${newPrefix}</strong>)</p>
        <p>• <strong>Số bit còn lại cho Host:</strong> ${remainHostBits} bit.</p>
        <p>• <strong>Bước nhảy trên octet thứ ${targetOctetIndex + 1}:</strong> 2<sup>${8 - bitsInTargetOctet}</sup> = <strong>${step}</strong> (tức mỗi mạng con cách nhau ${step} đơn vị ở octet ${targetOctetIndex + 1}).</p>
        <p>• Mỗi mạng con có: <strong>2<sup>${remainHostBits}</sup> = ${totalHosts}</strong> địa chỉ IP (trong đó có ${totalHosts} - 2 = <strong>${usableHosts}</strong> địa chỉ IP khả dụng cho các thiết bị host).</p>
    `;

    document.getElementById('subnet-steps').innerHTML = analysisHtml;

    // Vẽ bảng tự động sinh theo số mạng con
    renderSubnetTable(octets, defaultPrefix, borrowBits, subnetsCount, totalHosts, targetOctetIndex);

    document.getElementById('subnet-result').style.display = 'block';
}

function renderSubnetTable(octets, defaultPrefix, borrowBits, subnetsCount, totalHosts, targetOctetIndex) {
    const tbody = document.getElementById('subnet-table-body');
    tbody.innerHTML = '';

    const baseInt = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
    const maxRender = Math.min(subnetsCount, 128); // Giới hạn vẽ tối đa 128 dòng nếu chia quá nhiều để web mượt

    for (let i = 0; i < maxRender; i++) {
        const netInt = (baseInt + i * totalHosts) >>> 0;
        const firstHostInt = (netInt + 1) >>> 0;
        const bcastInt = (netInt + totalHosts - 1) >>> 0;
        const lastHostInt = (bcastInt - 1) >>> 0;

        const sttBin = borrowBits > 0 ? i.toString(2).padStart(borrowBits, '0') : '0';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="font-weight: bold; border: 1px solid #94a3b8;">${sttBin}</td>
            <td style="border: 1px solid #94a3b8;">${formatIpWithBinary(netInt, targetOctetIndex)}</td>
            <td style="border: 1px solid #94a3b8;">${formatIpWithBinary(firstHostInt, targetOctetIndex)}</td>
            <td style="border: 1px solid #94a3b8;">${formatIpWithBinary(lastHostInt, targetOctetIndex)}</td>
            <td style="border: 1px solid #94a3b8;">${formatIpWithBinary(bcastInt, targetOctetIndex)}</td>
            <td style="border: 1px solid #94a3b8;">Bộ phận ${i + 1}</td>
        `;
        tbody.appendChild(row);
    }

    if (subnetsCount > 128) {
        const trNotice = document.createElement('tr');
        trNotice.innerHTML = `<td colspan="6" style="padding: 10px; color: #64748b; font-style: italic;">(Đã hiển thị trước 128 / ${subnetsCount} mạng con đầu tiên)</td>`;
        tbody.appendChild(trNotice);
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

    return `<div>${binDisplay}</div><div style="font-weight: bold; color: #1e40af;">${decStr}</div>`;
}

// ==================== 4. XUẤT RA FILE WORD (.DOC) THEO MẪU BÀI NỘP ====================
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