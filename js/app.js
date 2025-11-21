// app.js - Tienda WhatsApp - Versión Corregida
// =============================================
// CONFIGURACIÓN WHATSAPP - SINCRONIZACIÓN CON ADMIN
// =============================================

function loadWhatsAppConfig() {
    const DEFAULT_NUMBER = '5493624366733';
    
    try {
        console.log('📱 Cargando configuración WhatsApp...');
        
        // Prioridad 1: Configuración del admin (paymentWhatsAppNumber)
        const paymentNumber = localStorage.getItem('paymentWhatsAppNumber');
        if (paymentNumber && paymentNumber.trim() !== '' && paymentNumber !== '5491112345678') {
            console.log('✅ Usando número del admin:', paymentNumber);
            return paymentNumber;
        }
        
        // Prioridad 2: Configuración legacy de whatsappConfig
        const whatsappConfig = localStorage.getItem('whatsappConfig');
        if (whatsappConfig) {
            const config = JSON.parse(whatsappConfig);
            if (config.whatsappNumber && config.whatsappNumber.trim() !== '' && config.whatsappNumber !== '5491112345678') {
                console.log('✅ Usando whatsappConfig:', config.whatsappNumber);
                return config.whatsappNumber;
            }
        }
        
        // Prioridad 3: Configuración storeSettings
        const storeSettings = localStorage.getItem('storeSettings');
        if (storeSettings) {
            const config = JSON.parse(storeSettings);
            if (config.whatsappNumber && config.whatsappNumber.trim() !== '' && config.whatsappNumber !== '5491112345678') {
                console.log('✅ Usando storeSettings:', config.whatsappNumber);
                return config.whatsappNumber;
            }
        }
        
        // Fallback al número por defecto
        console.log('🔄 Usando número por defecto:', DEFAULT_NUMBER);
        return DEFAULT_NUMBER;
        
    } catch (error) {
        console.error('❌ Error cargando configuración WhatsApp:', error);
        return DEFAULT_NUMBER;
    }
}

function openWhatsAppContact() {
    const phoneNumber = loadWhatsAppConfig();
    const message = encodeURIComponent('¡Hola! Me gustaría obtener más información sobre sus productos.');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
}

function debugWhatsAppConfig() {
    console.log('🐛 DEBUG WhatsApp Configuration:');
    console.log('- storeSettings:', localStorage.getItem('storeSettings'));
    console.log('- paymentWhatsAppNumber:', localStorage.getItem('paymentWhatsAppNumber'));
    console.log('- whatsappConfig:', localStorage.getItem('whatsappConfig'));
    console.log('- Número actual:', loadWhatsAppConfig());
    
    // Mostrar en UI si hay un elemento debug
    const debugInfo = document.getElementById('debug-info');
    if (debugInfo) {
        debugInfo.innerHTML = `
            <strong>Debug WhatsApp:</strong><br>
            storeSettings: ${localStorage.getItem('storeSettings')}<br>
            paymentWhatsAppNumber: ${localStorage.getItem('paymentWhatsAppNumber')}<br>
            Número detectado: ${loadWhatsAppConfig()}
        `;
        debugInfo.style.display = 'block';
    }
}

// =============================================
// CONFIGURACIÓN BACK4APP
// =============================================

Parse.initialize("vRn25suEgknHSSZSALpSXXWd0I2EPcIFGBPBFODW", "UxlCa92gr2i1hDu8pBuJMeuanXbhDpVjTMvMzTl9");
Parse.serverURL = 'https://parseapi.back4app.com/';

// =============================================
// ESTADO DE LA APLICACIÓN
// =============================================

let appState = {
    products: [],
    filteredProducts: [],
    cart: [],
    currentCategory: 'all',
    searchTerm: '',
    sortBy: 'name',
    useStockImages: true,
    shippingConfig: {
        cost: 5000,
        freeShippingThreshold: 50000,
        enabled: true
    }
};

// Base de datos de imágenes de stock por categoría
const stockImages = {
    'Ropa': [
        'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400',
        'https://images.unsplash.com/photo-1499336315816-097655dcfbda?w=400'
    ],
    'Calzado': [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
        'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400',
        'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400'
    ],
    'Electrónicos': [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400',
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400'
    ],
    'Hogar': [
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400'
    ],
    'Accesorios': [
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400',
        'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400'
    ],
    'default': [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400'
    ]
};

// =============================================
// ELEMENTOS DOM
// =============================================

