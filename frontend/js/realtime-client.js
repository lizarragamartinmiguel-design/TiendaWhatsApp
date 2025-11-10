// frontend/js/realtime-client.js
class RealtimeClient {
    constructor() {
        this.ws = null;
        this.deviceId = null;
        this.isConnected = false;
        this.reconnectInterval = null;
    }

    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        console.log('🔗 Conectando a:', wsUrl);
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('✅ Conectado al servidor en tiempo real');
            this.isConnected = true;
            this.updateConnectionStatus(true);
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
        };

        this.ws.onclose = () => {
            console.log('🔌 Conexión cerrada, reconectando...');
            this.isConnected = false;
            this.updateConnectionStatus(false);
            this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('❌ Error de conexión:', error);
            this.isConnected = false;
            this.updateConnectionStatus(false);
        };
    }

    scheduleReconnect() {
        if (!this.reconnectInterval) {
            this.reconnectInterval = setTimeout(() => {
                this.reconnectInterval = null;
                this.connect();
            }, 3000);
        }
    }

    handleMessage(message) {
        console.log('📨 Mensaje recibido:', message);
        
        switch(message.type) {
            case 'CONNECTED':
                this.deviceId = message.deviceId;
                this.showNotification('Conectado en tiempo real', 'success');
                break;
                
            case 'PRODUCT_UPDATED':
                this.updateProductInUI(message.product);
                this.showNotification(`Producto actualizado: ${message.product.nombre}`, 'info');
                break;
                
            case 'ORDER_CREATED':
                this.addOrderToUI(message.order);
                this.showNotification(`Nuevo pedido #${message.order.id} recibido`, 'success');
                break;
                
            case 'STOCK_UPDATED':
                this.updateStockInUI(message.productId, message.newStock);
                this.showNotification(`Stock actualizado`, 'info');
                break;
                
            case 'DEVICE_COUNT':
                this.updateDeviceCount(message.count);
                break;
        }
    }

    updateProductInUI(product) {
        // Buscar y actualizar producto en la UI
        const productElements = document.querySelectorAll('[data-product-id]');
        productElements.forEach(element => {
            if (element.getAttribute('data-product-id') == product.id) {
                // Actualizar información del producto
                const stockElement = element.querySelector('.stock, [data-stock]');
                if (stockElement) stockElement.textContent = product.stock;
                
                const priceElement = element.querySelector('.price, [data-price]');
                if (priceElement) priceElement.textContent = `$${product.precio}`;
                
                const nameElement = element.querySelector('.product-name, [data-name]');
                if (nameElement) nameElement.textContent = product.nombre;
                
                // Efecto visual
                element.style.backgroundColor = '#e8f5e8';
                setTimeout(() => element.style.backgroundColor = '', 1000);
            }
        });
    }

    updateStockInUI(productId, newStock) {
        // Actualizar solo el stock
        const stockElements = document.querySelectorAll(`[data-product-id="${productId}"] .stock, [data-stock="${productId}"]`);
        stockElements.forEach(element => {
            element.textContent = newStock;
            element.classList.add('stock-updated');
            setTimeout(() => element.classList.remove('stock-updated'), 1000);
        });
    }

    addOrderToUI(order) {
        // Agregar pedido a la lista si existe
        const ordersList = document.getElementById('orders-list');
        if (ordersList) {
            const orderElement = document.createElement('div');
            orderElement.className = 'order-item new-order';
            orderElement.innerHTML = `
                <strong>Pedido #${order.id}</strong> - $${order.total} - ${order.estado}
                <small>${new Date().toLocaleTimeString()}</small>
            `;
            ordersList.insertBefore(orderElement, ordersList.firstChild);
            
            setTimeout(() => orderElement.classList.remove('new-order'), 2000);
        }
        
        // Actualizar contador de pedidos si existe
        const orderCount = document.getElementById('order-count');
        if (orderCount) {
            const currentCount = parseInt(orderCount.textContent) || 0;
            orderCount.textContent = currentCount + 1;
        }
    }

    updateDeviceCount(count) {
        const countElement = document.getElementById('device-count');
        if (countElement) {
            countElement.textContent = count;
        }
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = connected ? '🟢 Conectado' : '🔴 Desconectado';
            statusElement.className = connected ? 'status-connected' : 'status-disconnected';
        }
    }

    showNotification(message, type = 'info') {
        // Crear notificación toast simple
        const notification = document.createElement('div');
        notification.className = `realtime-notification realtime-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="margin-left: 10px; background: none; border: none; color: white; cursor: pointer;">×</button>
        `;
        
        // Estilos básicos
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 4px;
            color: white;
            z-index: 10000;
            max-width: 300px;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#4CAF50' : type === 'info' ? '#2196F3' : '#FF9800'};
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Inicializar automáticamente cuando se carga la página
const realtimeClient = new RealtimeClient();
document.addEventListener('DOMContentLoaded', () => {
    realtimeClient.connect();
});

window.realtimeClient = realtimeClient;