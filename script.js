// ── MOBILE MENU TOGGLE ──
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

// Close mobile menu when a link is clicked
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

// ── NAVBAR SCROLL SHADOW ──
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    navbar.style.boxShadow = '0 4px 24px rgba(0,0,0,0.15)';
  } else {
    navbar.style.boxShadow = '0 2px 16px rgba(0,0,0,0.08)';
  }
});

// ── SCROLL REVEAL ANIMATION ──
const revealElements = document.querySelectorAll(
  '.cat-card, .rest-card, .how-card, .stat-item'
);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealElements.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(28px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  revealObserver.observe(el);
});

// ── ORDER NOW BUTTON ──
document.querySelectorAll('.btn-order').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.closest('.rest-card').querySelector('h4').textContent;
    alert(`🍽️ Redirecting to ${name}...\n(Connect your backend to enable real ordering)`);
  });
});

// ── SEARCH BUTTON ──
document.querySelector('.btn-search').addEventListener('click', () => {
  const keyword = document.querySelector('.search-field input').value.trim();
  const location = document.querySelector('.search-field select').value;
  if (!keyword && !location) {
    alert('Please enter a keyword or select a location to search.');
    return;
  }
  alert(` Searching for "${keyword || 'anything'}" in "${location || 'all locations'}"...\n(Connect your backend to enable real search)`);
});

// ── NAV SEARCH BUTTON ──
document.querySelector('.btn-search-nav').addEventListener('click', () => {
  document.querySelector('#categories').scrollIntoView({ behavior: 'smooth' });
});

// ── ACTIVE NAV LINK ON SCROLL ──
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 100) {
      current = section.getAttribute('id');
    }
  });
  navLinks.forEach(link => {
    link.style.color = '';
    if (link.getAttribute('href') === `#${current}`) {
      link.style.color = '#FFC120';
    }
  });
});

// ── SCROLL TO TOP BUTTON (Added by Student 2) ──
const scrollTopBtn = document.getElementById('scrollTopBtn');

window.addEventListener('scroll', () => {
  if (window.scrollY > 400) {
    scrollTopBtn.classList.add('visible');
  } else {
    scrollTopBtn.classList.remove('visible');
  }
});

scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});