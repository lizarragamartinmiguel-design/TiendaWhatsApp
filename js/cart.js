// =============================================
// FUNCIONES DEL CARRITO DE COMPRAS
// =============================================

// Cargar carrito desde localStorage
function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem('whatsapp_cart');
        if (savedCart) {
            window.appState.cart = JSON.parse(savedCart);
        }
    } catch (error) {
        console.error('Error cargando carrito:', error);
        window.appState.cart = [];
    }
}

// Guardar carrito en localStorage
function saveCartToStorage() {
    try {
        localStorage.setItem('whatsapp_cart', JSON.stringify(window.appState.cart));
    } catch (error) {
        console.error('Error guardando carrito:', error);
    }
}

// Agregar producto al carrito
function addToCart(productId) {
    const product = window.appState.products.find(p => p.id === productId);
    
    if (!product) {
        showCartMessage('Producto no encontrado', 'error');
        return;
    }
    
    if (product.stock === 0) {
        showCartMessage('Producto sin stock disponible', 'error');
        return;
    }
    
    const existingItem = window.appState.cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            showCartMessage('No hay más stock disponible de este producto', 'error');
            return;
        }
        existingItem.quantity += 1;
    } else {
        window.appState.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            imageUrl: product.imageUrl
        });
    }
    
    saveCartToStorage();
    updateCartUI();
    showCartMessage('Producto agregado al carrito', 'success');
}

// Eliminar producto del carrito
function removeFromCart(productId) {
    window.appState.cart = window.appState.cart.filter(item => item.id !== productId);
    saveCartToStorage();
    updateCartUI();
    showCartMessage('Producto eliminado del carrito', 'success');
}

// Actualizar cantidad de producto en el carrito
function updateCartQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    const product = window.appState.products.find(p => p.id === productId);
    if (product && newQuantity > product.stock) {
        showCartMessage('No hay suficiente stock disponible', 'error');
        return;
    }
    
    const cartItem = window.appState.cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity = newQuantity;
        saveCartToStorage();
        updateCartUI();
    }
}

// Vaciar carrito
function clearCart() {
    if (window.appState.cart.length === 0) return;
    
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
        window.appState.cart = [];
        saveCartToStorage();
        updateCartUI();
        showCartMessage('Carrito vaciado', 'success');
    }
}

// Calcular total del carrito
function calculateCartTotal() {
    return window.appState.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Calcular cantidad total de items
function calculateTotalItems() {
    return window.appState.cart.reduce((total, item) => total + item.quantity, 0);
}

// Actualizar interfaz del carrito
function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const emptyCart = document.getElementById('empty-cart');
    const cartContent = document.getElementById('cart-content');
    
    // Actualizar contador del carrito
    if (cartCount) {
        const totalItems = calculateTotalItems();
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    
    // Actualizar lista de items del carrito
    if (cartItems && cartTotal && emptyCart && cartContent) {
        if (window.appState.cart.length === 0) {
            emptyCart.style.display = 'block';
            cartContent.style.display = 'none';
        } else {
            emptyCart.style.display = 'none';
            cartContent.style.display = 'block';
            
            let itemsHTML = '';
            window.appState.cart.forEach(item => {
                const imageContent = item.imageUrl && item.imageUrl.startsWith('http') 
                    ? `<img src="${item.imageUrl}" alt="${item.name}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">`
                    : `<i class="fas fa-box" style="color: #666;"></i>`;
                
                itemsHTML += `
                    <div class="cart-item" style="display: flex; align-items: center; padding: 1rem; border-bottom: 1px solid #eee;">
                        <div style="margin-right: 1rem;">
                            ${imageContent}
                        </div>
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem;">${item.name}</h4>
                            <p style="margin: 0; color: var(--primary-color); font-weight: bold;">
                                $${item.price.toFixed(2)}
                            </p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <button class="btn-quantity" onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})" style="background: #f8f9fa; border: 1px solid #ddd; width: 30px; height: 30px; border-radius: 4px; display: flex; align-items: center; justify-content: center;">-</button>
                            <span style="min-width: 30px; text-align: center;">${item.quantity}</span>
                            <button class="btn-quantity" onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})" style="background: #f8f9fa; border: 1px solid #ddd; width: 30px; height: 30px; border-radius: 4px; display: flex; align-items: center; justify-content: center;">+</button>
                            <button class="btn-remove" onclick="removeFromCart('${item.id}')" style="background: none; border: none; color: #dc3545; margin-left: 1rem; cursor: pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            cartItems.innerHTML = itemsHTML;
            cartTotal.textContent = `$${calculateCartTotal().toFixed(2)}`;
        }
    }
}

// Mostrar mensaje del carrito
function showCartMessage(message, type) {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Enviar pedido por WhatsApp
function sendOrderViaWhatsApp() {
    if (window.appState.cart.length === 0) {
        showCartMessage('El carrito está vacío', 'error');
        return;
    }
    
    const settings = window.appState.settings;
    const phoneNumber = settings.whatsappNumber || '5491112345678';
    
    if (!phoneNumber) {
        showCartMessage('No hay número de WhatsApp configurado', 'error');
        return;
    }
    
    // Construir mensaje del pedido
    let message = settings.whatsappOrder || 'Pedido recibido!\\n\\n';
    
    // Reemplazar variables en el mensaje
    const productsText = window.appState.cart.map(item => 
        `• ${item.name} - $${item.price.toFixed(2)} x ${item.quantity}`
    ).join('\\n');
    
    const total = calculateCartTotal();
    
    message = message
        .replace(/{productos}/g, productsText)
        .replace(/{total}/g, total.toFixed(2))
        .replace(/{cliente}/g, 'Cliente');
    
    // Agregar detalles del pedido si no hay plantilla
    if (!settings.whatsappOrder) {
        message += `Productos:\\n${productsText}\\n\\nTotal: $${total.toFixed(2)}`;
    }
    
    // Codificar mensaje para URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Opcional: limpiar carrito después de enviar
    // window.appState.cart = [];
    // saveCartToStorage();
    // updateCartUI();
}

// Configurar event listeners del carrito
function setupCartEventListeners() {
    const cartToggle = document.getElementById('cart-toggle');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartClose = document.getElementById('cart-close');
    const clearCartBtn = document.getElementById('clear-cart');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (cartToggle && cartSidebar) {
        cartToggle.addEventListener('click', () => {
            cartSidebar.classList.add('active');
        });
    }
    
    if (cartClose) {
        cartClose.addEventListener('click', () => {
            cartSidebar.classList.remove('active');
        });
    }
    
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', sendOrderViaWhatsApp);
    }
}

// Hacer funciones disponibles globalmente
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.clearCart = clearCart;
window.sendOrderViaWhatsApp = sendOrderViaWhatsApp;
window.loadCartFromStorage = loadCartFromStorage;
window.updateCartUI = updateCartUI;
window.setupCartEventListeners = setupCartEventListeners;