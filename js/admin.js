// =============================================
// CONFIGURACIÓN BACK4APP
// =============================================
const BACK4APP_CONFIG = {
    applicationId: 'TU_APPLICATION_ID_BACK4APP',
    clientKey: 'TU_CLIENT_KEY_BACK4APP', 
    serverURL: 'https://parseapi.back4app.com/'
};

// Inicializar Back4App
if (typeof Parse !== 'undefined') {
    Parse.initialize(BACK4APP_CONFIG.applicationId, BACK4APP_CONFIG.clientKey);
    Parse.serverURL = BACK4APP_CONFIG.serverURL;
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
// FUNCIONES BACK4APP - COMPARTIDAS
// =============================================

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
        
        // Emitir evento de productos actualizados
        window.dispatchEvent(new CustomEvent('productsUpdated', { 
            detail: { products } 
        }));
        
        return products;
        
    } catch (error) {
        console.error('Error al cargar productos desde Back4App:', error);
        return [];
    }
}

// Guardar producto en Back4App
async function saveProductToBack4App(productData, isEditing = false) {
    try {
        const Product = Parse.Object.extend('Product');
        let product;
        
        if (isEditing && productData.id) {
            const query = new Parse.Query(Product);
            product = await query.get(productData.id);
        } else {
            product = new Product();
        }
        
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
        
        return result;
        
    } catch (error) {
        console.error('Error al guardar producto en Back4App:', error);
        throw error;
    }
}

// Eliminar producto de Back4App
async function deleteProductFromBack4App(productId) {
    try {
        const Product = Parse.Object.extend('Product');
        const query = new Parse.Query(Product);
        const product = await query.get(productId);
        
        product.set('isActive', false);
        await product.save();
        
        // Recargar productos después de eliminar
        await loadProductsFromBack4App();
        
        return true;
    } catch (error) {
        console.error('Error al eliminar producto de Back4App:', error);
        throw error;
    }
}

// =============================================
// SISTEMA DE NOTIFICACIONES ENTRE PÁGINAS
// =============================================

// Emitir evento cuando los productos cambian
function emitProductsUpdate() {
    if (typeof BroadcastChannel !== 'undefined') {
        // Usar BroadcastChannel para comunicación entre pestañas
        const channel = new BroadcastChannel('tienda_updates');
        channel.postMessage({
            type: 'PRODUCTS_UPDATED',
            timestamp: Date.now()
        });
    }
    
    // También usar localStorage como fallback
    localStorage.setItem('lastProductsUpdate', Date.now().toString());
    
    // Y evento personalizado para la misma página
    window.dispatchEvent(new CustomEvent('productsShouldUpdate'));
}

// Escuchar actualizaciones
function setupUpdateListener() {
    // BroadcastChannel entre pestañas
    if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('tienda_updates');
        channel.addEventListener('message', (event) => {
            if (event.data.type === 'PRODUCTS_UPDATED') {
                console.log('🔄 Productos actualizados desde otra pestaña');
                loadProductsFromBack4App();
            }
        });
    }
    
    // localStorage como fallback
    window.addEventListener('storage', (event) => {
        if (event.key === 'lastProductsUpdate') {
            console.log('🔄 Productos actualizados (localStorage)');
            loadProductsFromBack4App();
        }
    });
    
    // Evento personalizado
    window.addEventListener('productsShouldUpdate', () => {
        console.log('🔄 Productos actualizados (evento)');
        loadProductsFromBack4App();
    });
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
        showErrorState();
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
            </div>
        `;
    } else {
        window.appState.products.forEach(product => {
            const imageContent = product.imageUrl && product.imageUrl.startsWith('http') 
                ? `<img src="${product.imageUrl}" alt="${product.name}" style="width:100%; height:100%; object-fit:cover;">`
                : `<i class="fas fa-box" style="color: #666;"></i>`;
            
            const stockBadge = product.stock < 5 ? `<span class="stock-badge low-stock">¡Últimas ${product.stock}!</span>` : '';
            const outOfStock = product.stock === 0 ? 'out-of-stock' : '';
            
            html += `
                <div class="product-card ${outOfStock}">
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
    
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
    if (productsGrid) {
        productsGrid.style.display = 'none';
    }
}

function hideLoadingState() {
    const productsGrid = document.getElementById('products-grid');
    const loadingElement = document.getElementById('loading-products');
    
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    if (productsGrid) {
        productsGrid.style.display = 'grid';
    }
}

function showErrorState() {
    const productsGrid = document.getElementById('products-grid');
    const loadingElement = document.getElementById('loading-products');
    
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div style="text-align: center; padding: 3rem; grid-column: 1 / -1;">
                <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #dc3545; margin-bottom: 1rem;"></i>
                <p style="color: #666; font-size: 1.2rem;">Error al cargar productos</p>
                <button class="btn btn-whatsapp" onclick="loadAndRenderProducts()" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i>
                    Reintentar
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
    loadCartFromStorage();
    updateCartUI();
    setupEventListeners();
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
                ? `<img src="${product.imageUrl}" alt="${product.name}">`
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

// Función para guardar producto desde admin (ACTUALIZADA)
async function saveProductFromAdmin(productData, isEditing = false) {
    try {
        await saveProductToBack4App(productData, isEditing);
        
        // EMITIR ACTUALIZACIÓN PARA TODAS LAS PÁGINAS
        emitProductsUpdate();
        
        showAdminAlert('Producto guardado correctamente', 'success');
        return true;
    } catch (error) {
        showAdminAlert('Error al guardar producto: ' + error.message, 'error');
        return false;
    }
}

// Función para eliminar producto desde admin (ACTUALIZADA)
async function deleteProductFromAdmin(productId) {
    try {
        await deleteProductFromBack4App(productId);
        
        // EMITIR ACTUALIZACIÓN PARA TODAS LAS PÁGINAS
        emitProductsUpdate();
        
        showAdminAlert('Producto eliminado correctamente', 'success');
        return true;
    } catch (error) {
        showAdminAlert('Error al eliminar producto: ' + error.message, 'error');
        return false;
    }
}

function showAdminAlert(message, type) {
    // Implementación específica del admin
    const alertElement = document.getElementById('alert');
    if (alertElement) {
        alertElement.textContent = message;
        alertElement.className = `alert ${type}`;
        alertElement.style.display = 'block';
        
        setTimeout(() => {
            alertElement.style.display = 'none';
        }, 3000);
    } else {
        console.log(`Admin ${type}:`, message);
    }
}

// =============================================
// INICIALIZACIÓN PANEL ADMIN
// =============================================
function initAdminPage() {
    console.log('🔐 Inicializando panel admin...');
    setupUpdateListener();
    loadAdminProducts();
    loadAdminSettings();
    setupAdminEventListeners();
}

// =============================================
// DETECCIÓN AUTOMÁTICA DE PÁGINA
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('products-grid')) {
        // Estamos en la página principal
        initMainPage();
    } else if (document.getElementById('admin-panel')) {
        // Estamos en el panel admin
        initAdminPage();
    }
    
    // Configuración global
    setupUpdateListener();
});