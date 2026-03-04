// ── GTB Collective — Supabase + Groq Config ─────────────
const SUPABASE_URL = 'https://tniprxbgdcixrjoilprx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuaXByeGJnZGNpeHJqb2lscHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MDAyMzUsImV4cCI6MjA4ODE3NjIzNX0.sfnt8YrJe8OdXkTP0waPxwMJ8EhW0nFlPFYclzsgOX8';
// Groq API key is stored in the browser (localStorage) — entered once by admin
function getGroqKey() { return localStorage.getItem('gtb_groq_key') || ''; }
function setGroqKey(key) { localStorage.setItem('gtb_groq_key', key); }

// ── Member Credentials (default passwords — members should change on first login)
const MEMBER_ACCOUNTS = [
    { email: 'polymath@gtb.co.ke', password: 'GTBpolymath2026!', role: 'polymath', title: 'The Polymath' },
    { email: 'performer@gtb.co.ke', password: 'GTBperformer2026!', role: 'performer', title: 'The Performer' },
    { email: 'visionary@gtb.co.ke', password: 'GTBvisionary2026!', role: 'visionary', title: 'The Visionary' },
    { email: 'specialist@gtb.co.ke', password: 'GTBspecialist2026!', role: 'specialist', title: 'The Specialist' },
    { email: 'gastronomist@gtb.co.ke', password: 'GTBgastronomist2026!', role: 'gastronomist', title: 'The Gastronomist' },
    { email: 'architect@gtb.co.ke', password: 'GTBarchitect2026!', role: 'architect', title: 'The Architect', isAdmin: true },
    { email: 'artist@gtb.co.ke', password: 'GTBartist2026!', role: 'artist', title: 'The Artist', isAdmin: true },
    { email: 'artist2@gtb.co.ke', password: 'GTBartist22026!', role: 'artist2', title: 'The Artist II' },
    { email: 'engineer@gtb.co.ke', password: 'GTBengineer2026!', role: 'engineer', title: 'The Engineer' },
];

// ── Default Member Data ─────────────────────────────────
const DEFAULT_MEMBERS = {
    polymath: { display_name: 'The Polymath', emoji: '🎙️', tags: 'Artist · Journalist · Producer', bio: 'Narrates the GTB story with rhythmic precision and journalistic integrity.', instagram: '', tiktok: '', youtube: '' },
    performer: { display_name: 'The Performer', emoji: '🎭', tags: 'Actor · Front-End Developer', bio: 'Bridges human charisma with technical logic.', instagram: '', tiktok: '', youtube: '' },
    visionary: { display_name: 'The Visionary', emoji: '🎬', tags: 'Videographer · Visual Tech Dev', bio: 'Cinematic aesthetics meet high-performance code.', instagram: '', tiktok: '', youtube: '' },
    specialist: { display_name: 'The Specialist', emoji: '💊', tags: 'Doctor · Gym Enthusiast', bio: 'Medical accuracy meets elite physical output.', instagram: '', tiktok: '', youtube: '' },
    gastronomist: { display_name: 'The Gastronomist', emoji: '🍽️', tags: 'Chef · Performance Nutrition', bio: 'Culinary arts for high-performance living.', instagram: 'https://www.instagram.com/chef.kenah/', tiktok: 'https://www.tiktok.com/@chef_kenah', youtube: '' },
    architect: { display_name: 'The Architect', emoji: '🏗️', tags: 'Lead Dev · Backend · APIs · Security', bio: 'The GTB foundation. Heavy-duty backend, API bridges, system security.', instagram: '', tiktok: '', youtube: '', github: 'https://github.com/TrevonK-coder', cv: 'https://trevonk-coder.github.io/myCV/' },
    artist: { display_name: 'The Artist', emoji: '🎵', tags: 'Music · Creative Direction', bio: 'The sonic pulse of GTB. Experimental soundscapes and creative purity.', instagram: 'https://www.instagram.com/gtbemzee/', tiktok: 'https://www.tiktok.com/@gtbemzee', youtube: 'https://www.youtube.com/@gtbemzee' },
    artist2: { display_name: 'The Artist II', emoji: '🎨', tags: 'Music · Visual Art', bio: 'Creative force and co-founder of GTB. Art without limits.', instagram: 'https://www.instagram.com/lecco.man/', tiktok: '', youtube: '' },
    engineer: { display_name: 'The Engineer', emoji: '⚙️', tags: 'Full-Stack · Deployment · Scaling', bio: 'Rapid deployment and scaling. The glue for all GTB digital properties.', instagram: '', tiktok: '', youtube: '' },
};
