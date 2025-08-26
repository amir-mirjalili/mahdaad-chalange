package inventory

import (
	"context"
	"fmt"
	"log"
	"process-order/internal/domain/saga"
	"process-order/internal/infrastructure/models"
	"sync"
	"time"
)

type Service struct {
	eventBus     saga.EventBus
	inventory    map[string]int
	reservations map[string]string
	mu           sync.RWMutex
}

func NewInventoryService(eventBus saga.EventBus) *Service {
	service := &Service{
		eventBus:     eventBus,
		inventory:    make(map[string]int),
		reservations: make(map[string]string),
	}

	service.inventory["prod_123"] = 100
	service.inventory["prod_456"] = 50

	eventBus.Subscribe(models.InventoryReserveRequested, service.handleReserveInventory)

	return service
}

func (is *Service) handleReserveInventory(ctx context.Context, event *models.Event) error {
	log.Printf("📦 InventoryService: Reserving inventory for saga %s", event.SagaID)

	var orderData models.Order

	time.Sleep(150 * time.Millisecond)

	is.mu.Lock()
	defer is.mu.Unlock()

	is.inventory[orderData.ProductID] -= orderData.Quantity
	reservationID := fmt.Sprintf("res_%s_%s", orderData.ProductID, orderData.OrderID)
	is.reservations[reservationID] = orderData.ProductID
	orderData.ReservationID = reservationID

	log.Printf("✅ InventoryService: Reserved %d units of product %s (Reservation: %s)",
		orderData.Quantity, orderData.ProductID, reservationID)

	return is.publishInventoryCompleted(ctx, event.SagaID)
}

func (is *Service) publishInventoryCompleted(ctx context.Context, sagaID string) error {
	event := &models.Event{
		ID:        "1",
		Type:      models.InventoryReserveCompleted,
		SagaID:    sagaID,
		Timestamp: time.Now(),
		Source:    "inventory-service",
	}
	return is.eventBus.Publish(ctx, event)
}
