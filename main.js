// ── Feed Content Data ──────────────────────────────
const feedData = {
    instagram: [
        { emoji: '🎬', title: 'Behind the lens at GTB Studios — new drop incoming', member: 'The Visionary', link: 'https://www.instagram.com/gladtobe.ot/' },
        { emoji: '💊', title: '5AM workout complete. Recovery fuel breakdown 🔥', member: 'The Specialist', link: 'https://www.instagram.com/gladtobe.ot/' },
        { emoji: '🍽️', title: 'Pre-game meal prep for the collective. High-perf fuel.', member: 'The Gastronomist (@chef.kenah)', link: 'https://www.instagram.com/chef.kenah/' },
        { emoji: '🎵', title: 'Studio session vibes — new sonic direction unlocked.', member: 'The Artist (@gtbemzee)', link: 'https://www.instagram.com/gtbemzee/' },
    ],
    tiktok: [
        { emoji: '🎭', title: 'POV: Acting + coding at the same time 😂', member: 'The Performer', link: 'https://www.tiktok.com/@gtbcollective' },
        { emoji: '💊', title: 'Medical myth busted in 60 seconds #DoctorTok', member: 'The Specialist', link: 'https://www.tiktok.com/@gtbcollective' },
        { emoji: '🍽️', title: '60-second high-protein meal for creators on the go', member: 'The Gastronomist (@chef_kenah)', link: 'https://www.tiktok.com/@chef_kenah' },
        { emoji: '🎵', title: 'New sound drop — GTB vibes only 🔥', member: 'The Artist (@gtbemzee)', link: 'https://www.tiktok.com/@gtbemzee' },
    ],
    youtube: [
        { emoji: '🎬', title: 'GTB Collective: How We Edit Cinematic Vlogs in 2026', member: 'The Visionary', link: 'https://www.youtube.com/@gtbcollective' },
        { emoji: '🎙️', title: 'Glad To Be — Documentary (Full Cut)', member: 'The Polymath', link: 'https://www.youtube.com/@gtbcollective' },
        { emoji: '🏗️', title: 'Building VidaCut AI from scratch — Full Dev Vlog', member: 'The Architect', link: 'https://www.youtube.com/@gtbcollective' },
        { emoji: '🎵', title: 'Experimental Beat Breakdown — GTB Sound Design Vol.1', member: 'The Artist (@gtbemzee)', link: 'https://www.youtube.com/@gtbemzee' },
    ],
};

// ── Platform Tab Switching ──────────────────────────
function renderFeed(platform) {
    const grid = document.getElementById('feedGrid');
    if (!grid) return;
    grid.innerHTML = '';

    feedData[platform].forEach(item => {
        const card = document.createElement('a');
        card.className = 'feed-card reveal';
        card.href = item.link;
        card.target = '_blank';
        card.innerHTML = `
      <div class="feed-card-thumb">${item.emoji}</div>
      <div class="feed-card-platform">${platform.toUpperCase()}</div>
      <div class="feed-card-title">${item.title}</div>
      <div class="feed-card-member">— ${item.member}</div>
      <div class="feed-card-link">View → </div>
    `;
        grid.appendChild(card);
    });

    // Re-run reveal
    setTimeout(() => {
        document.querySelectorAll('.feed-card.reveal').forEach(el => el.classList.add('visible'));
    }, 50);
}

document.querySelectorAll('.ptab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.ptab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderFeed(btn.dataset.feed);
    });
});

renderFeed('instagram');

// ── Mobile Nav ───────────────────────────────────────
const burger = document.getElementById('navBurger');
const menu = document.getElementById('mobileMenu');
if (burger && menu) {
    burger.addEventListener('click', () => menu.classList.toggle('open'));
    document.querySelectorAll('.mobile-menu a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
}

// ── Nav Shrink on Scroll ──────────────────────────────
window.addEventListener('scroll', () => {
    const nav = document.getElementById('nav');
    if (!nav) return;
    if (window.scrollY > 60) {
        nav.style.padding = '10px 48px';
        nav.style.background = 'rgba(6,6,9,0.97)';
    } else {
        nav.style.padding = '18px 48px';
        nav.style.background = 'rgba(6,6,9,0.85)';
    }
});

// ── Scroll Reveal ───────────────────────────────────
const observer = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
        if (e.isIntersecting) {
            setTimeout(() => e.target.classList.add('visible'), i * 60);
            observer.unobserve(e.target);
        }
    });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal, .member-card, .prop-card, .explore-card').forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
});

