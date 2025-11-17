// =============================================
// CONFIGURACIÓN BACK4APP - CON TUS CLAVES REALES
// =============================================
const BACK4APP_CONFIG = {
    applicationId: 'vRn25suEgknHSSZSALpSXXWd0I2EPcIFGBPBFODW',
    clientKey: 'LqOiHAzL4RKpxhKyNteLinw957Bf51MWOM6BJoxo', 
    javascriptKey: 'UxlCa92gr2i1hDu8pBuJMeuanXbhDpVjTMvMzTl9',
    serverURL: 'https://parseapi.back4app.com/'
};

// Inicializar Back4App
if (typeof Parse !== 'undefined') {
    Parse.initialize(BACK4APP_CONFIG.applicationId, BACK4APP_CONFIG.javascriptKey);
    Parse.serverURL = BACK4APP_CONFIG.serverURL;
    console.log('✅ Back4App configurado correctamente');
}

// =============================================
// ESTADO COMPARTIDO GLOBAL
// =============================================
window.appState = {
    products: [],
    settings: {},
    cart: [],
    currentCategory: 'all',
    searchTerm: '',
    sortBy: 'name'
};

// =============================================
// FUNCIONES BACK4APP - MEJORADAS
// =============================================

// Verificar conexión con Back4App
async function checkBack4AppConnection() {
    try {
        const Test = Parse.Object.extend('Test');
        const query = new Parse.Query(Test);
        await query.first();
        return true;
    } catch (error) {
        console.log('ℹ️ Back4App no configurado o primera vez');
        return false;
    }
}

// Crear clase Product si no existe
async function ensureProductClass() {
    try {
        // Intentar crear un producto de prueba
        const Product = Parse.Object.extend('Product');
        const testProduct = new Product();
        
        testProduct.set('name', 'Producto de Prueba');
        testProduct.set('price', 9.99);
        testProduct.set('category', 'Prueba');
        testProduct.set('stock', 10);
        testProduct.set('description', 'Producto de prueba inicial');
        testProduct.set('imageUrl', '');
        testProduct.set('isActive', true);
        
        await testProduct.save();
        await testProduct.destroy(); // Eliminar el de prueba
        
        console.log('✅ Clase Product configurada en Back4App');
        return true;
    } catch (error) {
        console.log('✅ Clase Product ya existe en Back4App');
        return true;
    }
}

// Cargar productos desde Back4App
async function loadProductsFromBack4App() {
    try {
        const Product = Parse.Object.extend('Product');
        const query = new Parse.Query(Product);
        query.equalTo('isActive', true);
        query.ascending('createdAt');
        
        const results = await query.find();
        const products = results.map(product => ({
            id: product.id,
            name: product.get('name'),
            price: product.get('price'),
            category: product.get('category'),
            stock: product.get('stock'),
            description: product.get('description'),
            imageUrl: product.get('imageUrl'),
            createdAt: product.get('createdAt')
        }));
        
        // Actualizar estado global
        window.appState.products = products;
        
        // Guardar en cache local
        localStorage.setItem('products_cache', JSON.stringify(products));
        
        console.log(`✅ ${products.length} productos cargados desde Back4App`);
        return products;
        
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        
        // Fallback: intentar cargar desde cache
        try {
            const cached = localStorage.getItem('products_cache');
            if (cached) {
                window.appState.products = JSON.parse(cached);
                console.log('📦 Productos cargados desde cache');
                return window.appState.products;
            }
        } catch (cacheError) {
            console.error('Error cargando cache:', cacheError);
        }
        
        window.appState.products = [];
        return [];
    }
}

// Guardar producto en Back4App
async function saveProductToBack4App(productData, isEditing = false) {
    try {
        const Product = Parse.Object.extend('Product');
        let product;
        
        if (isEditing && productData.id) {
            // Actualizar producto existente
            const query = new Parse.Query(Product);
            product = await query.get(productData.id);
        } else {
            // Crear nuevo producto
            product = new Product();
        }
        
        // Establecer propiedades
        product.set('name', productData.name);
        product.set('price', parseFloat(productData.price));
        product.set('category', productData.category);
        product.set('stock', parseInt(productData.stock) || 0);
        product.set('description', productData.description || '');
        product.set('imageUrl', productData.imageUrl || '');
        product.set('isActive', true);
        
        const result = await product.save();
        
        // Recargar productos después de guardar
        await loadProductsFromBack4App();
        
        console.log('✅ Producto guardado en Back4App:', result.id);
        return result;
        
    } catch (error) {
        console.error('❌ Error guardando producto:', error);
        throw new Error(`No se pudo guardar el producto: ${error.message}`);
    }
}

