/* ==========================================================================
   OEA Tahiti — logique de la page panier.html
   Nécessite js/cart.js chargé avant ce fichier.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  var linesEl = document.getElementById('cart-lines');
  var emptyEl = document.getElementById('cart-empty');
  var contentEl = document.getElementById('cart-content');
  var subtotalEl = document.getElementById('cart-subtotal');
  var totalEl = document.getElementById('cart-total');
  var checkoutBtn = document.getElementById('checkout-btn');
  var statusEl = document.getElementById('checkout-status');

  if (!linesEl || !window.OEACart) return;

  function render() {
    var cart = window.OEACart.getCart();

    if (!cart.length) {
      emptyEl.hidden = false;
      contentEl.hidden = true;
      return;
    }
    emptyEl.hidden = true;
    contentEl.hidden = false;

    linesEl.innerHTML = cart.map(function (line) {
      var lineTotal = line.price * line.quantity;
      var image = line.image || 'assets/images/logo-oea-mark-dark.png';
      return (
        '<div class="cart-line" data-line-id="' + line.id + '">' +
          '<div class="cart-line-media"><img src="' + image + '" alt="' + line.name + '"></div>' +
          '<div class="cart-line-info">' +
            '<div class="cart-line-name">' + line.name + '</div>' +
            '<div class="cart-line-price">' + window.OEACart.formatPrice(line.price) + ' / unité</div>' +
            '<div class="cart-line-qty">' +
              '<button type="button" class="qty-btn" data-qty-decrease aria-label="Diminuer la quantité">−</button>' +
              '<span class="qty-value">' + line.quantity + '</span>' +
              '<button type="button" class="qty-btn" data-qty-increase aria-label="Augmenter la quantité">+</button>' +
            '</div>' +
          '</div>' +
          '<div class="cart-line-total">' + window.OEACart.formatPrice(lineTotal) + '</div>' +
          '<button type="button" class="cart-line-remove" data-remove aria-label="Retirer cet article">✕</button>' +
        '</div>'
      );
    }).join('');

    var total = window.OEACart.getTotal();
    subtotalEl.textContent = window.OEACart.formatPrice(total);
    totalEl.textContent = window.OEACart.formatPrice(total);
  }

  linesEl.addEventListener('click', function (e) {
    var lineEl = e.target.closest('.cart-line');
    if (!lineEl) return;
    var id = lineEl.dataset.lineId;
    var cart = window.OEACart.getCart();
    var line = cart.find(function (l) { return l.id === id; });
    if (!line) return;

    if (e.target.closest('[data-qty-increase]')) {
      window.OEACart.setQuantity(id, line.quantity + 1);
      render();
    } else if (e.target.closest('[data-qty-decrease]')) {
      window.OEACart.setQuantity(id, line.quantity - 1);
      render();
    } else if (e.target.closest('[data-remove]')) {
      window.OEACart.removeItem(id);
      render();
    }
  });

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function () {
      statusEl.classList.remove('show', 'error');
      statusEl.textContent = '';
      var original = checkoutBtn.textContent;
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Redirection en cours...';

      window.OEACart.checkout()
        .then(function (url) {
          window.location.href = url;
        })
        .catch(function (err) {
          statusEl.textContent = (err && err.message) || 'Une erreur est survenue. Merci de réessayer.';
          statusEl.classList.add('show', 'error');
          checkoutBtn.disabled = false;
          checkoutBtn.textContent = original;
        });
    });
  }

  document.addEventListener('oea:cart:updated', render);
  render();
});
