package order

import (
	"context"
	"log"
	"process-order/internal/domain/saga"
	"process-order/internal/infrastructure/models"
	"sync"
	"time"
)

type OrderService struct {
	eventBus saga.EventBus
	orders   map[string]*models.Order
	mu       sync.RWMutex
}

func NewOrderService(eventBus saga.EventBus) *OrderService {
	service := &OrderService{
		eventBus: eventBus,
		orders:   make(map[string]*models.Order),
	}

	eventBus.Subscribe(models.OrderCreateRequested, service.handleCreateOrder)

	return service
}

func (os *OrderService) handleCreateOrder(ctx context.Context, event *models.Event) error {
	log.Printf("🛒 OrderService: Creating order for saga %s", event.SagaID)

	// Simulate order creation process
	time.Sleep(100 * time.Millisecond)

	var orderData models.Order

	os.mu.Lock()
	os.orders[orderData.OrderID] = &orderData
	os.mu.Unlock()

	log.Printf("✅ OrderService: Order %s created successfully", orderData.OrderID)

	return os.publishOrderCompleted(ctx, event.SagaID)
}

func (os *OrderService) publishOrderCompleted(ctx context.Context, sagaID string) error {
	event := &models.Event{
		Type:      models.OrderCreateCompleted,
		SagaID:    sagaID,
		Timestamp: time.Now(),
		Source:    "order-service",
	}
	return os.eventBus.Publish(ctx, event)
}

func (os *OrderService) publishOrderFailed(ctx context.Context, sagaID string) error {
	event := &models.Event{
		ID:        "1",
		Type:      models.OrderCreateFailed,
		SagaID:    sagaID,
		Timestamp: time.Now(),
		Source:    "order-service",
	}
	return os.eventBus.Publish(ctx, event)
}