const elements = {
    productsGrid: document.getElementById('products-grid'),
    loadingProducts: document.getElementById('loading-products'),
    noProducts: document.getElementById('no-products'),
    errorProducts: document.getElementById('error-products'),
    errorMessageText: document.getElementById('error-message-text'),
    debugInfo: document.getElementById('debug-info'),
    cartIcon: document.getElementById('cart-icon'),
    cartSidebar: document.getElementById('cart-sidebar'),
    cartOverlay: document.getElementById('cart-overlay'),
    closeCart: document.getElementById('close-cart'),
    cartItems: document.getElementById('cart-items'),
    cartSubtotal: document.getElementById('cart-subtotal'),
    cartShipping: document.getElementById('cart-shipping'),
    cartTotal: document.getElementById('cart-total'),
    checkoutBtn: document.getElementById('checkout-whatsapp'),
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notification-text'),
    searchInput: document.getElementById('product-search'),
    sortSelect: document.getElementById('sort-select'),
    categoryCards: document.querySelectorAll('.category-card'),
    menuToggle: document.getElementById('menu-toggle'),
    mobileMenu: document.getElementById('mobile-menu'),
    menuClose: document.getElementById('menu-close'),
    promoBanner: document.getElementById('promo-banner')
};

// =============================================
// INICIALIZACIÓN
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏪 Inicializando tienda...');
    initApp();
    setupEventListeners();
});

async function initApp() {
    console.log('🔧 Inicializando aplicación...');
    
    // Cargar configuración de WhatsApp primero
    const whatsappNumber = loadWhatsAppConfig();
    console.log('📞 WhatsApp configurado:', whatsappNumber);
    
    // Cargar configuración de envío
    loadShippingConfig();
    
    // Luego cargar productos y carrito
    await loadProducts();
    loadCartFromStorage();
    updateCartUI();
    
    console.log('✅ Tienda inicializada correctamente');
}

function setupEventListeners() {
    // Carrito
    elements.cartIcon.addEventListener('click', openCart);
    elements.closeCart.addEventListener('click', closeCart);
    elements.cartOverlay.addEventListener('click', closeCart);
    elements.checkoutBtn.addEventListener('click', checkoutWhatsApp);

    // Búsqueda y filtros
    elements.searchInput.addEventListener('input', handleSearch);
    elements.sortSelect.addEventListener('change', handleSort);

    // Categorías
    elements.categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.getAttribute('data-category');
            filterByCategory(category);
        });
    });

    // Menú móvil
    elements.menuToggle.addEventListener('click', toggleMobileMenu);
    elements.menuClose.addEventListener('click', toggleMobileMenu);

    // Cerrar menú al hacer clic en enlaces
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', toggleMobileMenu);
    });
}

function toggleMobileMenu() {
    elements.mobileMenu.classList.toggle('active');
}

function toggleDebugInfo() {
    elements.debugInfo.style.display = elements.debugInfo.style.display === 'none' ? 'block' : 'none';
}

// =============================================
// CONFIGURACIÓN DE ENVÍO
// =============================================

function loadShippingConfig() {
    console.log('🚚 Cargando configuración de envío...');
    
    try {
        const storeSettings = JSON.parse(localStorage.getItem('storeSettings') || '{}');

        appState.shippingConfig.cost = parseInt(storeSettings.shippingCost) || 5000;
        appState.shippingConfig.freeShippingThreshold = parseInt(storeSettings.freeShippingThreshold) || 50000;
        appState.shippingConfig.enabled = storeSettings.shippingEnabled !== undefined ? 
                                        storeSettings.shippingEnabled : true;

        console.log('📦 Configuración de envío cargada:', appState.shippingConfig);
        updatePromoBanner();
    } catch (e) {
        console.error('Error cargando configuración de envío:', e);
        appState.shippingConfig.enabled = true;
    }
}

function updatePromoBanner() {
    // Si el vendedor desactivó el envío, ocultamos el banner
    if (!appState.shippingConfig.enabled) {
        elements.promoBanner.style.display = 'none';
        return;
    }

    const threshold = appState.shippingConfig.freeShippingThreshold;
    const formattedThreshold = threshold.toLocaleString();
    
    elements.promoBanner.innerHTML = `
        🎉 ¡Envío gratis en compras mayores a $${formattedThreshold}! 
        <a href="#products" class="btn btn-sm">Ver productos</a>
    `;
}

