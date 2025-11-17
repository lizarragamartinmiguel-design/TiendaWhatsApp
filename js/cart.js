// Funciones del carrito
function addToCart(productId) {
    const product = appState.products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = appState.cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            alert('No hay suficiente stock disponible');
            return;
        }
    } else {
        appState.cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCart();
    showCartNotification('Producto agregado al carrito');
}

function removeFromCart(productId) {
    appState.cart = appState.cart.filter(item => item.id !== productId);
    updateCart();
}

function updateQuantity(productId, change) {
    const item = appState.cart.find(item => item.id === productId);
    if (!item) return;
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    const product = appState.products.find(p => p.id === productId);
    if (newQuantity > product.stock) {
        alert('No hay suficiente stock disponible');
        return;
    }
    
    item.quantity = newQuantity;
    updateCart();
}

function updateCart() {
    // Actualizar contador del carrito
    const totalItems = appState.cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelector('.cart-count').textContent = totalItems;
    
    // Actualizar sidebar del carrito
    renderCartItems();
    
    // Guardar en localStorage
    localStorage.setItem('cart', JSON.stringify(appState.cart));
}

function renderCartItems() {
    let html = '';
    let total = 0;
    
    if (appState.cart.length === 0) {
        html = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>Tu carrito está vacío</p>
            </div>
        `;
    } else {
        appState.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const imageContent = item.imageUrl && item.imageUrl.startsWith('http') 
                ? `<img src="${item.imageUrl}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">`
                : `<i class="fas fa-box" style="color: #666;"></i>`;
            
            html += `
                <div class="cart-item">
                    <div class="cart-item-image">
                        ${imageContent}
                    </div>
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>$${item.price.toFixed(2)} c/u</p>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button style="margin-left: auto; color: #dc3545; background: none; border: none; cursor: pointer;" onclick="removeFromCart('${item.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    elements.cartItems.innerHTML = html;
    elements.cartTotal.textContent = total.toFixed(2);
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

function checkoutWhatsApp() {
    if (appState.cart.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }
    
    const phone = appState.settings.whatsappNumber || '5491112345678';
    const businessName = appState.settings.businessName || 'Tienda';
    
    let message = `¡Hola! Me interesan los siguientes productos:\n\n`;
    
    appState.cart.forEach(item => {
        message += `• ${item.name} - $${item.price.toFixed(2)} x ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}\n`;
    });
    
    const total = appState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    message += `\n*Total: $${total.toFixed(2)}*`;
    
    if (appState.settings.whatsappOrder) {
        const orderMessage = appState.settings.whatsappOrder
            .replace('{productos}', appState.cart.map(item => `${item.name} x${item.quantity}`).join(', '))
            .replace('{total}', total.toFixed(2));
        message = orderMessage;
    }
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    closeCart();
}

function showCartNotification(message) {
    // Implementar notificación toast
    console.log('📦', message);
}

// Cargar carrito desde localStorage al iniciar
function loadCart() {
    const saved = localStorage.getItem('cart');
    if (saved) {
        appState.cart = JSON.parse(saved);
        updateCart();
    }
}

// Inicializar carrito
document.addEventListener('DOMContentLoaded', loadCart);