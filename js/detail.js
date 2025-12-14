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
    document.getElementById('pageTitle').textContent = `${film.title} | KURO FILM`;
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

    // Video Player
    if (film.videoPlayerUrl) {
        videoPlayer.innerHTML = `
            <iframe 
                src="${film.videoPlayerUrl}" 
                allowfullscreen 
                frameborder="0" 
                scrolling="no"
                width="100%" 
                height="100%"
            ></iframe>
        `;
    } else {
        videoPlayer.innerHTML = '<div class="no-video">Maaf, video belum tersedia.</div>';
    }
}

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