function calculateShipping(subtotal) {
    // Si el envío está desactivado por el vendedor → siempre $0
    if (!appState.shippingConfig.enabled) return 0;

    const { cost, freeShippingThreshold } = appState.shippingConfig;
    return subtotal >= freeShippingThreshold ? 0 : cost;
}

// =============================================
// FUNCIONES DE PRODUCTOS
// =============================================

async function loadProducts() {
    try {
        console.log('📦 Iniciando carga de productos...');
        
        // Mostrar loading
        elements.loadingProducts.style.display = 'block';
        elements.productsGrid.style.display = 'none';
        elements.noProducts.style.display = 'none';
        elements.errorProducts.style.display = 'none';

        const Product = Parse.Object.extend('Product');
        const query = new Parse.Query(Product);
        
        // Solo productos activos
        query.equalTo('isActive', true);
        
        console.log('🔍 Ejecutando query...');
        const results = await query.find();
        console.log('✅ Productos encontrados:', results.length);
        
        if (results.length === 0) {
            console.log('ℹ️ No se encontraron productos en la base de datos');
            elements.noProducts.style.display = 'block';
            elements.loadingProducts.style.display = 'none';
            return;
        }
        
        appState.products = results.map((product, index) => {
            console.log('🔄 Procesando producto:', product.id, product.get('name'));
            
            // CORRECCIÓN: Manejo seguro de la categoría
            let categoryName = 'Sin categoría';
            const category = product.get('category');
            
            if (category && typeof category.get === 'function') {
                // Si es un objeto Parse (Pointer)
                categoryName = category.get('name') || 'Sin categoría';
            } else if (typeof category === 'string') {
                // Si es un string directo
                categoryName = category;
            } else if (category && category.name) {
                // Si es un objeto con propiedad name
                categoryName = category.name;
            }

            // SOLUCIÓN: Manejo inteligente de imágenes
            let imageUrl = getProductImage(product, categoryName, index);
            
            return {
                id: product.id,
                name: product.get('name') || 'Sin nombre',
                description: product.get('description') || '',
                price: product.get('price') || 0,
                originalPrice: product.get('originalPrice'),
                image: imageUrl,
                category: categoryName,
                stock: product.get('stock') || 0,
                isActive: product.get('isActive') || true,
                sku: product.get('sku') || '',
                features: product.get('features') || [],
                rawImageData: product.get('image')
            };
        });

        console.log('🎯 Productos procesados:', appState.products.length);
        appState.filteredProducts = [...appState.products];
        renderProducts();
        
    } catch (error) {
        console.error('❌ Error detallado al cargar productos:', error);
        
        // Mostrar información detallada del error
        let errorMessage = 'Error desconocido';
        let debugInfo = '';
        
        if (error.code) {
            switch(error.code) {
                case 101:
                    errorMessage = 'Error de autenticación con Back4App. Verifica las credenciales.';
                    break;
                case 100:
                    errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
                    break;
                case 141:
                    errorMessage = 'Error de permisos. La clase Product no existe o no tienes permisos.';
                    break;
                default:
                    errorMessage = `Error ${error.code}: ${error.message}`;
            }
            debugInfo = `Código: ${error.code}\nMensaje: ${error.message}\nStack: ${error.stack}`;
        } else {
            errorMessage = error.message || 'Error desconocido al conectar con Back4App';
            debugInfo = error.toString();
        }
        
        showError(errorMessage, debugInfo);
        
    } finally {
        elements.loadingProducts.style.display = 'none';
    }
}

function getProductImage(product, category, index) {
    // 1. Primero intentar con imageUrl (campo string)
    const imageUrl = product.get('imageUrl');
    if (imageUrl && imageUrl.startsWith('http')) {
        return imageUrl;
    }
    
    // 2. Luego intentar con el campo image (File)
    const imageFile = product.get('image');
    if (imageFile) {
        if (typeof imageFile.url === 'function') {
            return imageFile.url();
        } else if (imageFile._url) {
            return imageFile._url;
        } else if (imageFile.url) {
            return imageFile.url;
        }
    }
    
    // 3. Si no hay imagen, usar imágenes de stock según categoría
    if (appState.useStockImages) {
        const categoryImages = stockImages[category] || stockImages.default;
        const imageIndex = index % categoryImages.length;
        return categoryImages[imageIndex];
    }
    
    // 4. Último recurso: placeholder
    return 'img/placeholder.jpg';
}

