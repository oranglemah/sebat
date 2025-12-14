// API Base URL (Relative path for Vercel & Local)
const API_BASE = '/api';

// Get slug from URL
const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get('slug');
const type = urlParams.get('type') || 'film'; // film or tv

// Elements
const loading = document.getElementById('loading');
const detailContent = document.getElementById('detailContent');
const videoPlayer = document.getElementById('videoPlayer');
const filmTitle = document.getElementById('filmTitle');
const filmRating = document.getElementById('filmRating');
const filmYear = document.getElementById('filmYear');
const filmDuration = document.getElementById('filmDuration');
const filmTags = document.getElementById('filmTags');
const filmGenre = document.getElementById('filmGenre');
const filmCountry = document.getElementById('filmCountry');
const filmDirector = document.getElementById('filmDirector');
const filmCast = document.getElementById('filmCast');
const filmSynopsis = document.getElementById('filmSynopsis');
const relatedFilms = document.getElementById('relatedFilms');
const pageTitle = document.getElementById('pageTitle');

// Init
document.addEventListener('DOMContentLoaded', () => {
    if (!slug) {
        window.location.href = '/';
        return;
    }
    loadDetail();
});

// Load detail
async function loadDetail() {
    showLoading(true);

    try {
        const endpoint = type === 'tv' ? 'tv' : 'films';
        const response = await fetch(`${API_BASE}/${endpoint}/${slug}`);

        if (!response.ok) {
            throw new Error('Film not found');
        }

        const data = await response.json();
        renderDetail(data);

        if (data.related && data.related.length > 0) {
            renderRelated(data.related);
        }
    } catch (error) {
        console.error('Error loading detail:', error);
        detailContent.innerHTML = `
            <div style="text-align:center; padding:60px 20px;">
                <h2>Film tidak ditemukan</h2>
                <p style="color:#b3b3b3; margin:20px 0;">Film yang Anda cari tidak ada atau telah dihapus.</p>
                <a href="/" style="color:#e50914;">← Kembali ke Beranda</a>
            </div>
        `;
        detailContent.style.display = 'block';
    } finally {
        showLoading(false);
    }
}

// Render detail
function renderDetail(film) {
    // Update page title
    pageTitle.textContent = `${film.title} - Gramkomplit`;

    // Video player
    if (film.videoPlayerUrl) {
        videoPlayer.innerHTML = `
            <iframe 
                src="${film.videoPlayerUrl}" 
                allowfullscreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            ></iframe>
        `;
    } else {
        videoPlayer.innerHTML = `
            <div style="padding:100px 20px; text-align:center; background:#000; color:#b3b3b3;">
                <p>Video player tidak tersedia</p>
            </div>
        `;
    }

    // Title & Meta
    filmTitle.textContent = film.title || 'Untitled';
    filmRating.textContent = film.rating ? `⭐ ${film.rating}` : '';
    filmYear.textContent = film.year || '';
    filmDuration.textContent = film.duration || '';

    // Tags
    if (film.tags && film.tags.length > 0) {
        filmTags.innerHTML = film.tags.map(tag =>
            `<span class="tag">${tag}</span>`
        ).join('');
    } else {
        filmTags.innerHTML = '';
    }

    // Details
    filmGenre.textContent = film.genre || '-';
    filmCountry.textContent = film.country || '-';
    filmDirector.textContent = film.director || '-';
    filmCast.textContent = film.cast || '-';

    // Synopsis
    if (film.synopsis && film.synopsis.trim()) {
        filmSynopsis.textContent = film.synopsis;
    } else {
        filmSynopsis.textContent = 'Sinopsis tidak tersedia.';
    }

    detailContent.style.display = 'block';
}

// Render related films
function renderRelated(films) {
    relatedFilms.innerHTML = films.map(film => `
        <a href="detail.html?slug=${film.slug}" class="film-card">
            <img 
                src="${film.poster || 'https://via.placeholder.com/200x300?text=No+Poster'}" 
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
            </div>
        </a>
    `).join('');
}

// Show/hide loading
function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
    detailContent.style.display = show ? 'none' : 'block';
}
