const sourceBase = document.getElementById("sourceBase");
const targetBase = document.getElementById("targetBase");

const numberInput = document.getElementById("numberInput");

const convertButton = document.getElementById("convertButton");
const clearButton = document.getElementById("clearButton");

const resultCard = document.getElementById("resultCard");
const stepsCard = document.getElementById("stepsCard");

const result = document.getElementById("result");
const steps = document.getElementById("steps");

const errorBox = document.getElementById("errorBox");

const hint = document.getElementById("hint");


// =====================================================
// CẬP NHẬT GỢI Ý NHẬP
// =====================================================

sourceBase.addEventListener("change", function () {

    const base = Number(sourceBase.value);

    if (base === 2) {
        hint.textContent =
            "Hệ 2: chỉ được nhập 0 và 1";
    }

    else if (base === 8) {
        hint.textContent =
            "Hệ 8: chỉ được nhập 0 đến 7";
    }

    else if (base === 10) {
        hint.textContent =
            "Hệ 10: chỉ được nhập 0 đến 9";
    }

    else if (base === 16) {
        hint.textContent =
            "Hệ 16: nhập 0–9 hoặc A–F";
    }
});


// =====================================================
// KIỂM TRA KÝ TỰ
// =====================================================

function findInvalidCharacter(value, base) {

    const validCharacters = {

        2: "01",

        8: "01234567",

        10: "0123456789",

        16: "0123456789ABCDEFabcdef"
    };

    const allowed = validCharacters[base];

    for (let i = 0; i < value.length; i++) {

        if (!allowed.includes(value[i])) {

            return {
                character: value[i],
                position: i + 1
            };
        }
    }

    return null;
}


// =====================================================
// KÝ TỰ → GIÁ TRỊ
// =====================================================

function characterToValue(character) {

    character = character.toUpperCase();

    if (character >= "0" && character <= "9") {
        return Number(character);
    }

    return character.charCodeAt(0) - "A".charCodeAt(0) + 10;
}


// =====================================================
// GIÁ TRỊ → KÝ TỰ
// =====================================================

function valueToCharacter(value) {

    if (value < 10) {
        return String(value);
    }

    return String.fromCharCode(
        "A".charCodeAt(0) + value - 10
    );
}


// =====================================================
// ĐỔI HỆ NGUỒN → THẬP PHÂN
// =====================================================

function convertToDecimal(value, base) {

    let decimal = 0n;

    const calculationSteps = [];

    const length = value.length;


    for (let i = 0; i < length; i++) {

        const character = value[i];

        const digit = characterToValue(character);

        const exponent = length - 1 - i;

        const power = BigInt(base) ** BigInt(exponent);

        const component =
            BigInt(digit) * power;

        decimal =
            decimal * BigInt(base) +
            BigInt(digit);


        calculationSteps.push(
            `${character} × ${base}^${exponent} = ` +
            `${digit} × ${power} = ${component}`
        );
    }


    calculationSteps.push(
        `Cộng tất cả → ${decimal}`
    );


    return {
        decimal: decimal,
        steps: calculationSteps
    };
}


// =====================================================
// THẬP PHÂN → HỆ KHÁC
// =====================================================

function convertFromDecimal(decimal, base) {

    if (decimal === 0n) {

        return {
            value: "0",
            steps: [
                "0 ở mọi hệ cơ số đều bằng 0."
            ]
        };
    }


    let current = decimal;

    let remainders = [];

    let calculationSteps = [];


    while (current > 0n) {

        const divisor = BigInt(base);

        const quotient =
            current / divisor;

        const remainder =
            current % divisor;


        const remainderCharacter =
            valueToCharacter(
                Number(remainder)
            );


        calculationSteps.push(
            `${current} ÷ ${base} = ` +
            `${quotient} dư ${remainderCharacter}`
        );


        remainders.push(
            remainderCharacter
        );


        current = quotient;
    }


    const result =
        remainders
            .reverse()
            .join("");


    calculationSteps.push(
        `Số dư theo thứ tự tính: ` +
        `${remainders.slice().reverse().join("")}`
    );

    calculationSteps.push(
        `Đọc từ dưới lên: ${result}`
    );


    return {
        value: result,
        steps: calculationSteps
    };
}