function showError(message, debugInfo = '') {
    elements.errorMessageText.textContent = message;
    elements.debugInfo.textContent = debugInfo;
    elements.errorProducts.style.display = 'block';
    elements.loadingProducts.style.display = 'none';
    elements.productsGrid.style.display = 'none';
    elements.noProducts.style.display = 'none';
}

function renderProducts() {
    if (appState.filteredProducts.length === 0) {
        elements.noProducts.style.display = 'block';
        elements.productsGrid.style.display = 'none';
        elements.errorProducts.style.display = 'none';
        return;
    }

    elements.productsGrid.style.display = 'grid';
    elements.noProducts.style.display = 'none';
    elements.errorProducts.style.display = 'none';

    const productsHTML = appState.filteredProducts.map(product => `
                    <div class="product-card ${product.stock === 0 ? 'out-of-stock' : ''}">
            ${product.stock < 10 && product.stock > 0 ? '<span class="product-badge stock-low">¡Últimas unidades!</span>' : ''}
            ${product.originalPrice && product.originalPrice > product.price ? 
                '<span class="product-badge" style="background: #2ed573;">¡Oferta!</span>' : ''}
            
            <div class="product-image">
                ${getProductImageHTML(product)}
                <div class="product-overlay">
                    <button class="btn btn-whatsapp" onclick="addToCart('${product.id}')" 
                            ${product.stock === 0 ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i>
                        ${product.stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                    </button>
                </div>
            </div>
            
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description.substring(0, 80)}...</p>
                
                <div class="product-price">
                    ${product.originalPrice && product.originalPrice > product.price ? 
                        `<span class="original-price">$${product.originalPrice.toLocaleString()}</span>` : ''}
                    <span class="current-price">$${product.price.toLocaleString()}</span>
                </div>
                
                <div class="product-meta">
                    <span class="product-category">
                        <i class="fas fa-tag"></i> ${product.category}
                    </span>
                    <span class="product-stock ${product.stock < 5 ? 'stock-low' : ''}">
                        <i class="fas fa-box"></i> 
                        ${product.stock === 0 ? 'Agotado' : `${product.stock} disponibles`}
                    </span>
                </div>
            </div>
        </div>
    `).join('');

    elements.productsGrid.innerHTML = productsHTML;
    
    // Precargar imágenes después de renderizar
    preloadImages();
    
    console.log('🎨 Productos renderizados:', appState.filteredProducts.length);
}

// Función optimizada para manejar imágenes
function getProductImageHTML(product) {
    // Si es placeholder, mostrar icono directamente
    if (product.image === 'img/placeholder.jpg' || !product.image) {
        return `
            <div class="image-placeholder">
                <i class="fas fa-image"></i>
                <small style="position: absolute; bottom: 5px; font-size: 0.7rem;">Sin imagen</small>
            </div>
        `;
    }
    
    // Si tiene imagen real, usar optimización
    return `
        <img src="${product.image}" 
             alt="${product.name}"
             loading="lazy"
             onload="this.classList.add('loaded')"
             onerror="handleImageError(this)">
        <div class="image-placeholder" style="display: none;">
            <i class="fas fa-image"></i>
            <small style="position: absolute; bottom: 5px; font-size: 0.7rem;">Error cargando</small>
        </div>
    `;
}

function handleImageError(img) {
    img.style.display = 'none';
    const placeholder = img.nextElementSibling;
    if (placeholder) {
        placeholder.style.display = 'flex';
    }
    console.error('❌ Error cargando imagen:', img.src);
}

// Precargar imágenes para evitar parpadeo
function preloadImages() {
    const images = elements.productsGrid.querySelectorAll('img');
    images.forEach(img => {
        const imageLoader = new Image();
        imageLoader.src = img.src;
    });
}

// =============================================
// FUNCIONES DE FILTROS
// =============================================

function handleSearch(e) {
    appState.searchTerm = e.target.value.toLowerCase();
    applyFilters();
}

function handleSort(e) {
    appState.sortBy = e.target.value;
    applyFilters();
}

function filterByCategory(category) {
    // Actualizar UI de categorías
    elements.categoryCards.forEach(card => {
        card.classList.remove('active');
        if (card.getAttribute('data-category') === category) {
            card.classList.add('active');
        }
    });
    
    appState.currentCategory = category;
    applyFilters();
}

