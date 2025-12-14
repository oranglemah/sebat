// Static Data Mode
const DATA_FILE = 'film.json';
const TV_FILE = 'tv.json';

// State
let allFilmsData = [];
let allTVData = [];
let currentPage = 1;
let currentType = 'film';
let currentFilters = {};
let currentSearch = '';

// Elements
const filmsGrid = document.getElementById('filmsGrid');
const loading = document.getElementById('loading');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const filterSidebar = document.getElementById('filterSidebar');
const toggleFilterBtn = document.getElementById('toggleFilter');
const closeFilterBtn = document.getElementById('closeFilter');
const genreFilter = document.getElementById('genreFilter');
const yearFilter = document.getElementById('yearFilter');
const ratingFilter = document.getElementById('ratingFilter');
const countryFilter = document.getElementById('countryFilter');
const applyFilterBtn = document.getElementById('applyFilter');
const resetFilterBtn = document.getElementById('resetFilter');
const statsEl = document.getElementById('stats');

// Init
document.addEventListener('DOMContentLoaded', async () => {
    await loadInitialData();
    setupEventListeners();
});

// Load Data Once
async function loadInitialData() {
    showLoading(true);
    try {
        const [filmsRes, tvRes] = await Promise.all([
            fetch(DATA_FILE),
            fetch(TV_FILE)
        ]);

        allFilmsData = await filmsRes.json();
        allTVData = await tvRes.json();

        // Calculate Stats Dynamically
        calculateAndShowStats();

        // Initial Render
        renderCurrentPage();

    } catch (error) {
        console.error('Error loading data:', error);
        if (filmsGrid) filmsGrid.innerHTML = '<p style="text-align:center;">Gagal memuat database film.</p>';
    } finally {
        showLoading(false);
    }
}

// Calculate Stats
function calculateAndShowStats() {
    const allItems = [...allFilmsData, ...allTVData];
    const genres = new Set();
    const years = new Set();
    const countries = new Set();

    allItems.forEach(item => {
        if (item.genre) item.genre.split(',').forEach(g => genres.add(g.trim()));
        if (item.year) years.add(item.year);
        if (item.country) countries.add(item.country.trim());
    });

    if (statsEl) {
        statsEl.textContent = `${allFilmsData.length.toLocaleString()} Films • ${allTVData.length.toLocaleString()} TV Series`;
    }

    populateDropdown('genreDropdown', 'genreFilter', Array.from(genres), 'genre');
    populateDropdown('yearDropdown', 'yearFilter', Array.from(years).sort().reverse(), 'year');
    populateDropdown('countryDropdown', 'countryFilter', Array.from(countries), 'country');
}

// Main Render Logic
function renderCurrentPage() {
    showLoading(true);

    // 1. Select Data
    let data = currentType === 'film' ? allFilmsData : allTVData;

    // 2. Filter & Search
    let filtered = filterData(data);

    // 3. Paginate
    const limit = 20;
    const totalPages = Math.ceil(filtered.length / limit);
    const start = (currentPage - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    // 4. Render
    renderFilms(paginated);
    renderPagination({
        page: currentPage,
        totalPages: totalPages,
        hasPrev: currentPage > 1,
        hasNext: currentPage < totalPages
    });

    showLoading(false);
}

// Filter Logic
function filterData(data) {
    let result = [...data];

    // Search
    if (currentSearch) {
        const q = currentSearch.toLowerCase();
        result = result.filter(item =>
            (item.title && item.title.toLowerCase().includes(q)) ||
            (item.genre && item.genre.toLowerCase().includes(q))
        );
    }

    // Filters
    if (currentFilters.genre) {
        result = result.filter(item => item.genre && item.genre.toLowerCase().includes(currentFilters.genre.toLowerCase()));
    }
    if (currentFilters.year) {
        result = result.filter(item => item.year == currentFilters.year); // non-strict eq
    }
    if (currentFilters.country) {
        result = result.filter(item => item.country && item.country.toLowerCase().includes(currentFilters.country.toLowerCase()));
    }
    if (currentFilters.rating) { // "7+" -> 7
        const minRating = parseFloat(currentFilters.rating);
        if (!isNaN(minRating)) {
            result = result.filter(item => parseFloat(item.rating) >= minRating);
        }
    }

    return result;
}

// ... EVENT LISTENERS & UI HELPERS (Same as before but calling renderCurrentPage) ...

function setupEventListeners() {
    searchBtn && searchBtn.addEventListener('click', handleSearch);
    searchInput && searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    toggleFilterBtn && toggleFilterBtn.addEventListener('click', () => filterSidebar.classList.add('open'));
    closeFilterBtn && closeFilterBtn.addEventListener('click', () => filterSidebar.classList.remove('open'));

    applyFilterBtn && applyFilterBtn.addEventListener('click', handleFilter);
    resetFilterBtn && resetFilterBtn.addEventListener('click', handleResetFilter);

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.getAttribute('href') === '#tv') {
                e.preventDefault();
                currentType = 'tv';
                currentPage = 1;
                renderCurrentPage();
                updateNavActive(link);
            }
            if (link.getAttribute('href') === '#film') { // If present
                e.preventDefault();
                currentType = 'film';
                currentPage = 1;
                renderCurrentPage();
                updateNavActive(link);
            }
        });
    });
}

