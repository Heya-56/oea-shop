document.addEventListener("DOMContentLoaded", async () => {
    const grid = document.getElementById("products-grid");
    if (!grid) return;

    try {
        const response = await fetch("https://oea.hinovadigital.workers.dev");
        const data = await response.json();
        
        if (!data.records || data.records.length === 0) {
            grid.innerHTML = "<p style='grid-column: 1 / -1; text-align: center; color: #c5a880;'>Aucun produit pour le moment.</p>";
            return;
        }

        grid.innerHTML = data.records.map(record => {
            const fields = record.fields;
            return `
                <article class="product-card">
                    <div class="product-media">
                        <span class="product-badge">${fields.Categorie || 'Collection'}</span>
                        <img src="${fields.Image && fields.Image[0] ? fields.Image[0].url : 'assets/images/logo-oea-mark-dark.png'}" alt="${fields.Nom || 'Produit'}">
                    </div>
                    <div class="product-body">
                        <h3>${fields.Nom || 'Produit OEA'}</h3>
                        <p class="desc">${fields.Description || ''}</p>
                        <div class="product-foot">
                            <span class="product-price">${fields.Prix ? fields.Prix + ' €' : ''}</span>
                            <a href="${fields.LienStripe || 'contact.html'}" class="btn btn-gold" target="_blank" rel="noopener">Commander →</a>
                        </div>
                    </div>
                </article>
            `;
        }).join("");

    } catch (err) {
        console.error("Erreur de chargement:", err);
        grid.innerHTML = "<p style='grid-column: 1 / -1; text-align: center; color: #ff6b6b;'>Impossible de charger la collection pour le moment.</p>";
    }
});
