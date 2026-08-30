/* ==========================================================================
   OEA — script principal
   Nécessite js/cart.js chargé AVANT ce fichier (window.OEACart).
   ========================================================================== */

/* ---------- Enregistrement du Service Worker (PWA) ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {
      /* échec silencieux : le site reste utilisable normalement sans PWA */
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Menu mobile ---------- */
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('main-nav');
  if (navToggle && mainNav) {/* ==========================================================================
   OEA — script principal
   Nécessite js/cart.js chargé AVANT ce fichier (window.OEACart).
   ========================================================================== */

/* ---------- Enregistrement du Service Worker (PWA) ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {
      /* échec silencieux : le site reste utilisable normalement sans PWA */
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Menu mobile ---------- */
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      mainNav.classList.toggle('open');
      var expanded = mainNav.classList.contains('open');
      navToggle.setAttribute('aria-expanded', expanded);
    });
  }

  /* ---------- Année dans le footer ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Carrousel photos ---------- */
  document.querySelectorAll('.carousel').forEach(function (carousel) {
    var track = carousel.querySelector('.carousel-track');
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.carousel-slide'));
    var prevBtn = carousel.querySelector('[data-carousel-prev]');
    var nextBtn = carousel.querySelector('[data-carousel-next]');
    var dotsWrap = carousel.querySelector('[data-carousel-dots]');
    if (!track || !slides.length) return;

    if (dotsWrap) {
      dotsWrap.innerHTML = slides.map(function (_, i) {
        return '<button type="button" class="carousel-dot' + (i === 0 ? ' active' : '') +
          '" data-index="' + i + '" aria-label="Aller à la photo ' + (i + 1) + '"></button>';
      }).join('');
    }
    var dots = dotsWrap ? Array.prototype.slice.call(dotsWrap.querySelectorAll('.carousel-dot')) : [];

    function setActiveDot(index) {
      dots.forEach(function (d, i) { d.classList.toggle('active', i === index); });
    }

    function scrollToSlide(index) {
      var slide = slides[index];
      if (!slide) return;
      track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: 'smooth' });
    }

    function currentIndex() {
      var scrollLeft = track.scrollLeft;
      var closest = 0;
      var minDiff = Infinity;
      slides.forEach(function (slide, i) {
        var diff = Math.abs((slide.offsetLeft - track.offsetLeft) - scrollLeft);
        if (diff < minDiff) { minDiff = diff; closest = i; }
      });
      return closest;
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { scrollToSlide(Math.max(0, currentIndex() - 1)); });
    if (nextBtn) nextBtn.addEventListener('click', function () { scrollToSlide(Math.min(slides.length - 1, currentIndex() + 1)); });
    dots.forEach(function (dot, i) { dot.addEventListener('click', function () { scrollToSlide(i); }); });

    var scrollTimeout;
    track.addEventListener('scroll', function () {
      window.clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(function () { setActiveDot(currentIndex()); }, 100);
    });
  });

  /* ---------- Envoi des formulaires (Web3Forms, AJAX) ---------- */
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
              ? '✓ Succès — votre demande a bien été envoyée. Nous vous répondons sous 48 heures.'
              : "Une erreur est survenue. Merci de réessayer ou de nous écrire directement à l'adresse indiquée en pied de page.";
          }
          if (data.success) form.reset();
        })
        .catch(function () {
          if (statusBox) {
            statusBox.classList.add('show', 'error');
            statusBox.textContent = "Impossible d'envoyer le formulaire pour le moment. Merci de réessayer dans un instant.";
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

  /* ---------- Boutique : chargement des produits Airtable + rendu carte ---------- */
  var grid = document.getElementById('products-grid');
  if (grid) {
    fetch('https://oea.hinovadigital.workers.dev')
      .then(function (response) { return response.json(); })
      .then(function (data) {
        if (!data.records || data.records.length === 0) {
          grid.innerHTML = "<p style='grid-column: 1 / -1; text-align: center; color: var(--oea-text-muted);'>Aucun produit pour le moment.</p>";
          return;
        }

        var records = data.records;
        var limit = parseInt(grid.dataset.limit, 10);
        var isTeaser = !isNaN(limit) && limit > 0;
        if (isTeaser) {
          records = records.slice(0, limit);
        }

        grid.innerHTML = records.map(function (record) {
          var fields = record.fields || {};
          var priceValue = Number(fields.Prix) || 0;
          var priceParts = priceValue.toFixed(2).split('.');
          var imageUrl = (fields.Image && fields.Image[0] && fields.Image[0].url) || 'assets/images/logo-oea-mark-dark.png';
          var name = fields.Nom || 'Produit OEA';
          var nameAttr = name.replace(/"/g, '&quot;');
          var desc = fields.Description || '';
          var imageTag = '<img src="' + imageUrl + '" alt="' + nameAttr + '">';

          return (
            '<article class="product-card">' +
              '<div class="product-media">' +
                '<span class="product-badge">' + (fields.Categorie || 'Collection') + '</span>' +
                (isTeaser
                  ? '<a href="boutique.html" aria-label="Voir ' + nameAttr + ' dans la boutique">' + imageTag + '</a>'
                  : imageTag) +
              '</div>' +
              '<div class="product-body">' +
                '<h3>' + name + '</h3>' +
                '<p class="desc">' + desc + '</p>' +
                '<div class="product-foot">' +
                  '<div class="product-price-row">' +
                    '<span class="product-price-amount">' + priceParts[0] + '<span class="price-decimals">,' + priceParts[1] + '</span></span>' +
                    '<span class="product-price-currency">€</span>' +
                  '</div>' +
                  '<button type="button" class="btn btn-outline-gold btn-add-cart" ' +
                    'data-id="' + record.id + '" ' +
                    'data-name="' + nameAttr + '" ' +
                    'data-price="' + priceValue + '" ' +
                    'data-image="' + imageUrl + '">' +
                    'Ajouter' +
                  '</button>' +
                '</div>' +
              '</div>' +
            '</article>'
          );
        }).join('');
      })
      .catch(function (err) {
        console.error('Erreur de chargement:', err);
        grid.innerHTML = "<p style='grid-column: 1 / -1; text-align: center; color: #e3a494;'>Impossible de charger la collection pour le moment.</p>";
      });
  }

  /* ---------- Ajout au panier (délégation, fonctionne sur toute grille générée dynamiquement) ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.btn-add-cart');
    if (!btn || !window.OEACart) return;

    window.OEACart.addItem({
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: Number(btn.dataset.price),
      image: btn.dataset.image
    });

    var original = btn.textContent;
    btn.textContent = 'Ajouté ✓';
    btn.classList.add('added');
    btn.disabled = true;
    window.setTimeout(function () {
      btn.textContent = original;
      btn.classList.remove('added');
      btn.disabled = false;
    }, 1400);
  });

});

    navToggle.addEventListener('click', function () {
      mainNav.classList.toggle('open');
      var expanded = mainNav.classList.contains('open');
      navToggle.setAttribute('aria-expanded', expanded);
    });
  }

  /* ---------- Année dans le footer ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Carrousel photos ---------- */
  document.querySelectorAll('.carousel').forEach(function (carousel) {
    var track = carousel.querySelector('.carousel-track');
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.carousel-slide'));
    var prevBtn = carousel.querySelector('[data-carousel-prev]');
    var nextBtn = carousel.querySelector('[data-carousel-next]');
    var dotsWrap = carousel.querySelector('[data-carousel-dots]');
    if (!track || !slides.length) return;

    if (dotsWrap) {
      dotsWrap.innerHTML = slides.map(function (_, i) {
        return '<button type="button" class="carousel-dot' + (i === 0 ? ' active' : '') +
          '" data-index="' + i + '" aria-label="Aller à la photo ' + (i + 1) + '"></button>';
      }).join('');
    }
    var dots = dotsWrap ? Array.prototype.slice.call(dotsWrap.querySelectorAll('.carousel-dot')) : [];

    function setActiveDot(index) {
      dots.forEach(function (d, i) { d.classList.toggle('active', i === index); });
    }

    function scrollToSlide(index) {
      var slide = slides[index];
      if (!slide) return;
      track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: 'smooth' });
    }

    function currentIndex() {
      var scrollLeft = track.scrollLeft;
      var closest = 0;
      var minDiff = Infinity;
      slides.forEach(function (slide, i) {
        var diff = Math.abs((slide.offsetLeft - track.offsetLeft) - scrollLeft);
        if (diff < minDiff) { minDiff = diff; closest = i; }
      });
      return closest;
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { scrollToSlide(Math.max(0, currentIndex() - 1)); });
    if (nextBtn) nextBtn.addEventListener('click', function () { scrollToSlide(Math.min(slides.length - 1, currentIndex() + 1)); });
    dots.forEach(function (dot, i) { dot.addEventListener('click', function () { scrollToSlide(i); }); });

    var scrollTimeout;
    track.addEventListener('scroll', function () {
      window.clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(function () { setActiveDot(currentIndex()); }, 100);
    });
  });

  /* ---------- Envoi des formulaires (Web3Forms, AJAX) ---------- */
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
              ? '✓ Succès — votre demande a bien été envoyée. Nous vous répondons sous 48 heures.'
              : "Une erreur est survenue. Merci de réessayer ou de nous écrire directement à l'adresse indiquée en pied de page.";
          }
          if (data.success) form.reset();
        })
        .catch(function () {
          if (statusBox) {
            statusBox.classList.add('show', 'error');
            statusBox.textContent = "Impossible d'envoyer le formulaire pour le moment. Merci de réessayer dans un instant.";
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

  /* ---------- Boutique : chargement des produits Airtable + rendu carte ---------- */
  var grid = document.getElementById('products-grid');
  if (grid) {
    fetch('https://oea.hinovadigital.workers.dev')
      .then(function (response) { return response.json(); })
      .then(function (data) {
        if (!data.records || data.records.length === 0) {
          grid.innerHTML = "<p style='grid-column: 1 / -1; text-align: center; color: var(--oea-text-muted);'>Aucun produit pour le moment.</p>";
          return;
        }

        grid.innerHTML = data.records.map(function (record) {
          var fields = record.fields || {};
          var priceValue = Number(fields.Prix) || 0;
          var priceParts = priceValue.toFixed(2).split('.');
          var imageUrl = (fields.Image && fields.Image[0] && fields.Image[0].url) || 'assets/images/logo-oea-mark-dark.png';
          var name = fields.Nom || 'Produit OEA';
          var nameAttr = name.replace(/"/g, '&quot;');
          var desc = fields.Description || '';

          return (
            '<article class="product-card">' +
              '<div class="product-media">' +
                '<span class="product-badge">' + (fields.Categorie || 'Collection') + '</span>' +
                '<img src="' + imageUrl + '" alt="' + nameAttr + '">' +
              '</div>' +
              '<div class="product-body">' +
                '<h3>' + name + '</h3>' +
                '<p class="desc">' + desc + '</p>' +
                '<div class="product-foot">' +
                  '<div class="product-price-row">' +
                    '<span class="product-price-amount">' + priceParts[0] + '<span class="price-decimals">,' + priceParts[1] + '</span></span>' +
                    '<span class="product-price-currency">€</span>' +
                  '</div>' +
                  '<button type="button" class="btn btn-gold btn-add-cart btn-block" ' +
                    'data-id="' + record.id + '" ' +
                    'data-name="' + nameAttr + '" ' +
                    'data-price="' + priceValue + '" ' +
                    'data-image="' + imageUrl + '">' +
                    'Ajouter au panier' +
                  '</button>' +
                '</div>' +
              '</div>' +
            '</article>'
          );
        }).join('');
      })
      .catch(function (err) {
        console.error('Erreur de chargement:', err);
        grid.innerHTML = "<p style='grid-column: 1 / -1; text-align: center; color: #e3a494;'>Impossible de charger la collection pour le moment.</p>";
      });
  }

  /* ---------- Ajout au panier (délégation, fonctionne sur toute grille générée dynamiquement) ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.btn-add-cart');
    if (!btn || !window.OEACart) return;

    window.OEACart.addItem({
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: Number(btn.dataset.price),
      image: btn.dataset.image
    });

    var original = btn.textContent;
    btn.textContent = 'Ajouté ✓';
    btn.classList.add('added');
    btn.disabled = true;
    window.setTimeout(function () {
      btn.textContent = original;
      btn.classList.remove('added');
      btn.disabled = false;
    }, 1400);
  });

});
