// --- Constants & Config ---
const DEBT_GROWTH_PER_SEC = 95000; // Estimated U.S. Debt increase per second ($45,000)
const CITIZEN_POPULATION = 338000000; // Estimated US population

// New: Average interest rate on U.S. national debt
const DEBT_INTEREST_RATE = 0.038; // 3.8% (adjust as needed)

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
const elonSourceEl = document.getElementById('elon-source');
const elonResidenceEl = document.getElementById('elon-residence');

// Facts Elements
const factDaysFundedEl = document.getElementById('fact-days-funded');
const factHoursAccumulateEl = document.getElementById('fact-hours-accumulate');
const factMarsMissionsEl = document.getElementById('fact-mars-missions');

// --- Canvas Background Animation ---
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
            
            // Space particle (Elon) vs Digital particle (Debt)
            this.type = this.x < width / 2 ? 'space' : 'digital';
            this.color = this.type === 'space' ? 'rgba(232, 33, 39, ' : 'rgba(0, 230, 255, ';
            this.alpha = Math.random() * 0.5 + 0.1;
            this.fadeSpeed = Math.random() * 0.005 + 0.002;
            this.fadeDir = 1;
        }

        update() {
            this.x += this.x < width / 2 ? this.speedX : this.speedX * 0.5;
            this.y += this.speedY;

            // Constrain particles to their halves with a soft border
            if (this.x < 0 || this.x > width) this.x = Math.random() * width;
            if (this.y < 0 || this.y > height) this.y = Math.random() * height;

            // Recalculate side type
            this.type = this.x < width / 2 ? 'space' : 'digital';
            this.color = this.type === 'space' ? 'rgba(232, 33, 39, ' : 'rgba(0, 230, 255, ';

            // Soft pulse alpha
            this.alpha += this.fadeSpeed * this.fadeDir;
            if (this.alpha > 0.6 || this.alpha < 0.1) {
                this.fadeDir *= -1;
            }
        }

        draw() {
            ctx.beginPath();
            if (this.type === 'space') {
                // Star shape or round dot
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `${this.color}${this.alpha})`;
                ctx.fill();
            } else {
                // Digital grid dot or line segment
                ctx.rect(this.x, this.y, this.size * 2, this.size * 2);
                ctx.fillStyle = `${this.color}${this.alpha * 0.8})`;
                ctx.fill();
                
                // Occasional tiny matrix vertical grid lines
                if (Math.random() < 0.002) {
                    ctx.strokeStyle = `rgba(0, 230, 255, 0.05)`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(this.x, 0);
                    ctx.lineTo(this.x, height);
                    ctx.stroke();
                }
            }
        }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.fillStyle = 'rgba(7, 9, 19, 0.1)'; // Fade trail
        ctx.fillRect(0, 0, width, height);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        // Draw soft divider glow in center
        const gradient = ctx.createLinearGradient(width / 2 - 2, 0, width / 2 + 2, height);
        gradient.addColorStop(0, 'rgba(255, 199, 0, 0.01)');
        gradient.addColorStop(0.5, 'rgba(255, 199, 0, 0.08)');
        gradient.addColorStop(1, 'rgba(255, 199, 0, 0.01)');
        ctx.fillStyle = gradient;
        ctx.fillRect(width / 2 - 1, 0, 2, height);

        requestAnimationFrame(animate);
    }
    animate();
}

// --- Formatters ---
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function formatBillion(amount) {
    return (amount / 1_000_000_000).toFixed(2);
}

// --- Fetch Data ---
async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Data file not found.');
        
        const data = await response.json();
        
        baseDebt = data.us_debt;
        baseDebtDate = new Date(data.us_debt_date + 'T12:00:00'); // set local noon to avoid timezone shift
        elonWorth = data.elon_worth;
        ratio = data.ratio;
        lastUpdated = data.last_updated;

        // Display Static Data
        elonNetWorthEl.textContent = formatCurrency(elonWorth).split('.')[0]; // remove cents for cleaner layout
        elonNetWorthEl.classList.remove('loading-pulse');
        
        // Try setting custom Forbes avatar
        elonAvatarEl.src = "https://specials-images.forbesimg.com/imageserve/62d700cd6094d2c180f269b9/416x416.jpg?background=000000&cropX1=0&cropX2=959&cropY1=0&cropY2=959";
        elonAvatarEl.classList.remove('hidden');

        debtReportDateEl.textContent = data.us_debt_date;
        lastUpdatedTimeEl.textContent = lastUpdated;

        // Calculate initial citizen statistics
        const debtPerCitizen = baseDebt / CITIZEN_POPULATION;
        debtPerCitizenEl.textContent = formatCurrency(debtPerCitizen).split('.')[0];

        // Start Live Debt Clock
        startDebtClock();

        // Load Ratio Visualizer & Facts
        renderRatioDetails();
        
    } catch (error) {
        console.error('Error loading data:', error);
        ratioDescEl.textContent = 'Error loading live tracker. Please verify that the data updates script ran successfully.';
    }
}

