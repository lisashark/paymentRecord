// task.md: Google OAuth config
const CLIENT_ID = "991561900008-6k3ok2g8d6tb2egtl1aj1ql2a4hgi9cd.apps.googleusercontent.com";
const SPREADSHEET_ID = "1Aq3CdxGaPHBMCamPD0hajwm35b6Ik8BJMR7dA84jnx8";
const SHEET_RECORDS = "記帳紀錄";
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

let tokenClient;
let accessToken = null;
let currentRecords = [];
let chartInstance = null;

const categories = {
    "支出": ["餐飲食品", "交通運輸", "居家生活", "休閒娛樂", "學習成長", "醫療保健", "購物服飾", "其他雜項"],
    "收入": ["薪水", "信用卡回饋", "其他收入"]
};

// UI Elements
const ui = {
    authBtn: document.getElementById('auth-button'),
    mainContent: document.getElementById('main-content'),
    form: document.getElementById('record-form'),
    typeRadios: document.querySelectorAll('input[name="type"]'),
    categorySelect: document.getElementById('category'),
    dateInput: document.getElementById('date'),
    monthFilter: document.getElementById('month-filter'),
    clearMonthBtn: document.getElementById('clear-month'),
    categoryFilter: document.getElementById('category-filter'),
    tbody: document.getElementById('records-tbody'),
    totalIncome: document.getElementById('total-income'),
    totalExpense: document.getElementById('total-expense'),
    netIncome: document.getElementById('net-income'),
    spinner: document.getElementById('loading-spinner'),
    submitBtn: document.getElementById('submit-btn'),
};

function init() {
    // init google gsi
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
                accessToken = tokenResponse.access_token;
                handleLoginSuccess();
            } else {
                handleLoginError();
            }
        },
    });

    // Default Date to today
    ui.dateInput.valueAsDate = new Date();
    
    // Default Month Filter to current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    ui.monthFilter.value = currentMonth;

    ui.authBtn.addEventListener('click', handleAuthClick);
    ui.typeRadios.forEach(radio => radio.addEventListener('change', updateCategoryOptions));
    ui.form.addEventListener('submit', handleFormSubmit);
    ui.monthFilter.addEventListener('change', renderData);
    ui.clearMonthBtn.addEventListener('click', () => { ui.monthFilter.value = ''; renderData(); });
    ui.categoryFilter.addEventListener('change', renderData);

    updateCategoryOptions();
    updateCategoryFilterOptions();
}

function handleAuthClick() {
    if (!accessToken) {
        // request access token
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        // sign out
        google.accounts.oauth2.revoke(accessToken, () => {
            accessToken = null;
            handleLogoutSuccess();
        });
    }
}

function handleLoginSuccess() {
    ui.authBtn.textContent = "登出";
    ui.mainContent.style.display = 'flex';
    loadRecords();
}

function handleLoginError() {
    ui.authBtn.textContent = "登入";
    ui.mainContent.style.display = 'none';
    alert("登入失敗");
}

function handleLogoutSuccess() {
    ui.authBtn.textContent = "登入";
    ui.mainContent.style.display = 'none';
    currentRecords = [];
}

function updateCategoryOptions() {
    const selectedType = document.querySelector('input[name="type"]:checked').value;
    const cats = categories[selectedType] || [];
    ui.categorySelect.innerHTML = '';
    cats.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        ui.categorySelect.appendChild(opt);
    });
}

function updateCategoryFilterOptions() {
    ui.categoryFilter.innerHTML = '<option value="all">所有類別</option>';
    [...categories["支出"], ...categories["收入"]].forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        ui.categoryFilter.appendChild(opt);
    });
}

// Data loading
async function loadRecords() {
    ui.spinner.style.display = 'block';
    ui.tbody.innerHTML = '';
    
    try {
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_RECORDS)}!A:H`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            cache: 'no-store'
        });
        if (!response.ok) throw new Error("Fetch failed");
        
        const data = await response.json();
        const rows = data.values;
        if (rows && rows.length > 1) {
            // ID(0), Date(1), Type(2), Category(3), Amount(4), Description(5), note(6), created_at(7)
            currentRecords = rows.slice(1).map((row, index) => {
                return {
                    rowIndex: index + 2, // Used for deletion (1-based index + 1 for header)
                    id: row[0],
                    date: row[1],
                    type: row[2],
                    category: row[3],
                    amount: parseFloat(row[4]) || 0,
                    description: row[5] || "",
                    note: row[6] || "",
                    createdAt: row[7] || ""
                };
            });
        } else {
            currentRecords = [];
        }
        
        renderData();
    } catch (e) {
        console.error("載入失敗", e);
        alert("歷史資料載入出現問題：" + e.message);
    } finally {
        ui.spinner.style.display = 'none';
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    ui.submitBtn.disabled = true;
    ui.submitBtn.textContent = "傳送中...";

    const newRecord = [
        new Date().getTime().toString(), // ID
        ui.dateInput.value,              // Date
        document.querySelector('input[name="type"]:checked').value, // Type
        ui.categorySelect.value,         // Category
        document.getElementById('amount').value, // Amount
        document.getElementById('description').value, // Description
        document.getElementById('note').value,    // note
        new Date().toISOString()         // created_at
    ];

    try {
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_RECORDS)}!A:H:append?valueInputOption=USER_ENTERED`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: [newRecord]
            })
        });

        if (!response.ok) throw new Error("Append failed");

        // 成功後，跳出彈窗顯示"已送出"
        alert("已送出");
        
        // Reset parts of form
        document.getElementById('amount').value = "";
        document.getElementById('description').value = "";
        document.getElementById('note').value = "";
        
        await loadRecords();
    } catch (error) {
        console.error("送出失敗", error);
        // 失敗後，跳出彈窗顯示"送出失敗"
        alert("送出失敗");
    } finally {
        ui.submitBtn.disabled = false;
        ui.submitBtn.textContent = "送出紀錄";
    }
}