// Eliminar producto de Back4App
async function deleteProductFromBack4App(productId) {
    try {
        const Product = Parse.Object.extend('Product');
        const query = new Parse.Query(Product);
        const product = await query.get(productId);
        
        // Soft delete - marcar como inactivo
        product.set('isActive', false);
        await product.save();
        
        // Recargar productos después de eliminar
        await loadProductsFromBack4App();
        
        console.log('✅ Producto eliminado de Back4App:', productId);
        return true;
    } catch (error) {
        console.error('❌ Error eliminando producto:', error);
        throw new Error(`No se pudo eliminar el producto: ${error.message}`);
    }
}

// =============================================
// SISTEMA DE SINCRONIZACIÓN EN TIEMPO REAL
// =============================================

// Emitir evento cuando los productos cambian
function emitProductsUpdate() {
    console.log('🔄 Emitiendo actualización de productos...');
    
    // 1. BroadcastChannel para comunicación entre pestañas
    if (typeof BroadcastChannel !== 'undefined') {
        try {
            const channel = new BroadcastChannel('tienda_updates');
            channel.postMessage({
                type: 'PRODUCTS_UPDATED',
                timestamp: Date.now(),
                source: 'admin'
            });
        } catch (error) {
            console.log('BroadcastChannel no disponible');
        }
    }
    
    // 2. localStorage como fallback
    localStorage.setItem('last_products_update', Date.now().toString());
    
    // 3. Evento personalizado para la misma página
    window.dispatchEvent(new CustomEvent('productsShouldReload'));
}

// Escuchar actualizaciones
function setupUpdateListener() {
    console.log('👂 Configurando listeners de actualización...');
    
    // 1. BroadcastChannel entre pestañas
    if (typeof BroadcastChannel !== 'undefined') {
        try {
            const channel = new BroadcastChannel('tienda_updates');
            channel.addEventListener('message', (event) => {
                if (event.data.type === 'PRODUCTS_UPDATED') {
                    console.log('🔄 Productos actualizados desde otra pestaña');
                    showUpdateNotification();
                    loadProductsFromBack4App().then(() => {
                        if (window.renderProducts) window.renderProducts();
                        if (window.renderAdminProducts) window.renderAdminProducts();
                    });
                }
            });
        } catch (error) {
            console.log('BroadcastChannel no disponible');
        }
    }
    
    // 2. localStorage como fallback
    window.addEventListener('storage', (event) => {
        if (event.key === 'last_products_update') {
            console.log('🔄 Productos actualizados (localStorage)');
            showUpdateNotification();
            loadProductsFromBack4App().then(() => {
                if (window.renderProducts) window.renderProducts();
                if (window.renderAdminProducts) window.renderAdminProducts();
            });
        }
    });
    
    // 3. Evento personalizado
    window.addEventListener('productsShouldReload', () => {
        console.log('🔄 Recargando productos (evento interno)');
        loadProductsFromBack4App().then(() => {
            if (window.renderProducts) window.renderProducts();
            if (window.renderAdminProducts) window.renderAdminProducts();
        });
    });
}

