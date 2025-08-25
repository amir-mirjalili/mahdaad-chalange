package main

import (
	"context"
	"fmt"
	"log"
	"process-order/internal/domain/saga"
	"process-order/internal/infrastructure/models"
	"process-order/internal/services/inventory"
	"process-order/internal/services/order"
	"process-order/internal/services/payment"
	"time"
)

func main() {
	eventBus := saga.NewInMemoryEventBus()
	ctx := context.Background()

	if err := eventBus.Start(ctx); err != nil {
		log.Fatalf("Failed to start event bus: %v", err)
	}
	defer eventBus.Stop()

	order.NewOrderService(eventBus)
	inventory.NewInventoryService(eventBus)
	payment.NewPaymentService(eventBus)

	sagaOrchestrator := saga.NewOrderProcessingSaga(eventBus)

	eventBus.Subscribe(models.SagaCompletedEvent, func(ctx context.Context, event *models.Event) error {
		log.Printf("🎉 SAGA COMPLETED: %s", event.SagaID)
		return nil
	})

	eventBus.Subscribe(models.SagaFailedEvent, func(ctx context.Context, event *models.Event) error {
		log.Printf("💥 SAGA FAILED: %s", event.SagaID)
		return nil
	})

	time.Sleep(100 * time.Millisecond)

	fmt.Println("=== Order Processing Saga Demo ===")

	// ========== SCENARIO 1: SUCCESSFUL ORDER ==========
	fmt.Println("🟢 SCENARIO 1: Successful Order Processing")

	successOrder := &models.Order{
		OrderID:    "order_001",
		CustomerID: "customer_123",
		ProductID:  "prod_123",
		Quantity:   2,
		Amount:     299.99,
	}

	if err := sagaOrchestrator.StartOrderProcessing(ctx, successOrder); err != nil {
		log.Printf("Failed to start saga: %v", err)
	}

	time.Sleep(2 * time.Second)

	fmt.Println("🔴 SCENARIO 2: Payment Failure (Amount > $1000)")

	failedOrder := &models.Order{
		OrderID:    "order_002",
		CustomerID: "customer_456",
		ProductID:  "prod_123",
		Quantity:   1,
		Amount:     1500.00,
	}

	if err := sagaOrchestrator.StartOrderProcessing(ctx, failedOrder); err != nil {
		log.Printf("Failed to start saga: %v", err)
	}

	time.Sleep(3 * time.Second)

	fmt.Println("🟠 SCENARIO 3: Insufficient Inventory")

	inventoryFailOrder := &models.Order{
		OrderID:    "order_003",
		CustomerID: "customer_789",
		ProductID:  "prod_456",
		Quantity:   100, // Only 50 available
		Amount:     500.00,
	}

	if err := sagaOrchestrator.StartOrderProcessing(ctx, inventoryFailOrder); err != nil {
		log.Printf("Failed to start saga: %v", err)
	}

	time.Sleep(2 * time.Second)

}