function applyFilters() {
    let filtered = [...appState.products];
    
    // Filtrar por categoría
    if (appState.currentCategory !== 'all') {
        filtered = filtered.filter(product => 
            product.category === appState.currentCategory
        );
    }
    
    // Filtrar por búsqueda
    if (appState.searchTerm) {
        filtered = filtered.filter(product =>
            product.name.toLowerCase().includes(appState.searchTerm) ||
            product.description.toLowerCase().includes(appState.searchTerm) ||
            product.category.toLowerCase().includes(appState.searchTerm)
        );
    }
    
    // Ordenar
    switch (appState.sortBy) {
        case 'price-low':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
            // Si tienes fecha de creación, usar eso
            filtered.reverse();
            break;
        default:
            filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    appState.filteredProducts = filtered;
    renderProducts();
}

function resetFilters() {
    appState.searchTerm = '';
    appState.currentCategory = 'all';
    appState.sortBy = 'name';
    
    // Resetear UI
    elements.searchInput.value = '';
    elements.sortSelect.value = 'name';
    elements.categoryCards.forEach(card => {
        card.classList.remove('active');
        if (card.getAttribute('data-category') === 'all') {
            card.classList.add('active');
        }
    });
    
    applyFilters();
}

// =============================================
// FUNCIONES OPTIMIZADAS DEL CARRITO
// =============================================

function generateCartId() {
    return 'cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function animateCartIcon() {
    elements.cartIcon.classList.add('cart-bounce');
    setTimeout(() => {
        elements.cartIcon.classList.remove('cart-bounce');
    }, 600);
}

function addToCart(productId) {
    const product = appState.products.find(p => p.id === productId);
    
    if (!product) {
        showNotification('Producto no encontrado', 'error');
        return;
    }
    
    if (product.stock === 0) {
        showNotification('Producto agotado', 'error');
        return;
    }
    
    const existingItem = appState.cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            showNotification('No hay más stock disponible', 'error');
            return;
        }
        existingItem.quantity += 1;
    } else {
        appState.cart.push({
            ...product,
            quantity: 1,
            cartId: generateCartId()
        });
    }
    
    saveCartToStorage();
    updateCartUI();
    showNotification(`${product.name} agregado al carrito`);
    
    // Efecto visual de confirmación
    animateCartIcon();
    
    // Abrir carrito automáticamente en móvil
    if (window.innerWidth < 768) {
        openCart();
    }
}

function removeFromCart(cartItemId) {
    const itemIndex = appState.cart.findIndex(item => item.cartId === cartItemId);
    
    if (itemIndex === -1) {
        showNotification('Producto no encontrado en el carrito', 'error');
        return;
    }
    
    const removedItem = appState.cart[itemIndex];
    appState.cart.splice(itemIndex, 1);
    
    saveCartToStorage();
    updateCartUI();
    showNotification(`${removedItem.name} removido del carrito`);
    
    // Si el carrito queda vacío, cerrarlo automáticamente
    if (appState.cart.length === 0) {
        setTimeout(closeCart, 1500);
    }
}

function updateCartQuantity(cartItemId, change) {
    const item = appState.cart.find(item => item.cartId === cartItemId);
    
    if (!item) {
        showNotification('Producto no encontrado en el carrito', 'error');
        return;
    }
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity < 1) {
        removeFromCart(cartItemId);
        return;
    }
    
    const originalProduct = appState.products.find(p => p.id === item.id);
    
    if (originalProduct && newQuantity > originalProduct.stock) {
        showNotification(`Solo quedan ${originalProduct.stock} unidades disponibles`, 'error');
        return;
    }
    
    item.quantity = newQuantity;
    saveCartToStorage();
    updateCartUI();
    
    // Mostrar notificación solo para cambios significativos
    if (Math.abs(change) > 0) {
        const action = change > 0 ? 'aumentada' : 'disminuida';
        showNotification(`Cantidad de ${item.name} ${action}`);
    }
}

function clearCart() {
    if (appState.cart.length === 0) {
        showNotification('El carrito ya está vacío', 'info');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres vaciar todo el carrito?')) {
        appState.cart = [];
        saveCartToStorage();
        updateCartUI();
        showNotification('Carrito vaciado');
        closeCart();
    }
}