// Mostrar notificación de actualización
function showUpdateNotification() {
    // Crear notificación si no existe
    let notification = document.getElementById('update-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'update-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-color, #25D366);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        document.body.appendChild(notification);
    }
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-sync-alt"></i>
            <span>Productos actualizados</span>
        </div>
    `;
    
    // Mostrar
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
    }, 3000);
}

// =============================================
// FUNCIONES PARA LA PÁGINA PRINCIPAL (index.html)
// =============================================

// Cargar y mostrar productos en la página principal
async function loadAndRenderProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    try {
        showLoadingState();
        await loadProductsFromBack4App();
        renderProducts();
    } catch (error) {
        showErrorState(error);
    }
}

function renderProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    let html = '';
    
    if (window.appState.products.length === 0) {
        html = `
            <div style="text-align: center; padding: 3rem; grid-column: 1 / -1;">
                <i class="fas fa-box-open" style="font-size: 4rem; color: #ddd; margin-bottom: 1rem;"></i>
                <p style="color: #666; font-size: 1.2rem;">No hay productos disponibles</p>
                <p style="color: #999; margin-top: 0.5rem;">Agrega productos desde el panel de administración</p>
                <a href="admin.html" class="btn btn-whatsapp" style="margin-top: 1rem;">
                    <i class="fas fa-cog"></i> Ir al Panel Admin
                </a>
            </div>
        `;
    } else {
        window.appState.products.forEach(product => {
            const imageContent = product.imageUrl && product.imageUrl.startsWith('http') 
                ? `<img src="${product.imageUrl}" alt="${product.name}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`
                : `<i class="fas fa-box" style="color: #666; font-size: 3rem;"></i>`;
            
            const stockBadge = product.stock < 5 ? `<span style="position:absolute; top:10px; left:10px; background:#ffa726; color:white; padding:0.25rem 0.75rem; border-radius:4px; font-size:0.8rem; font-weight:600;">¡Últimas ${product.stock}!</span>` : '';
            const outOfStock = product.stock === 0 ? 'out-of-stock' : '';
            
            html += `
                <div class="product-card ${outOfStock}" style="position: relative;">
                    ${stockBadge}
                    <div class="product-image">
                        ${imageContent}
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <p class="product-price">$${product.price.toFixed(2)}</p>
                        <p style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">
                            ${product.category} • Stock: ${product.stock}
                        </p>
                        <p style="color: #888; font-size: 0.8rem; margin-bottom: 1rem;">
                            ${product.description || 'Sin descripción'}
                        </p>
                        <button class="btn btn-whatsapp btn-full" onclick="addToCart('${product.id}')" ${product.stock === 0 ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus"></i>
                            ${product.stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                        </button>
                    </div>
                </div>
            `;
        });
    }
    
    productsGrid.innerHTML = html;
    hideLoadingState();
}

function showLoadingState() {
    const productsGrid = document.getElementById('products-grid');
    const loadingElement = document.getElementById('loading-products');
    
    if (loadingElement) loadingElement.style.display = 'block';
    if (productsGrid) productsGrid.style.display = 'none';
}

function hideLoadingState() {
    const productsGrid = document.getElementById('products-grid');
    const loadingElement = document.getElementById('loading-products');
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (productsGrid) productsGrid.style.display = 'grid';
}

function showErrorState(error) {
    const productsGrid = document.getElementById('products-grid');
    const loadingElement = document.getElementById('loading-products');
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div style="text-align: center; padding: 3rem; grid-column: 1 / -1;">
                <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #dc3545; margin-bottom: 1rem;"></i>
                <p style="color: #666; font-size: 1.2rem;">Error al cargar productos</p>
                <p style="color: #999; font-size: 0.9rem; margin-bottom: 1rem;">${error?.message || 'Error de conexión'}</p>
                <button class="btn btn-whatsapp" onclick="loadAndRenderProducts()" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
        productsGrid.style.display = 'grid';
    }
}

// =============================================
// INICIALIZACIÓN PÁGINA PRINCIPAL
// =============================================
function initMainPage() {
    console.log('🛍️ Inicializando página principal...');
    setupUpdateListener();
    loadAndRenderProducts();
    
    // Cargar carrito si existe la función
    if (window.loadCartFromStorage) window.loadCartFromStorage();
    if (window.updateCartUI) window.updateCartUI();
    if (window.setupEventListeners) window.setupEventListeners();
}

// =============================================
// FUNCIONES PARA EL PANEL ADMIN (admin.html)
// =============================================

// Cargar productos en el admin
async function loadAdminProducts() {
    try {
        await loadProductsFromBack4App();
        renderAdminProducts();
        updateAdminStats();
    } catch (error) {
        showAdminAlert('Error al cargar productos: ' + error.message, 'error');
    }
}

