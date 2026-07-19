// --- Constants & Config ---
const DEBT_GROWTH_PER_SEC = 95000;
const CITIZEN_POPULATION = 338000000;
const DEBT_INTEREST_RATE = 0.038; // 3.8%

// State variables
let baseDebt = 0;
let baseDebtDate = null;
let elonWorth = 0;
let ratio = 0;
let lastUpdated = '';

// DOM Elements
const elonNetWorthEl = document.getElementById('elon-net-worth');
const usDebtClockEl = document.getElementById('us-debt-clock');
const ratioNumberEl = document.getElementById('ratio-number');
const ratioDescEl = document.getElementById('ratio-description-text');
const debtReportDateEl = document.getElementById('debt-report-date');
const debtPerCitizenEl = document.getElementById('debt-per-citizen');
const lastUpdatedTimeEl = document.getElementById('last-updated-time');
const gridVisualizerEl = document.getElementById('grid-visualizer');
const visualizerWorthEl = document.getElementById('visualizer-worth');
const elonAvatarEl = document.getElementById('elon-avatar');

// Facts Elements
const factDaysFundedEl = document.getElementById('fact-days-funded');
const factHoursAccumulateEl = document.getElementById('fact-hours-accumulate');
const factMarsMissionsEl = document.getElementById('fact-mars-missions');

// --- Background Animation (kept from your original) ---
function initBackgroundAnimation() {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = 60;

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.3;
            this.speedY = (Math.random() - 0.5) * 0.3;
            this.type = this.x < width / 2 ? 'space' : 'digital';
            this.color = this.type === 'space' ? 'rgba(232, 33, 39, ' : 'rgba(0, 230, 255, ';
            this.alpha = Math.random() * 0.5 + 0.1;
            this.fadeSpeed = Math.random() * 0.005 + 0.002;
            this.fadeDir = 1;
        }

        update() {
            this.x += this.x < width / 2 ? this.speedX : this.speedX * 0.5;
            this.y += this.speedY;
            if (this.x < 0 || this.x > width) this.x = Math.random() * width;
            if (this.y < 0 || this.y > height) this.y = Math.random() * height;
            this.type = this.x < width / 2 ? 'space' : 'digital';
            this.color = this.type === 'space' ? 'rgba(232, 33, 39, ' : 'rgba(0, 230, 255, ';
            this.alpha += this.fadeSpeed * this.fadeDir;
            if (this.alpha > 0.6 || this.alpha < 0.1) this.fadeDir *= -1;
        }

        draw() {
            ctx.beginPath();
            if (this.type === 'space') {
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `${this.color}${this.alpha})`;
                ctx.fill();
            } else {
                ctx.rect(this.x, this.y, this.size * 2, this.size * 2);
                ctx.fillStyle = `${this.color}${this.alpha * 0.8})`;
                ctx.fill();
            }
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.fillStyle = 'rgba(7, 9, 19, 0.1)';
        ctx.fillRect(0, 0, width, height);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animate);
    }
    animate();
}

// --- Formatters ---
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD', minimumFractionDigits: 0
    }).format(amount);
}

function formatBillion(amount) {
    return (amount / 1_000_000_000).toFixed(2);
}

// --- Fetch Data ---
async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Data file not found');
        
        const data = await response.json();
        
        baseDebt = data.us_debt;
        baseDebtDate = new Date(data.us_debt_date + 'T12:00:00');
        elonWorth = data.elon_worth;
        ratio = data.ratio;
        lastUpdated = data.last_updated;

        if (elonNetWorthEl) elonNetWorthEl.textContent = formatCurrency(elonWorth).split('.')[0];
        if (debtReportDateEl) debtReportDateEl.textContent = data.us_debt_date;
        if (lastUpdatedTimeEl) lastUpdatedTimeEl.textContent = lastUpdated;

        const debtPerCitizen = baseDebt / CITIZEN_POPULATION;
        if (debtPerCitizenEl) debtPerCitizenEl.textContent = formatCurrency(debtPerCitizen).split('.')[0];

        startDebtClock();
        renderRatioDetails();

    } catch (error) {
        console.error('Error loading data:', error);
        if (ratioDescEl) ratioDescEl.textContent = 'Error loading live tracker.';
    }
}

// --- Live Debt Clock ---
function startDebtClock() {
    if (!usDebtClockEl) return;

    function tick() {
        const now = new Date();
        const timeDiffSeconds = Math.max(0, (now.getTime() - baseDebtDate.getTime()) / 1000);
        const currentDebt = baseDebt + (timeDiffSeconds * DEBT_GROWTH_PER_SEC);
        usDebtClockEl.textContent = formatCurrency(currentDebt);
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

// --- Render Visualizer & Facts (FULL VERSION) ---
function renderRatioDetails() {
    if (!ratioNumberEl) return;

    // Ratio Number
    ratioNumberEl.textContent = ratio.toFixed(4);

    const elonBillions = formatBillion(elonWorth);
    const debtTrillions = (baseDebt / 1_000_000_000_000).toFixed(2);

    if (ratioDescEl) {
        ratioDescEl.innerHTML = `It would take exactly <strong class="accent-text">${ratio.toFixed(2)} clones</strong> of Elon Musk's entire fortune ($${elonBillions}B) to pay off the U.S. National Debt ($${debtTrillions}T).`;
    }

    // Grid Visualizer
    if (visualizerWorthEl) visualizerWorthEl.textContent = elonBillions;
    if (gridVisualizerEl) gridVisualizerEl.innerHTML = '';

    const totalIconsNeeded = Math.ceil(ratio);
    for (let i = 1; i <= totalIconsNeeded; i++) {
        const iconBox = document.createElement('div');
        iconBox.className = 'visual-icon-box';
        const overlay = document.createElement('div');
        overlay.className = 'fill-overlay';
        iconBox.appendChild(overlay);

        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-user-tie';
        iconBox.appendChild(icon);

        if (i < ratio) {
            iconBox.classList.add('filled');
        } else {
            iconBox.classList.add('partial');
            const percentRemaining = (ratio - Math.floor(ratio)) * 100;
            overlay.style.height = `${percentRemaining}%
