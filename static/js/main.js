// Shared interactive portal & homepage FAQ filtering utilities
document.addEventListener('DOMContentLoaded', () => {
  // Auto-dismiss transient alerts only if marked with data-autohide
  document.querySelectorAll('.alert[data-autohide="true"]').forEach(alertEl => {
    setTimeout(() => {
      alertEl.classList.remove('show');
    }, 4500);
  });

  // Interactive Homepage FAQ search & category filter
  const faqSearchInput = document.getElementById('homeFaqSearch');
  const faqCategoryBtns = Array.from(document.querySelectorAll('[data-faq-category]'));
  const faqItems = Array.from(document.querySelectorAll('[data-faq-item]'));
  const faqEmptyState = document.getElementById('homeFaqEmptyState');

  if (faqItems.length > 0) {
    let activeCategory = 'All';

    const applyFaqFilters = () => {
      const query = (faqSearchInput?.value || '').trim().toLowerCase();
      let visibleCount = 0;

      faqItems.forEach(item => {
        const itemCategory = item.getAttribute('data-faq-cat') || '';
        const itemText = (item.getAttribute('data-faq-text') || item.textContent || '').toLowerCase();
        const matchesCat = activeCategory === 'All' || itemCategory === activeCategory;
        const matchesQuery = !query || itemText.includes(query);
        const show = matchesCat && matchesQuery;
        item.classList.toggle('d-none', !show);
        if (show) visibleCount += 1;
      });

      if (faqEmptyState) {
        faqEmptyState.classList.toggle('d-none', visibleCount > 0);
      }
    };

    faqCategoryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.getAttribute('data-faq-category') || 'All';
        faqCategoryBtns.forEach(other => {
          const isCurrent = other === btn;
          other.classList.toggle('is-active', isCurrent);
          other.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
        });
        applyFaqFilters();
      });
    });

    if (faqSearchInput) {
      faqSearchInput.addEventListener('input', applyFaqFilters);
    }
  }
});