function renderAdminProducts() {
    const productsGridAdmin = document.getElementById('products-grid-admin');
    if (!productsGridAdmin) return;
    
    let html = '';
    
    if (window.appState.products.length === 0) {
        html = `
            <div style="text-align: center; padding: 3rem; color: #666; grid-column: 1 / -1;">
                <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>No hay productos registrados</p>
                <button class="btn btn-whatsapp" onclick="showProductForm()">
                    <i class="fas fa-plus"></i> Agregar Primer Producto
                </button>
            </div>
        `;
    } else {
        window.appState.products.forEach(product => {
            const imageContent = product.imageUrl && product.imageUrl.startsWith('http') 
                ? `<img src="${product.imageUrl}" alt="${product.name}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`
                : `<i class="fas fa-box"></i>`;
            
            html += `
                <div class="product-card-admin">
                    <div class="product-image-admin">
                        ${imageContent}
                    </div>
                    <h4>${product.name}</h4>
                    <p style="color: var(--primary-color); font-weight: bold; font-size: 1.2rem;">
                        $${product.price.toFixed(2)}
                    </p>
                    <p style="color: #666; font-size: 0.9rem; margin-bottom: 0.5rem;">
                        ${product.category} • Stock: ${product.stock}
                    </p>
                    <p style="color: #888; font-size: 0.8rem;">
                        ${product.description || 'Sin descripción'}
                    </p>
                    <div class="product-actions-admin">
                        <button class="btn-sm btn-edit" onclick="editProduct('${product.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-sm btn-delete" onclick="deleteProduct('${product.id}')">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
        });
    }
    
    productsGridAdmin.innerHTML = html;
}

function updateAdminStats() {
    const totalProducts = document.getElementById('total-products');
    const productCount = document.getElementById('product-count');
    const totalRevenue = document.getElementById('total-revenue');
    
    if (totalProducts) totalProducts.textContent = window.appState.products.length;
    if (productCount) productCount.textContent = window.appState.products.length;
    
    if (totalRevenue) {
        const revenue = window.appState.products.reduce((sum, product) => sum + (product.price * product.stock), 0);
        totalRevenue.textContent = `$${revenue.toFixed(2)}`;
    }
}

// Función para guardar producto desde admin
async function saveProductFromAdmin(productData, isEditing = false) {
    try {
        await saveProductToBack4App(productData, isEditing);
        
        // EMITIR ACTUALIZACIÓN PARA TODAS LAS PÁGINAS
        emitProductsUpdate();
        
        showAdminAlert('✅ Producto guardado correctamente', 'success');
        return true;
    } catch (error) {
        showAdminAlert('❌ Error al guardar producto: ' + error.message, 'error');
        return false;
    }
}

// Función para eliminar producto desde admin
async function deleteProductFromAdmin(productId) {
    try {
        await deleteProductFromBack4App(productId);
        
        // EMITIR ACTUALIZACIÓN PARA TODAS LAS PÁGINAS
        emitProductsUpdate();
        
        showAdminAlert('✅ Producto eliminado correctamente', 'success');
        return true;
    } catch (error) {
        showAdminAlert('❌ Error al eliminar producto: ' + error.message, 'error');
        return false;
    }
}

function showAdminAlert(message, type) {
    const alertElement = document.getElementById('alert');
    if (alertElement) {
        alertElement.textContent = message;
        alertElement.className = `alert ${type}`;
        alertElement.style.display = 'block';
        
        setTimeout(() => {
            alertElement.style.display = 'none';
        }, 4000);
    }
}

// =============================================
// INICIALIZACIÓN AUTOMÁTICA
// =============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Inicializando aplicación...');
    
    // Configurar Back4App
    await ensureProductClass();
    
    // Configurar listeners de actualización
    setupUpdateListener();
    
    // Inicializar página específica
    if (document.getElementById('products-grid')) {
        initMainPage();
    } else if (document.getElementById('admin-panel')) {
        initAdminPage();
    }
    
    console.log('✅ Aplicación inicializada correctamente');
});

// Hacer funciones disponibles globalmente
window.loadProductsFromBack4App = loadProductsFromBack4App;
window.saveProductToBack4App = saveProductToBack4App;
window.deleteProductFromBack4App = deleteProductFromBack4App;
window.saveProductFromAdmin = saveProductFromAdmin;
window.deleteProductFromAdmin = deleteProductFromAdmin;
window.emitProductsUpdate = emitProductsUpdate;