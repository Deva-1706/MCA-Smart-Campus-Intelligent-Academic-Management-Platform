// Responsive sidebar drawer, public navbar smooth scrolling, and active section underline tracking
document.addEventListener('DOMContentLoaded', () => {
  const sidebarDrawer = document.getElementById('studentSidebarDrawer');
  if (sidebarDrawer) {
    const links = sidebarDrawer.querySelectorAll('a.nav-link');
    links.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 992 && sidebarDrawer.classList.contains('show')) {
          const bsCollapse = window.bootstrap?.Collapse?.getInstance(sidebarDrawer);
          if (bsCollapse) {
            bsCollapse.hide();
          } else {
            sidebarDrawer.classList.remove('show');
          }
        }
      });
    });
  }

  // Smooth scroll & mobile navbar collapse for public section links
  const portalNavbar = document.getElementById('portalNavbar');
  const sectionLinks = Array.from(document.querySelectorAll('[data-section-link]'));

  const setActiveNavLink = (sectionId) => {
    sectionLinks.forEach(link => {
      const matches = link.getAttribute('data-section-link') === sectionId;
      link.classList.toggle('active', matches);
    });
  };

  sectionLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('data-section-link');
      const targetEl = targetId ? document.getElementById(targetId) : null;
      if (targetEl) {
        event.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (history.replaceState) {
          history.replaceState(null, '', `#${targetId}`);
        }
        setActiveNavLink(targetId);

        if (window.innerWidth < 992 && portalNavbar && portalNavbar.classList.contains('show')) {
          const bsNavCollapse = window.bootstrap?.Collapse?.getInstance(portalNavbar);
          if (bsNavCollapse) {
            bsNavCollapse.hide();
          } else {
            portalNavbar.classList.remove('show');
          }
        }
      }
    });
  });

  // Track visible homepage section on scroll
  const observedIds = ['home', 'about', 'subjects', 'features', 'important-notices', 'how-it-works', 'faq'];
  const observedSections = observedIds
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if (observedSections.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          setActiveNavLink(visible.target.id);
        }
      },
      { rootMargin: '-25% 0px -55% 0px', threshold: [0.1, 0.35, 0.6] }
    );
    observedSections.forEach(sec => observer.observe(sec));
  }
});