// ── Explore Page: Filter Logic ────────────────────────
const filterBtns = document.querySelectorAll('.filter-btn');
const exploreCards = document.querySelectorAll('.explore-card');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        exploreCards.forEach(card => {
            if (filter === 'all' || card.dataset.platform === filter || card.dataset.member === filter) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    });
});

// ── APP TOUR LOGIC ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Check if tour already seen
    if (localStorage.getItem('gtb_tour_seen')) return;

    const tourSteps = [
        {
            sel: null,
            title: "Welcome to GTB",
            desc: "Eight elite, multi-hyphenate creatives operating in one unified dimension. Let's take a quick look around."
        },
        {
            sel: '#members',
            title: "The Collective",
            desc: "Explore the 8 dimensions. From The Polymath to The Architect, discover the minds behind GTB."
        },
        {
            sel: '#social',
            title: "Live Feed",
            desc: "Real-time updates across Instagram, TikTok, and YouTube. One central hub for all GTB content."
        },
        {
            sel: '#properties',
            title: "The Ecosystem",
            desc: "Our digital businesses, including VidaCut AI and GTB Productions. Built and scaled by the collective."
        }
    ];

    let currentStepIndex = 0;
    const overlayOrig = document.getElementById('tourOverlay');
    const box = document.getElementById('tourBox');
    if (!overlayOrig || !box) return;

    // Small delay to let initial animations finish
    setTimeout(() => {
        overlayOrig.classList.remove('hidden');
        renderTourStep();
    }, 1500);

    function renderTourStep() {
        // Clear previous highlight
        document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));

        const step = tourSteps[currentStepIndex];

        document.getElementById('tourTitle').textContent = step.title;
        document.getElementById('tourDesc').textContent = step.desc;
        document.getElementById('tourStep').textContent = currentStepIndex + 1;
        document.getElementById('tourTotal').textContent = tourSteps.length;

        document.getElementById('tourPrev').disabled = currentStepIndex === 0;
        document.getElementById('tourNext').textContent = currentStepIndex === tourSteps.length - 1 ? 'Finish' : 'Next';

        // Highlight element
        if (step.sel) {
            const targetEl = document.querySelector(step.sel);
            if (targetEl) {
                targetEl.classList.add('tour-highlight');
                // Scroll target into view
                const rect = targetEl.getBoundingClientRect();
                const absoluteTop = window.scrollY + rect.top;

                // Position box near target
                window.scrollTo({ top: absoluteTop - 100, behavior: 'smooth' });

                // Set box position (center screen for now to avoid complex collision math)
                box.style.top = '50%';
                box.style.left = '50%';
                box.style.transform = 'translate(-50%, -50%)';
                box.style.position = 'fixed';
            }
        } else {
            // Intro step - center screen
            window.scrollTo({ top: 0, behavior: 'smooth' });
            box.style.top = '50%';
            box.style.left = '50%';
            box.style.transform = 'translate(-50%, -50%)';
            box.style.position = 'fixed';
        }
    }

    function closeTour() {
        overlayOrig.classList.add('hidden');
        document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
        localStorage.setItem('gtb_tour_seen', 'true');
    }

    document.getElementById('tourNext').addEventListener('click', () => {
        if (currentStepIndex < tourSteps.length - 1) {
            currentStepIndex++;
            renderTourStep();
        } else {
            closeTour();
        }
    });

    document.getElementById('tourPrev').addEventListener('click', () => {
        if (currentStepIndex > 0) {
            currentStepIndex--;
            renderTourStep();
        }
    });

    document.getElementById('tourClose').addEventListener('click', closeTour);
});
