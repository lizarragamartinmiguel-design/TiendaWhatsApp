// =============================================
// CONFIGURACIÓN BACK4APP
// =============================================
const BACK4APP_CONFIG = {
    applicationId: 'vRn25suEgknHSSZSALpSXXWd0I2EPcIFGBPBFODW',
    javascriptKey: 'UxlCa92gr2i1hDu8pBuJMeuanXbhDpVjTMvMzTl9',
    serverURL: 'https://parseapi.back4app.com/'
};

// Inicializar Back4App
function initializeBack4App() {
    if (typeof Parse !== 'undefined') {
        try {
            Parse.initialize(
                BACK4APP_CONFIG.applicationId, 
                BACK4APP_CONFIG.javascriptKey
            );
            Parse.serverURL = BACK4APP_CONFIG.serverURL;
            console.log('✅ Back4App inicializado correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error inicializando Back4App:', error);
            showGlobalError('Error de conexión con la base de datos');
            return false;
        }
    }
    return false;
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
    sortBy: 'name',
    back4appInitialized: false
};

// =============================================
// FUNCIONES BACK4APP - MEJORADAS
// =============================================

// Cargar productos desde Back4App
async function loadProductsFromBack4App() {
    if (!window.appState.back4appInitialized) {
        if (!initializeBack4App()) {
            throw new Error('Back4App no está inicializado');
        }
        window.appState.back4appInitialized = true;
    }

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
        showGlobalError('Error cargando productos: ' + error.message);
        return [];
    }
}

// Guardar producto en Back4App
async function saveProductToBack4App(productData, isEditing = false) {
    if (!window.appState.back4appInitialized) {
        initializeBack4App();
    }

    try {
        const Product = Parse.Object.extend('Product');
        let product;
        
        if (isEditing && productData.id) {
            const query = new Parse.Query(Product);
            product = await query.get(productData.id);
        } else {
            product = new Product();
        }
        
        // Validar datos requeridos
        if (!productData.name || !productData.price || !productData.category) {
            throw new Error('Nombre, precio y categoría son requeridos');
        }
        
        product.set('name', productData.name.trim());
        product.set('price', parseFloat(productData.price));
        product.set('category', productData.category.trim());
        product.set('stock', parseInt(productData.stock) || 0);
        product.set('description', productData.description?.trim() || '');
        product.set('imageUrl', productData.imageUrl?.trim() || '');
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
    if (!window.appState.back4appInitialized) {
        initializeBack4App();
    }

    try {
        const Product = Parse.Object.extend('Product');
        const query = new Parse.Query(Product);
        const product = await query.get(productId);
        
        // Eliminación suave (recomendado)
        product.set('isActive', false);
        await product.save();
        
        // O eliminación permanente (descomenta si prefieres)
        // await product.destroy();
        
        // Recargar productos después de eliminar
        await loadProductsFromBack4App();
        
        return true;
    } catch (error) {
        console.error('Error al eliminar producto de Back4App:', error);
        throw error;
    }
}

// Función para mostrar errores globales
function showGlobalError(message) {
    // Crear notificación de error
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 10000;
        max-width: 300px;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        document.body.removeChild(errorDiv);
    }, 5000);
}

// =============================================
// INICIALIZACIÓN GLOBAL MEJORADA
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Back4App inmediatamente
    initializeBack4App();
    
    // Configurar listeners de actualización
    setupUpdateListener();
    
    // Detectar página y inicializar
    if (document.getElementById('products-grid')) {
        initMainPage();
    } else if (document.getElementById('admin-panel')) {
        initAdminPage();
    }
});