// =====================================================
// CHUYỂN ĐỔI
// =====================================================

function convertNumber() {

    hideError();

    resultCard.classList.add("hidden");
    stepsCard.classList.add("hidden");


    const baseFrom =
        Number(sourceBase.value);

    const baseTo =
        Number(targetBase.value);

    let value =
        numberInput.value.trim();


    // Không nhập gì
    if (value === "") {

        showError(
            "❌ Bạn chưa nhập số cần đổi."
        );

        return;
    }


    // Kiểm tra ký tự
    const invalid =
        findInvalidCharacter(
            value,
            baseFrom
        );


    if (invalid !== null) {

        showError(
            `❌ Ký tự sai: '${invalid.character}'<br>` +
            `📍 Vị trí: ${invalid.position}<br>` +
            `📌 Hệ ${baseFrom} không cho phép ký tự này.`
        );

        return;
    }


    // Đổi về chữ hoa để kết quả Hex thống nhất
    value = value.toUpperCase();


    // =================================================
    // BƯỚC 1: ĐỔI HỆ NGUỒN → THẬP PHÂN
    // =================================================

    const decimalResult =
        convertToDecimal(
            value,
            baseFrom
        );


    let decimal =
        decimalResult.decimal;


    let allSteps = [];


    if (baseFrom !== 10) {

        allSteps.push(
            `<strong>Đổi ${value} (hệ ${baseFrom}) → thập phân</strong>`
        );

        decimalResult.steps.forEach(step => {

            allSteps.push(
                step
            );
        });
    }


    // =================================================
    // BƯỚC 2: THẬP PHÂN → HỆ ĐÍCH
    // =================================================

    let finalValue;


    if (baseTo === 10) {

        finalValue =
            decimal.toString();

    } else {

        const converted =
            convertFromDecimal(
                decimal,
                baseTo
            );


        finalValue =
            converted.value;


        if (baseFrom !== baseTo) {

            allSteps.push(
                `<strong>Đổi thập phân → hệ ${baseTo}</strong>`
            );


            converted.steps.forEach(step => {

                allSteps.push(
                    step
                );
            });
        }
    }


    // =================================================
    // HIỂN THỊ KẾT QUẢ
    // =================================================

    result.innerHTML =
        `${value}<sub>${baseFrom}</sub> ` +
        `= ` +
        `${finalValue}<sub>${baseTo}</sub>`;


    steps.innerHTML = "";


    allSteps.forEach(step => {

        const div =
            document.createElement("div");

        div.className = "step";

        div.innerHTML = step;

        steps.appendChild(div);
    });


    resultCard.classList.remove("hidden");
    stepsCard.classList.remove("hidden");
}


// =====================================================
// HIỂN THỊ LỖI
// =====================================================

function showError(message) {

    errorBox.innerHTML = message;

    errorBox.classList.remove("hidden");
}


function hideError() {

    errorBox.classList.add("hidden");

    errorBox.innerHTML = "";
}


// =====================================================
// XÓA
// =====================================================

function clearAll() {

    numberInput.value = "";

    result.innerHTML = "";

    steps.innerHTML = "";

    resultCard.classList.add("hidden");

    stepsCard.classList.add("hidden");

    hideError();
}


// =====================================================
// NÚT
// =====================================================

convertButton.addEventListener(
    "click",
    convertNumber
);


clearButton.addEventListener(
    "click",
    clearAll
);


// Cho phép nhấn Enter
numberInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {
            convertNumber();
        }
    }
);
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
            .then(() => {
                console.log("Service Worker đã đăng ký.");
            })
            .catch(error => {
                console.error("Service Worker lỗi:", error);
            });
    });
}