// --- Live Debt Clock Animation ---
function startDebtClock() {
    usDebtClockEl.classList.remove('loading-pulse');

    function tick() {
        const now = new Date();
        // Calculate difference in milliseconds between now and report date
        const timeDiffSeconds = Math.max(0, (now.getTime() - baseDebtDate.getTime()) / 1000);
        
        // Add estimated growth since report
        const currentEstimatedDebt = baseDebt + (timeDiffSeconds * DEBT_GROWTH_PER_SEC);
        
        // Update display
        usDebtClockEl.textContent = formatCurrency(currentEstimatedDebt);
        
        // Smooth loop
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

// --- Render Visualizer & Facts ---
function renderRatioDetails() {
    // 1. Set Ratio number
    ratioNumberEl.textContent = ratio.toFixed(4);
    ratioNumberEl.classList.remove('loading-pulse');

    // 2. Set description text
    const elonBillions = formatBillion(elonWorth);
    const debtTrillions = (baseDebt / 1_000_000_000_000).toFixed(2);
    
    ratioDescEl.innerHTML = `It would take exactly <strong class="accent-text">${ratio.toFixed(2)} clones</strong> of Elon Musk's entire fortune ($${elonBillions}B) to pay off the U.S. National Debt ($${debtTrillions}T).`;

    // 3. Render Grid Clones
    visualizerWorthEl.textContent = elonBillions;
    gridVisualizerEl.innerHTML = '';
    
    const totalIconsNeeded = Math.ceil(ratio);
    
    for (let i = 1; i <= totalIconsNeeded; i++) {
        const iconBox = document.createElement('div');
        iconBox.className = 'visual-icon-box';
        
        const overlay = document.createElement('div');
        overlay.className = 'fill-overlay';
        iconBox.appendChild(overlay);

        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-user-tie'; // professional/suit icon representing Elon
        iconBox.appendChild(icon);

        if (i < ratio) {
            // Full Elon
            iconBox.classList.add('filled');
            iconBox.setAttribute('data-tooltip', `Elon #${i}: Fully Paid ($${elonBillions}B)`);
        } else {
            // Partial last Elon
            iconBox.classList.add('partial');
            const percentRemaining = (ratio - Math.floor(ratio)) * 100;
            overlay.style.height = `${percentRemaining}%`;
            
            const partialWorth = formatCurrency(elonWorth * (percentRemaining / 100)).split('.')[0];
            iconBox.setAttribute('data-tooltip', `Elon #${i} (Partially Filled): ${percentRemaining.toFixed(1)}% (${partialWorth})`);
        }

        gridVisualizerEl.appendChild(iconBox);
    }

    // 4. Calculate Fact items
    // Buyout Days funded = Elon worth / total US federal spending per day
    // U.S. Federal government daily spending is roughly $17-18 Billion ($6.3 Trillion / 365)
    const dailySpendingEstimate = 22500000000;
    const daysFunded = elonWorth / dailySpendingEstimate;
    factDaysFundedEl.textContent = daysFunded.toFixed(1);

    // Debt accumulation days to equal 1 Elon
    const growthPerDay = DEBT_GROWTH_PER_SEC * 86400;           // 86400 seconds in a day
    const daysToAccumulate = elonWorth / growthPerDay;
    factHoursAccumulateEl.textContent = daysToAccumulate.toFixed(1);

    // Mars missions: Estimate cost of Mars crewed mission ~ $10 Billion
    const marsMissionCost = 17000000000;
    const marsMissions = baseDebt / marsMissionCost;
    factMarsMissionsEl.textContent = Math.floor(marsMissions).toLocaleString();
}

// --- Main Init ---
document.addEventListener('DOMContentLoaded', () => {
    initBackgroundAnimation();
    loadData();
});
