/* ==========================================================================
   OEA — moteur de panier (localStorage)
   Chargé sur TOUTES les pages, avant main.js et avant tout script de page.
   Expose window.OEACart pour être utilisé par main.js et panier.html.
   ========================================================================== */

(function () {
  'use strict';

  var CART_KEY = 'oea_cart';
  var CHECKOUT_URL = 'https://oea.hinovadigital.workers.dev/create-checkout-session';

  function readCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('OEACart: panier local illisible, réinitialisation.', e);
      return [];
    }
  }

  function writeCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error("OEACart: impossible d'enregistrer le panier.", e);
    }
    updateBadges();
    document.dispatchEvent(new CustomEvent('oea:cart:updated', { detail: { cart: cart } }));
  }

  function addItem(item) {
    if (!item || !item.id) return readCart();
    var cart = readCart();
    var qtyToAdd = item.quantity && item.quantity > 0 ? item.quantity : 1;
    var existing = cart.find(function (line) { return line.id === item.id; });
    if (existing) {
      existing.quantity += qtyToAdd;
    } else {
      cart.push({
        id: item.id,
        name: item.name || 'Produit OEA',
        price: Number(item.price) || 0,
        image: item.image || '',
        quantity: qtyToAdd
      });
    }
    writeCart(cart);
    return cart;
  }

  function removeItem(id) {
    var cart = readCart().filter(function (line) { return line.id !== id; });
    writeCart(cart);
    return cart;
  }

  function setQuantity(id, quantity) {
    var cart = readCart();
    if (quantity <= 0) {
      cart = cart.filter(function (line) { return line.id !== id; });
    } else {
      cart = cart.map(function (line) {
        if (line.id === id) line.quantity = quantity;
        return line;
      });
    }
    writeCart(cart);
    return cart;
  }

  function clearCart() {
    writeCart([]);
  }

  function getCount() {
    return readCart().reduce(function (sum, line) { return sum + line.quantity; }, 0);
  }

  function getTotal() {
    return readCart().reduce(function (sum, line) { return sum + line.price * line.quantity; }, 0);
  }

  function formatPrice(value) {
    return Number(value || 0).toFixed(2).replace('.', ',') + ' €';
  }

  function updateBadges() {
    var count = getCount();
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = count;
      var link = el.closest('.cart-link');
      if (link) link.classList.toggle('has-items', count > 0);
      el.classList.add('pulse');
      window.setTimeout(function () { el.classList.remove('pulse'); }, 400);
    });
  }

  function checkout() {
    var cart = readCart();
    if (!cart.length) {
      return Promise.reject(new Error('Votre panier est vide.'));
    }
    var items = cart.map(function (line) {
      return { name: line.name, price: line.price, quantity: line.quantity };
    });
    return fetch(CHECKOUT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Le service de paiement n'a pas répondu correctement.");
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.url) throw new Error('Réponse de paiement invalide.');
        return data.url;
      });
  }

  window.OEACart = {
    getCart: readCart,
    addItem: addItem,
    removeItem: removeItem,
    setQuantity: setQuantity,
    clearCart: clearCart,
    getCount: getCount,
    getTotal: getTotal,
    formatPrice: formatPrice,
    updateBadges: updateBadges,
    checkout: checkout
  };

  document.addEventListener('DOMContentLoaded', updateBadges);
})();
