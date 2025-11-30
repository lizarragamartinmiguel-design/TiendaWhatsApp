// app.js - Funcionalidad principal de la tienda

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    // Cargar productos al iniciar
    await loadProducts();
    
    // Inicializar carrito
    initializeCart();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Cargar configuración
    loadStoreConfig();
}

function setupEventListeners() {
    // Búsqueda de productos
    document.getElementById('product-search').addEventListener('input', filterProducts);
    document.getElementById('sort-select').addEventListener('change', sortProducts);
    
    // Categorías
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            filterByCategory(category);
        });
    });
    
    // Carrito
    document.getElementById('cart-icon').addEventListener('click', openCart);
    document.getElementById('close-cart').addEventListener('click', closeCart);
    document.getElementById('cart-overlay').addEventListener('click', closeCart);
    document.getElementById('checkout-whatsapp').addEventListener('click', checkoutViaWhatsApp);
    
    // Menú móvil
    document.getElementById('menu-toggle').addEventListener('click', openMobileMenu);
    document.getElementById('menu-close').addEventListener('click', closeMobileMenu);
}

// Gestión de productos
let allProducts = [];
let filteredProducts = [];

async function loadProducts() {
    try {
        showLoading(true);
        allProducts = await ProductManager.getAllProducts();
        filteredProducts = [...allProducts];
        displayProducts(filteredProducts);
        showLoading(false);
    } catch (error) {
        showError("Error al cargar productos: " + error.message);
        showLoading(false);
    }
}

function displayProducts(products) {
    const grid = document.getElementById('products-grid');
    const noProducts = document.getElementById('no-products');
    
    if (products.length === 0) {
        grid.style.display = 'none';
        noProducts.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    noProducts.style.display = 'none';
    
    grid.innerHTML = products.map(product => `
        <div class="product-card ${product.stock === 0 ? 'out-of-stock' : ''}" data-id="${product.id}">
            ${product.stock === 0 ? '<div class="product-badge">SIN STOCK</div>' : ''}
            <div class="product-image">
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name}" onload="this.classList.add('loaded')">` :
                    `<div class="image-placeholder"><i class="fas fa-box"></i></div>`
                }
                <div class="product-overlay">
                    <button class="btn btn-whatsapp" onclick="addToCart('${product.id}')" ${product.stock === 0 ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i>
                        ${product.stock === 0 ? 'Sin Stock' : 'Agregar'}
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-description">${product.description || 'Sin descripción'}</p>
                <div class="product-meta">
                    <span class="product-category">${product.category || 'General'}</span>
                    ${product.stock > 0 && product.stock < 10 ? 
                        `<span class="stock-low">Solo ${product.stock} disponibles</span>` : ''
                    }
                </div>
                <div class="product-price">$${product.price.toLocaleString()}</div>
            </div>
        </div>
    `).join('');
}

function filterProducts() {
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );
    sortProducts();
}

function sortProducts() {
    const sortBy = document.getElementById('sort-select').value;
    
    switch(sortBy) {
        case 'name':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
            filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
    }
    
    displayProducts(filteredProducts);
}

function filterByCategory(category) {
    // Actualizar UI de categorías
    document.querySelectorAll('.category-card').forEach(card => {
        card.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    if (category === 'all') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => 
            product.category === category
        );
    }
    
    sortProducts();
}

function resetFilters() {
    document.getElementById('product-search').value = '';
    document.getElementById('sort-select').value = 'name';
    filterByCategory('all');
    filterProducts();
}

// Gestión del carrito
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function initializeCart() {
    updateCartUI();
}

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            showNotification('No hay suficiente stock disponible', 'error');
            return;
        }
        existingItem.quantity++;
    } else {
        if (product.stock < 1) {
            showNotification('Producto sin stock', 'error');
            return;
        }
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
    showNotification('Producto agregado al carrito', 'success');
    
    // Animación del carrito
    document.getElementById('cart-icon').classList.add('cart-bounce');
    setTimeout(() => {
        document.getElementById('cart-icon').classList.remove('cart-bounce');
    }, 600);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
    showNotification('Producto removido del carrito', 'success');
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    const product = allProducts.find(p => p.id === productId);
    const newQuantity = item.quantity + change;
    
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    if (product && newQuantity > product.stock) {
        showNotification('No hay suficiente stock disponible', 'error');
        return;
    }
    
    item.quantity = newQuantity;
    saveCart();
    updateCartUI();
}

function clearCart() {
    cart = [];
    saveCart();
    updateCartUI();
    showNotification('Carrito vaciado', 'success');
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelector('.cart-count').textContent = cartCount;
    
    // Actualizar items del carrito
    const cartItems = document.getElementById('cart-items');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartShipping = document.getElementById('cart-shipping');
    const cartTotal = document.getElementById('cart-total');
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
                <p>Tu carrito está vacío</p>
                <button class="btn btn-whatsapp" onclick="closeCart()">
                    <i class="fas fa-shopping-bag"></i>
                    Comenzar a comprar
                </button>
            </div>
        `;
        cartSubtotal.textContent = '0.00';
        cartShipping.textContent = '0.00';
        cartTotal.textContent = '0.00';
        return;
    }
    
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shippingCost = subtotal >= STORE_CONFIG.freeShippingThreshold ? 0 : STORE_CONFIG.shippingCost;
    const total = subtotal + shippingCost;
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image || ''}" alt="${item.name}" onerror="this.style.display='none'">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div class="cart-item-price">$${item.price.toLocaleString()}</div>
                <div class="cart-item-actions">
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                </div>
            </div>
            <button class="remove-btn" onclick="removeFromCart('${item.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    cartSubtotal.textContent = subtotal.toLocaleString();
    cartShipping.textContent = shippingCost.toLocaleString();
    cartTotal.textContent = total.toLocaleString();
}

