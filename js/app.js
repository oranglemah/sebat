// API Base URL (Relative path for Vercel & Local)
const API_BASE = '/api';

// State
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
const applyFilterBtn = document.getElementById('applyFilter');
const resetFilterBtn = document.getElementById('resetFilter');
const statsEl = document.getElementById('stats');

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadFilms();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    toggleFilterBtn.addEventListener('click', () => {
        filterSidebar.classList.add('open');
    });

    closeFilterBtn.addEventListener('click', () => {
        filterSidebar.classList.remove('open');
    });

    applyFilterBtn.addEventListener('click', handleFilter);
    resetFilterBtn.addEventListener('click', handleResetFilter);

    // Nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.getAttribute('href') === '#tv') {
                e.preventDefault();
                switchToTV();
            }
        });
    });
}

// Load stats untuk populate filters & dropdowns
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const data = await response.json();

        // Populate Dropdowns & Sidebar Filters
        populateDropdown('genreDropdown', 'genreFilter', data.genres, 'genre');
        populateDropdown('yearDropdown', 'yearFilter', data.years, 'year');
        populateDropdown('countryDropdown', 'countryFilter', data.countries, 'country');

        // Update stats display
        const statsText = statsEl ? statsEl : document.getElementById('stats');
        if (statsText) {
            statsText.textContent = `${data.totalFilms.toLocaleString()} Films • ${data.totalTV.toLocaleString()} TV Series`;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Helper: Populate Dropdown & Select
function populateDropdown(dropdownId, selectId, items, type) {
    const dropdown = document.getElementById(dropdownId);
    const select = document.getElementById(selectId);

    if (!items) return;

    items.sort().forEach(item => {
        // Dropdown Link
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

        // Sidebar Select
        if (select) {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            select.appendChild(option);
        }
    });
}

// Quick Filter from Dropdown
function applyQuickFilter(type, value) {
    currentFilters = {}; // Reset other filters
    currentFilters[type] = value;
    currentSearch = '';

    // Update Sidebar UI to match
    if (type === 'genre' && genreFilter) genreFilter.value = value;
    if (type === 'year' && yearFilter) yearFilter.value = value;

    currentPage = 1;
    loadFilms(1);

    // Scroll to grid
    window.scrollTo({ top: 300, behavior: 'smooth' });
}

// Load films
async function loadFilms(page = 1) {
    showLoading(true);

    try {
        const params = new URLSearchParams({
            page,
            limit: 20,
            ...(currentSearch && { q: currentSearch }),
            ...currentFilters
        });

        const endpoint = currentType === 'film' ? 'films' : 'tv';
        const response = await fetch(`${API_BASE}/${endpoint}?${params}`);
        const result = await response.json();

        renderFilms(result.data);
        renderPagination(result.pagination);

        currentPage = page;
    } catch (error) {
        console.error('Error loading films:', error);
        if (filmsGrid) filmsGrid.innerHTML = '<p style="text-align:center; color:#b3b3b3;">Gagal memuat data. Pastikan backend server berjalan.</p>';
    } finally {
        showLoading(false);
    }
}

// Render films grid
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

// Render pagination
function renderPagination(pag) {
    if (!pagination) return;

    if (!pag || pag.totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let buttons = [];

    // Previous button
    buttons.push(`
        <button 
            class="page-btn" 
            onclick="loadFilms(${pag.page - 1})"
            ${!pag.hasPrev ? 'disabled' : ''}
        >←</button>
    `);

    // Page numbers logic (simplified)
    const startPage = Math.max(1, pag.page - 2);
    const endPage = Math.min(pag.totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
        buttons.push(`
            <button 
                class="page-btn ${i === pag.page ? 'active' : ''}" 
                onclick="loadFilms(${i})"
            >${i}</button>
        `);
    }

    // Next button
    buttons.push(`
        <button 
            class="page-btn" 
            onclick="loadFilms(${pag.page + 1})"
            ${!pag.hasNext ? 'disabled' : ''}
        >→</button>
    `);

    pagination.innerHTML = buttons.join('');
}

// Handle search
function handleSearch() {
    if (!searchInput) return;
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    loadFilms(1);
}

// Handle filter
function handleFilter() {
    currentFilters = {};

    if (genreFilter && genreFilter.value) currentFilters.genre = genreFilter.value;
    if (yearFilter && yearFilter.value) currentFilters.year = yearFilter.value;
    if (ratingFilter && ratingFilter.value) currentFilters.rating = ratingFilter.value;

    currentPage = 1;
    loadFilms(1);
    if (filterSidebar) filterSidebar.classList.remove('open');
}

// Reset filter
function handleResetFilter() {
    currentFilters = {};
    currentSearch = '';
    if (searchInput) searchInput.value = '';
    if (genreFilter) genreFilter.value = '';
    if (yearFilter) yearFilter.value = '';
    if (ratingFilter) ratingFilter.value = '';

    currentPage = 1;
    loadFilms(1);
    if (filterSidebar) filterSidebar.classList.remove('open');
}

// Switch to TV
function switchToTV() {
    currentType = 'tv';
    currentPage = 1;
    currentFilters = {};
    currentSearch = '';
    if (searchInput) searchInput.value = '';

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#tv') {
            link.classList.add('active');
        }
    });

    loadFilms(1);
}

// Show/hide loading
function showLoading(show) {
    if (loading) loading.style.display = show ? 'block' : 'none';
    if (filmsGrid) filmsGrid.style.display = show ? 'none' : 'grid';
}

// Element helpers
const countryFilter = document.getElementById('countryFilter');
const countryDropdown = document.getElementById('countryDropdown');
const genreDropdown = document.getElementById('genreDropdown');
const yearDropdown = document.getElementById('yearDropdown');