// Ensure deleteRecord is accessible globally for inline onclick
window.deleteRecord = async function(rowIndex, uid) {
    try {
        const sheetId = await getSheetIdByName(SHEET_RECORDS);
        const batchUpdateRequest = {
            requests: [
                {
                    deleteDimension: {
                        range: {
                            sheetId: sheetId,
                            dimension: "ROWS",
                            startIndex: rowIndex - 1,
                            endIndex: rowIndex
                        }
                    }
                }
            ]
        };

        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(batchUpdateRequest)
        });

        if (response.ok) {
            alert("已刪除");
            await loadRecords();
        } else {
            throw new Error("BatchUpdate Failed");
        }
    } catch (e) {
        console.error("刪除失敗", e);
        alert("刪除失敗");
    }
}

async function getSheetIdByName(sheetName) {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets(properties(sheetId,title))`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await response.json();
    const sheet = data.sheets.find(s => s.properties.title === sheetName);
    return sheet.properties.sheetId;
}

function renderData() {
    const month = ui.monthFilter.value; // format: "YYYY-MM"
    const catFilter = ui.categoryFilter.value;
    
    let filtered = currentRecords;

    if (month) {
        filtered = filtered.filter(r => {
            if (!r.date) return false;
            // 處理 Google sheet 可能是 `2026/1/1` 等多種日期的狀況
            let parts = String(r.date).split(/[\/\-]/);
            if (parts.length >= 2 && parts[0].length === 4) {
                const year = parts[0];
                const m = parts[1].padStart(2, '0');
                if (`${year}-${m}` === month) return true;
            }
            return String(r.date).startsWith(month);
        });
    }
    
    if (catFilter !== 'all') {
        filtered = filtered.filter(r => r.category === catFilter);
    }

    filtered.sort((a,b) => new Date(b.date) - new Date(a.date));

    let tIncome = 0;
    let tExpense = 0;
    let categoryStats = {};

    ui.tbody.innerHTML = '';
    filtered.forEach(r => {
        const tr = document.createElement('tr');
        const amountDisplay = r.type === '收入' ? `+$${r.amount.toLocaleString()}` : `-$${r.amount.toLocaleString()}`;
        const amountClass = r.type === '收入' ? 'income-text' : 'expense-text';
        
        tr.innerHTML = `
            <td>${r.date}</td>
            <td>${r.type}</td>
            <td>${r.category}</td>
            <td class="${amountClass}">${amountDisplay}</td>
            <td>${r.description}</td>
            <td>${r.note}</td>
            <td><button class="btn delete-btn" onclick="deleteRecord(${r.rowIndex}, '${r.id}')">刪除</button></td>
        `;
        ui.tbody.appendChild(tr);

        // Stats
        if (r.type === '收入') {
            tIncome += r.amount;
        } else {
            tExpense += r.amount;
            categoryStats[r.category] = (categoryStats[r.category] || 0) + r.amount;
        }
    });

    ui.totalIncome.textContent = `$${tIncome.toLocaleString()}`;
    ui.totalExpense.textContent = `$${tExpense.toLocaleString()}`;
    const net = tIncome - tExpense;
    ui.netIncome.textContent = net >= 0 ? `$${net.toLocaleString()}` : `-$${Math.abs(net).toLocaleString()}`;
    ui.netIncome.style.color = net >= 0 ? 'var(--income-color)' : 'var(--expense-color)';

    renderChart(categoryStats);
}

function renderChart(categoryData) {
    const ctx = document.getElementById('expense-chart').getContext('2d');
    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    
    const pieColors = [
        '#E27B7B', '#DDA77B', '#87A985', '#D9C179', 
        '#79A8B6', '#9B8DB8', '#D48C9A', '#C6A58E'
    ];

    if (chartInstance) {
        chartInstance.destroy();
    }

    if (labels.length === 0) {
        return; 
    }

    chartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: pieColors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: {
                    display: true,
                    text: '本月支出比例',
                    font: { family: "'M PLUS Rounded 1c', sans-serif" }
                }
            }
        }
    });
}

// Startup check
window.onload = function() {
    if (window.google && window.google.accounts) {
         init();
    } else {
        let retries = 0;
        let intv = setInterval(() => {
            if (window.google && window.google.accounts) {
                clearInterval(intv);
                init();
            } else if (retries++ > 10) {
                clearInterval(intv);
                console.error("GIS API載入失敗或超時");
            }
        }, 300);
    }
}