import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Paths (Flat Structure)
const ROOT_DIR = process.cwd();

// Serve Static Assets
app.use('/css', express.static(path.join(ROOT_DIR, 'css')));
app.use('/js', express.static(path.join(ROOT_DIR, 'js')));

// Data cache - Load immediately for Serverless context
let filmsData = [];
let tvData = [];

try {
    // Using require ensures Vercel bundles these files
    filmsData = require('../film.json');
    tvData = require('../tv.json');
    console.log(`✅ Loaded ${filmsData.length} films`);
    console.log(`✅ Loaded ${tvData.length} TV series`);
} catch (error) {
    console.error('❌ Error loading data:', error.message);
    filmsData = [];
    tvData = [];
}

// Middleware not needed for loading anymore as it's synchronous


// Helper: Paginate array
function paginate(array, page = 1, limit = 20) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return {
        data: array.slice(startIndex, endIndex),
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: array.length,
            totalPages: Math.ceil(array.length / limit),
            hasNext: endIndex < array.length,
            hasPrev: page > 1
        }
    };
}

// Helper: Search & Filter
function searchItems(array, query) {
    if (!query) return array;
    const q = query.toLowerCase();
    return array.filter(item =>
        item.title?.toLowerCase().includes(q) ||
        item.genre?.toLowerCase().includes(q)
    );
}

function filterItems(array, filters) {
    let filtered = [...array];
    if (filters.genre) filtered = filtered.filter(i => i.genre?.toLowerCase().includes(filters.genre.toLowerCase()));
    if (filters.year) filtered = filtered.filter(i => i.year === filters.year);
    if (filters.country) filtered = filtered.filter(i => i.country?.toLowerCase().includes(filters.country.toLowerCase()));
    if (filters.rating) filtered = filtered.filter(i => parseFloat(i.rating) >= parseFloat(filters.rating));
    return filtered;
}

// API Routes
app.get('/api/films', (req, res) => {
    try {
        const { page = 1, limit = 20, q, genre, year, country, rating } = req.query;
        let films = [...filmsData];
        if (q) films = searchItems(films, q);
        films = filterItems(films, { genre, year, country, rating });
        res.json(paginate(films, page, limit));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/films/:slug', (req, res) => {
    const film = filmsData.find(f => f.slug === req.params.slug);
    if (!film) return res.status(404).json({ error: 'Not found' });
    const related = filmsData.filter(f => f.slug !== req.params.slug && f.genre && film.genre && f.genre.split(',').some(g => film.genre.includes(g.trim()))).slice(0, 6);
    res.json({ ...film, related });
});

app.get('/api/tv', (req, res) => {
    try {
        const { page = 1, limit = 20, q, genre, year, country, rating } = req.query;
        let tv = [...tvData];
        if (q) tv = searchItems(tv, q);
        tv = filterItems(tv, { genre, year, country, rating });
        res.json(paginate(tv, page, limit));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/tv/:slug', (req, res) => {
    const tv = tvData.find(t => t.slug === req.params.slug);
    if (!tv) return res.status(404).json({ error: 'Not found' });
    const related = tvData.filter(t => t.slug !== req.params.slug && t.genre && tv.genre && t.genre.split(',').some(g => tv.genre.includes(g.trim()))).slice(0, 6);
    res.json({ ...tv, related });
});

app.get('/api/search', (req, res) => {
    const { q } = req.query;
    if (!q) return res.json({ films: [], tv: [] });
    res.json({
        films: searchItems(filmsData, q).slice(0, 10),
        tv: searchItems(tvData, q).slice(0, 10)
    });
});

app.get('/api/stats', (req, res) => {
    const genres = new Set();
    const years = new Set();
    const countries = new Set();
    [...filmsData, ...tvData].forEach(i => {
        if (i.genre) i.genre.split(',').forEach(g => genres.add(g.trim()));
        if (i.year) years.add(i.year);
        if (i.country) countries.add(i.country.trim());
    });
    res.json({
        totalFilms: filmsData.length,
        totalTV: tvData.length,
        genres: Array.from(genres).sort(),
        years: Array.from(years).sort().reverse(),
        countries: Array.from(countries).sort()
    });
});

// Root Route
app.get('/', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

// Detail Page
app.get('/detail.html', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'detail.html'));
});

// Start if local
if (import.meta.url === `file://${process.argv[1]}`) {
    await loadData();
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

export default app;
