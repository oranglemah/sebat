// Static Data Mode
const DATA_FILE = 'film.json';
const TV_FILE = 'tv.json';

// Get slug from URL
const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get('slug');

// Elements
const loading = document.getElementById('loading');
const detailContent = document.getElementById('detailContent');
const videoPlayer = document.getElementById('videoPlayer');
const relatedFilmsContainer = document.getElementById('relatedFilms');

// Init
document.addEventListener('DOMContentLoaded', async () => {
    if (!slug) {
        window.location.href = '/';
        return;
    }
    await loadInitialDataAndFind(slug);
});

async function loadInitialDataAndFind(searchSlug) {
    try {
        const [filmsRes, tvRes] = await Promise.all([
            fetch(DATA_FILE),
            fetch(TV_FILE)
        ]);

        const filmsData = await filmsRes.json();
        const tvData = await tvRes.json();

        let item = filmsData.find(f => f.slug === searchSlug);
        let type = 'film';

        if (!item) {
            item = tvData.find(t => t.slug === searchSlug);
            type = 'tv';
        }

        if (!item) {
            document.body.innerHTML = '<h1 style="color:white;text-align:center;margin-top:50px;">Film tidak ditemukan :(</h1>';
            return;
        }

        renderDetail(item);

        // Find related
        const dataset = type === 'film' ? filmsData : tvData;
        const related = dataset.filter(f =>
            f.slug !== searchSlug &&
            f.genre && item.genre &&
            f.genre.split(',').some(g => item.genre.includes(g.trim()))
        ).slice(0, 6);

        renderRelated(related);

    } catch (error) {
        console.error('Error loading detail:', error);
        if (detailContent) detailContent.innerHTML = '<p>Gagal memuat film.</p>';
    } finally {
        if (loading) loading.style.display = 'none';
        if (detailContent) detailContent.style.display = 'block';
    }
}

function renderDetail(film) {
    // Title
    document.getElementById('pageTitle').textContent = `${film.title} | SAMBAT FILM`;
    document.getElementById('filmTitle').textContent = film.title;

    // Metadata
    safeSetText('filmRating', film.rating ? `⭐ ${film.rating}` : '');
    safeSetText('filmYear', film.year || '');
    safeSetText('filmDuration', film.duration || '');
    safeSetText('filmGenre', film.genre || '-');
    safeSetText('filmCountry', film.country || '-');
    safeSetText('filmDirector', film.director || '-');
    safeSetText('filmCast', film.cast || '-');

    // Synopsis
    safeSetText('filmSynopsis', film.synopsis || 'Tidak ada sinopsis.');

    // Tags
    const tagsContainer = document.getElementById('filmTags');
    if (tagsContainer && film.tags) {
        tagsContainer.innerHTML = film.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    }

    // Video Player Wrapper with Server Selection
    const playerContainer = document.getElementById('videoPlayer');

    if (film.videoPlayerUrl) {
        playerContainer.innerHTML = `
            <div class="server-select" style="margin-bottom: 10px; display: flex; gap: 10px;">
                <button class="server-btn active" onclick="changeServer('default', '${film.videoPlayerUrl}')">Server 1 (sambat)</button>
                <button class="server-btn" id="btnServer2" onclick="findAndPlayAlternate('${film.title}', '${film.year}')">Server 2 (ViP)</button>
            </div>
            <div id="playerFrameContainer" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; background: #000;">
                <iframe 
                    id="mainIframe"
                    src="${film.videoPlayerUrl}" 
                    allowfullscreen 
                    frameborder="0" 
                    scrolling="no"
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border:0;"
                ></iframe>
            </div>
        `;
    } else {
        playerContainer.innerHTML = '<div class="no-video">Maaf, video belum tersedia.</div>';
    }
}

// Global function for server switching
window.changeServer = (type, url) => {
    const iframe = document.getElementById('mainIframe');
    if (iframe) iframe.src = url;

    // UI update
    document.querySelectorAll('.server-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
};

window.findAndPlayAlternate = async (title, year) => {
    const btn = document.getElementById('btnServer2');
    if (btn) {
        btn.textContent = 'Searching...';
        btn.classList.add('active');
    }

    // Update UI active state manually for first server btn removal
    document.querySelectorAll('.server-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    try {
        // 1. Try to get IMDb ID from public suggestion API (Client-side trick)
        // Clean title: remove "The", special chars
        const cleanTitle = title.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase();
        const query = encodeURIComponent(cleanTitle);
        const firstChar = cleanTitle[0] || 'a';

        // Note: This relies on browser allowing cross-origin or JSONP. 
        // Modern approach: user might need a CORS proxy, but we try direct first.
        // If fails, we fallback to a generic search embedder if available.

        const response = await fetch(`https://v2.sg.media-imdb.com/suggestion/${firstChar}/${query}.json`);
        const data = await response.json();

        // Find best match (Title + Year)
        let bestMatch = data.d ? data.d.find(item => item.l.toLowerCase() === title.toLowerCase() && (item.y == year || Math.abs(item.y - year) <= 1)) : null;

        // If exact match not found, take first result
        if (!bestMatch && data.d && data.d.length > 0) bestMatch = data.d[0];

        if (bestMatch && bestMatch.id) {
            const embedUrl = `https://vidsrc.to/embed/movie/${bestMatch.id}`;
            const iframe = document.getElementById('mainIframe');
            if (iframe) iframe.src = embedUrl;
            if (btn) btn.textContent = 'Server 2 (ViP)';
        } else {
            alert('Server alternatif tidak menemukan film ini. Mencoba server backup...');
            const iframe = document.getElementById('mainIframe');
            // Fallback generic search if ID not found? Hard to do without ID.
            if (iframe) iframe.src = `https://www.google.com/search?q=Nonton+${encodeURIComponent(title)}+${year}&igu=1`; // Embed Google Search as last resort
            if (btn) btn.textContent = 'Server 2 (Google)';
        }
    } catch (error) {
        console.error('Error finding alternate:', error);
        alert('Gagal memuat player alternatif. (CORS Blocked/Network Error)');
        if (btn) btn.textContent = 'Server 2 (Error)';
    }
};

function renderRelated(films) {
    if (!relatedFilmsContainer) return;
    if (films.length === 0) {
        relatedFilmsContainer.innerHTML = '<p style="color:#777;">Tidak ada rekomendasi.</p>';
        return;
    }

    relatedFilmsContainer.innerHTML = films.map(film => `
        <a href="detail.html?slug=${film.slug}" class="film-card">
            <img 
                src="${film.poster && !film.poster.includes('undefined') ? film.poster : 'https://via.placeholder.com/200x300?text=No+Poster'}" 
                alt="${film.title}"
                class="film-poster"
                loading="lazy"
            >
            <div class="film-card-content">
                <h3 class="film-card-title">${film.title}</h3>
                <div class="film-card-meta">
                    ${film.rating ? `<span>⭐ ${film.rating}</span>` : ''}
                    ${film.year ? `<span>${film.year}</span>` : ''}
                </div>
            </div>
        </a>
    `).join('');
}

function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}