function openCart() {
    document.getElementById('cart-sidebar').classList.add('active');
    document.getElementById('cart-overlay').classList.add('active');
    updateCartUI();
}

function closeCart() {
    document.getElementById('cart-sidebar').classList.remove('active');
    document.getElementById('cart-overlay').classList.remove('active');
}

// WhatsApp Integration
function openWhatsAppContact() {
    const phone = WHATSAPP_CONFIG.phoneNumber;
    const message = WHATSAPP_CONFIG.welcomeMessage;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
}

function checkoutViaWhatsApp() {
    if (cart.length === 0) {
        showNotification('Tu carrito está vacío', 'error');
        return;
    }
    
    const phone = WHATSAPP_CONFIG.phoneNumber;
    const productsText = cart.map(item => 
        `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toLocaleString()}`
    ).join('%0A');
    
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shippingCost = subtotal >= STORE_CONFIG.freeShippingThreshold ? 0 : STORE_CONFIG.shippingCost;
    const total = subtotal + shippingCost;
    
    let message = WHATSAPP_CONFIG.orderTemplate
        .replace('{productos}', productsText)
        .replace('{total}', total.toLocaleString())
        .replace('{cliente}', 'Cliente DISTRIMAX');
    
    message += '%0A%0AProductos:%0A' + productsText;
    message += `%0A%0ASubtotal: $${subtotal.toLocaleString()}`;
    message += `%0AEnv\u00EDo: $${shippingCost.toLocaleString()}`;
    message += `%0ATotal: $${total.toLocaleString()}`;
    
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    
    // Limpiar carrito después del pedido
    clearCart();
    closeCart();
    showNotification('Pedido enviado por WhatsApp', 'success');
}

// UI Helpers
function showLoading(show) {
    document.getElementById('loading-products').style.display = show ? 'block' : 'none';
    document.getElementById('products-grid').style.display = show ? 'none' : 'grid';
}

function showError(message) {
    document.getElementById('error-message-text').textContent = message;
    document.getElementById('error-products').style.display = 'block';
    document.getElementById('products-grid').style.display = 'none';
    document.getElementById('loading-products').style.display = 'none';
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    notificationText.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function openMobileMenu() {
    document.getElementById('mobile-menu').classList.add('active');
}

function closeMobileMenu() {
    document.getElementById('mobile-menu').classList.remove('active');
}

function toggleDebugInfo() {
    const debugInfo = document.getElementById('debug-info');
    debugInfo.style.display = debugInfo.style.display === 'none' ? 'block' : 'none';
    
    if (debugInfo.style.display === 'block') {
        debugInfo.innerHTML = `
            <strong>Información de Debug:</strong><br>
            - Productos cargados: ${allProducts.length}<br>
            - Carrito: ${cart.length} items<br>
            - Config WhatsApp: ${WHATSAPP_CONFIG.phoneNumber}<br>
            - Última actualización: ${new Date().toLocaleString()}
        `;
    }
}

async function loadStoreConfig() {
    try {
        const config = await ConfigManager.getConfig();
        if (config) {
            // Actualizar configuración con valores de la base de datos
            WHATSAPP_CONFIG.phoneNumber = config.get("whatsappNumber") || WHATSAPP_CONFIG.phoneNumber;
            WHATSAPP_CONFIG.businessName = config.get("businessName") || WHATSAPP_CONFIG.businessName;
            STORE_CONFIG.shippingCost = config.get("shippingCost") || STORE_CONFIG.shippingCost;
            STORE_CONFIG.freeShippingThreshold = config.get("freeShippingThreshold") || STORE_CONFIG.freeShippingThreshold;
        }
    } catch (error) {
        console.error("Error loading store config:", error);
    }
}

// Hacer funciones disponibles globalmente
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.clearCart = clearCart;
window.openCart = openCart;
window.closeCart = closeCart;
window.openWhatsAppContact = openWhatsAppContact;
window.checkoutViaWhatsApp = checkoutViaWhatsApp;
window.loadProducts = loadProducts;
window.resetFilters = resetFilters;
window.toggleDebugInfo = toggleDebugInfo;
window.openMobileMenu = openMobileMenu;
window.closeMobileMenu = closeMobileMenu;