function updateCartUI() {
    // Actualizar contador del carrito
    const totalItems = appState.cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelector('.cart-count').textContent = totalItems;
    
    // Actualizar items del carrito
    if (appState.cart.length === 0) {
        elements.cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
                <p>Tu carrito está vacío</p>
                <button class="btn btn-whatsapp" onclick="closeCart()">
                    <i class="fas fa-shopping-bag"></i>
                    Comenzar a comprar
                </button>
            </div>
        `;
    } else {
        elements.cartItems.innerHTML = appState.cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" 
                     onerror="this.src='img/placeholder.jpg'">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p class="cart-item-price">$${item.price.toLocaleString()}</p>
                    <div class="cart-item-actions">
                        <button class="quantity-btn" onclick="updateCartQuantity('${item.cartId}', -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateCartQuantity('${item.cartId}', 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="remove-btn" onclick="removeFromCart('${item.cartId}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Actualizar totales con configuración de envío dinámica
    const subtotal = appState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = calculateShipping(subtotal);
    const total = subtotal + shipping;
    
    elements.cartSubtotal.textContent = subtotal.toLocaleString();
    elements.cartShipping.textContent = shipping.toLocaleString();
    elements.cartTotal.textContent = total.toLocaleString();
    
    // Resaltar envío gratis si aplica
    if (shipping === 0 && subtotal > 0) {
        elements.cartShipping.innerHTML = `<span style="color: #2ed573;">¡GRATIS!</span>`;
    }
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('tiendawhats-cart');
    if (savedCart) {
        try {
            appState.cart = JSON.parse(savedCart);
        console.log('📥 Carrito cargado desde localStorage:', appState.cart.length, 'items');
        } catch (error) {
            console.error('❌ Error loading cart from storage:', error);
            appState.cart = [];
        }
    } else {
        console.log('🛒 No hay carrito guardado en localStorage');
    }
}

function saveCartToStorage() {
    localStorage.setItem('tiendawhats-cart', JSON.stringify(appState.cart));
    console.log('💾 Carrito guardado en localStorage:', appState.cart.length, 'items');
}

function openCart() {
    elements.cartSidebar.classList.add('active');
    elements.cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    elements.cartSidebar.classList.remove('active');
    elements.cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// =============================================
// FUNCIÓN DE CHECKOUT WHATSAPP ACTUALIZADA
// =============================================

function checkoutWhatsApp() {
    if (appState.cart.length === 0) {
        showNotification('Tu carrito está vacío', 'error');
        return;
    }
    
    console.log('🛒 Iniciando checkout...');
    
    // Cargar configuración actualizada de WhatsApp
    const phoneNumber = loadWhatsAppConfig();
    
    if (!phoneNumber || phoneNumber === '5491112345678') {
        showNotification('Error: Número de WhatsApp no configurado', 'error');
        console.error('❌ Número incorrecto:', phoneNumber);
        return;
    }
    
    console.log('📞 Enviando pedido a:', phoneNumber);
    
    // Crear mensaje detallado con información de envío
    let message = "¡Hola! Quiero hacer el siguiente pedido:%0A%0A";
    
    appState.cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name} - $${item.price.toLocaleString()} x ${item.quantity}%0A`;
    });
    
    const subtotal = appState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = calculateShipping(subtotal);
    const total = subtotal + shipping;
    
    message += `%0ASubtotal: $${subtotal.toLocaleString()}%0A`;
    // Si el envío está desactivado lo indicamos
    if (!appState.shippingConfig.enabled) {
        message += `Envío: $0 (a coordinar con el vendedor)%0A`;
    } else {
        message += `Envío: $${shipping.toLocaleString()}${shipping === 0 ? ' (¡GRATIS!)' : ''}%0A`;
    }
    message += `*Total: $${total.toLocaleString()}*%0A%0A`;
    
    // Agregar información de envío gratis si aplica
    if (shipping === 0) {
        message += `🎉 ¡Aproveché el envío gratis!%0A%0A`;
    } else if (appState.shippingConfig.enabled && shipping > 0) {
        const remaining = appState.shippingConfig.freeShippingThreshold - subtotal;
        if (remaining > 0) {
            message += `💡 Me faltan $${remaining.toLocaleString()} para envío gratis%0A%0A`;
        }
    }
    
    message += "¡Gracias!";
    
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    console.log('🔗 URL generada:', whatsappUrl);
    
    // Abrir en nueva pestaña
    window.open(whatsappUrl, '_blank');
    
    // Limpiar carrito después del envío
    setTimeout(() => {
        clearCart();
        showNotification('Pedido enviado correctamente a WhatsApp');
    }, 1000);
}

function showNotification(text, type = 'success') {
    elements.notificationText.textContent = text;
    elements.notification.className = 'notification';
    elements.notification.classList.add(type);
    elements.notification.classList.add('show');
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}