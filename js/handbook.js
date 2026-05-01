/* ============================================
   FORGE — Handbook JavaScript
   TOC highlighting, search, progress
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initTocHighlight();
});

function initTocHighlight() {
  const chapters = document.querySelectorAll('.chapter');
  const tocLinks = document.querySelectorAll('.toc-link');
  if (!chapters.length || !tocLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        tocLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { threshold: 0.2, rootMargin: '-80px 0px -60% 0px' });

  chapters.forEach(ch => observer.observe(ch));
}