function updateNavActive(activeLink) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    activeLink.classList.add('active');
}

function handleSearch() {
    if (!searchInput) return;
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    renderCurrentPage();
}

function handleFilter() {
    currentFilters = {};
    if (genreFilter && genreFilter.value) currentFilters.genre = genreFilter.value;
    if (yearFilter && yearFilter.value) currentFilters.year = yearFilter.value;
    if (ratingFilter && ratingFilter.value) currentFilters.rating = ratingFilter.value;
    if (countryFilter && countryFilter.value) currentFilters.country = countryFilter.value;

    currentPage = 1;
    renderCurrentPage();
    if (filterSidebar) filterSidebar.classList.remove('open');
}

function handleResetFilter() {
    currentFilters = {};
    currentSearch = '';
    if (searchInput) searchInput.value = '';
    if (genreFilter) genreFilter.value = '';
    if (yearFilter) yearFilter.value = '';
    if (ratingFilter) ratingFilter.value = '';
    if (countryFilter) countryFilter.value = '';

    currentPage = 1;
    renderCurrentPage();
    if (filterSidebar) filterSidebar.classList.remove('open');
}

function applyQuickFilter(type, value) {
    currentFilters = {};
    currentFilters[type] = value;
    currentSearch = '';

    // Update Sidebar
    if (type === 'genre' && genreFilter) genreFilter.value = value;
    if (type === 'year' && yearFilter) yearFilter.value = value;
    if (type === 'country' && countryFilter) countryFilter.value = value;

    currentPage = 1;
    // Auto switch to film
    currentType = 'film';
    renderCurrentPage();
    window.scrollTo({ top: 300, behavior: 'smooth' });
}

function goToPage(page) {
    currentPage = page;
    renderCurrentPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// UI Renders
function renderFilms(films) {
    if (!filmsGrid) return;
    if (!films || films.length === 0) {
        filmsGrid.innerHTML = '<p style="text-align:center; color:#b3b3b3; grid-column: 1/-1;">Tidak ada film ditemukan.</p>';
        return;
    }

    filmsGrid.innerHTML = films.map(film => `
        <a href="detail.html?slug=${film.slug}" class="film-card">
            <img 
                src="${film.poster && !film.poster.includes('undefined') ? film.poster : 'https://via.placeholder.com/200x300?text=No+Poster'}" 
                alt="${film.title}"
                class="film-poster"
                loading="lazy"
                onerror="this.src='https://via.placeholder.com/200x300?text=No+Poster'"
            >
            <div class="film-card-content">
                <h3 class="film-card-title">${film.title}</h3>
                <div class="film-card-meta">
                    ${film.rating ? `<span class="film-card-rating">⭐ ${film.rating}</span>` : ''}
                    ${film.year ? `<span>${film.year}</span>` : ''}
                </div>
                ${film.tags && film.tags.length > 0 ? `
                    <div class="film-card-tags">
                        ${film.tags.slice(0, 2).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        </a>
    `).join('');
}

function renderPagination(pag) {
    if (!pagination) return;
    if (pag.totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let buttons = [];
    buttons.push(`<button class="page-btn" onclick="goToPage(${pag.page - 1})" ${!pag.hasPrev ? 'disabled' : ''}>←</button>`);

    const startPage = Math.max(1, pag.page - 2);
    const endPage = Math.min(pag.totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
        buttons.push(`<button class="page-btn ${i === pag.page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`);
    }

    buttons.push(`<button class="page-btn" onclick="goToPage(${pag.page + 1})" ${!pag.hasNext ? 'disabled' : ''}>→</button>`);
    pagination.innerHTML = buttons.join('');
}

function populateDropdown(dropdownId, selectId, items, type) {
    const dropdown = document.getElementById(dropdownId);
    const select = document.getElementById(selectId);
    if (!items) return;

    if (dropdown) dropdown.innerHTML = '';
    if (select) select.innerHTML = '<option value="">Semua</option>';

    items.sort().forEach(item => {
        if (dropdown) {
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = item;
            link.onclick = (e) => {
                e.preventDefault();
                applyQuickFilter(type, item);
            };
            dropdown.appendChild(link);
        }
        if (select) {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            select.appendChild(option);
        }
    });
}

function showLoading(show) {
    if (loading) loading.style.display = show ? 'block' : 'none';
    if (filmsGrid) filmsGrid.style.display = show ? 'none' : 'grid';
}

// Expose functions globally for HTML onclick
window.loadFilms = goToPage; // Backward compat if needed
window.goToPage = goToPage;
