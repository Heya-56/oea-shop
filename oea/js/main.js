/* ==========================================================================
   OEA Tahiti — JavaScript Principal & Intégration Catalogue Airtable
   ========================================================================== */

(function () {
  'use strict';

  // 1. Année dynamique du footer
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // 2. Navigation Mobile
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !expanded);
      mainNav.classList.toggle('open');
    });
  }

  // 3. Carrousel d'images
  var carousel = document.querySelector('.carousel');
  if (carousel) {
    var track = carousel.querySelector('.carousel-track');
    var slides = carousel.querySelectorAll('.carousel-slide');
    var prevBtn = carousel.querySelector('[data-carousel-prev]');
    var nextBtn = carousel.querySelector('[data-carousel-next]');
    var dotsContainer = carousel.querySelector('[data-carousel-dots]');
    var currentIndex = 0;

    if (slides.length > 0) {
      if (dotsContainer) {
        dotsContainer.innerHTML = '';
        slides.forEach(function (_, i) {
          var dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
          dot.setAttribute('aria-label', 'Aller à la photo ' + (i + 1));
          dot.addEventListener('click', function () { goToSlide(i); });
          dotsContainer.appendChild(dot);
        });
      }

      function updateCarousel() {
        if (track) track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
        if (dotsContainer) {
          var dots = dotsContainer.querySelectorAll('.carousel-dot');
          dots.forEach(function (d, i) {
            d.classList.toggle('active', i === currentIndex);
          });
        }
      }

      function goToSlide(index) {
        currentIndex = (index + slides.length) % slides.length;
        updateCarousel();
      }

      if (prevBtn) prevBtn.addEventListener('click', function () { goToSlide(currentIndex - 1); });
      if (nextBtn) nextBtn.addEventListener('click', function () { goToSlide(currentIndex + 1); });
    }
  }

  // 4. Formulaires de contact & devis (Web3Forms)
  document.querySelectorAll('form[data-web3forms]').forEach(function (form) {
    var statusBox = form.querySelector('.form-status');
    var submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var honeypot = form.querySelector('input[name="botcheck"]');
      if (honeypot && honeypot.value) return;

      var originalLabel = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours...';
      }

      var formData = new FormData(form);

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (statusBox) {
          statusBox.classList.remove('error');
          statusBox.classList.add('show');
          statusBox.textContent = data.success 
            ? '✓ Succès — votre demande a bien été envoyée. Nous vous répondons sous 48 h.'
            : 'Une erreur est survenue. Merci de réessayer ou de nous écrire directement.';
        }
        if (data.success) form.reset();
      })
      .catch(function () {
        if (statusBox) {
          statusBox.classList.add('show', 'error');
          statusBox.textContent = 'Impossible d\'envoyer le formulaire pour le moment. Merci de réessayer.';
        }
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        }
      });
    });
  });

  // 5. Gestion de la modale produit
  var modal = document.getElementById('productModal');
  if (modal) {
    modal.querySelectorAll('[data-modal-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        modal.classList.remove('show');
      });
    });

    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.classList.remove('show');
    });
  }

})();

/* ==========================================================================
   6. CHARGEMENT DYNAMIQUE DU CATALOGUE AIRTABLE (Worker Cloudflare)
   ========================================================================== */
const API_URL = 'https://oea.hinovadigital.workers.dev';

async function loadOeaProducts() {
  const container = document.getElementById('products-grid');
  if (!container) return;

  try {
    const res = await fetch(`${API_URL}/api/products`);
    const json = await res.json();

    if (!json.success || !json.data || json.data.length === 0) {
      container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; padding: 30px;">Aucun article disponible pour le moment.</p>';
      return;
    }

    container.innerHTML = json.data.map(product => {
      const priceFormatted = `${Number(product.price).toFixed(2).replace('.', ',')} €`;
      const badge = product.category || 'Collection';
      const shortDesc = product.description && product.description.length > 55
        ? product.description.substring(0, 55) + '...'
        : (product.description || product.name);
      const fullDesc = product.description || product.name;
      const img = product.imageUrl || 'assets/images/placeholder.jpg';

      return `
        <article class="product-card"
          data-name="${product.name}"
          data-badge="${badge}"
          data-price="${priceFormatted}"
          data-desc="${shortDesc}"
          data-full="${fullDesc}">
          <div class="product-media">
            <span class="product-badge">${badge}</span>
            <img src="${img}" alt="${product.name}" onerror="this.style.display='none'">
          </div>
          <div class="product-body">
            <h3>${product.name}</h3>
            <p class="desc">${shortDesc}</p>
            <div class="product-foot">
              <span class="product-price">${priceFormatted}</span>
              <button type="button" class="product-link" data-product-trigger>Voir le produit →</button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Liaison des clics sur les cartes générées avec la modale
    const modal = document.getElementById('productModal');
    if (modal) {
      const modalTitle = modal.querySelector('[data-modal-title]');
      const modalBadge = modal.querySelector('[data-modal-badge]');
      const modalPrice = modal.querySelector('[data-modal-price]');
      const modalDesc = modal.querySelector('[data-modal-desc]');

      document.querySelectorAll('[data-product-trigger]').forEach(btn => {
        btn.addEventListener('click', e => {
          const card = e.target.closest('.product-card');
          if (!card) return;

          if (modalTitle) modalTitle.textContent = card.dataset.name || '';
          if (modalBadge) modalBadge.textContent = card.dataset.badge || '';
          if (modalPrice) modalPrice.textContent = card.dataset.price || '';
          if (modalDesc) modalDesc.textContent = card.dataset.full || card.dataset.desc || '';

          modal.classList.add('show');
        });
      });
    }

  } catch (err) {
    console.error('Erreur catalogue :', err);
    container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #c5a880; padding: 30px;">Collection momentanément indisponible.</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadOeaProducts);