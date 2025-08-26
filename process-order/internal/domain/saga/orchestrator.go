package saga

import (
	"context"
	"fmt"
	"log"
	"process-order/internal/infrastructure/models"
	"sync"
	"time"
)

type OrderProcessingSaga struct {
	eventBus      EventBus
	sagaInstances map[string]*models.Saga
	mu            sync.RWMutex
}

func NewOrderProcessingSaga(eventBus EventBus) *OrderProcessingSaga {
	saga := &OrderProcessingSaga{
		eventBus:      eventBus,
		sagaInstances: make(map[string]*models.Saga),
	}

	saga.subscribeToEvents()

	return saga
}

func (ops *OrderProcessingSaga) subscribeToEvents() {
	ops.eventBus.Subscribe(models.OrderCreateCompleted, ops.handleOrderCreated)
	ops.eventBus.Subscribe(models.PaymentProcessCompleted, ops.handlePaymentProcessed)

	ops.eventBus.Subscribe(models.OrderCreateFailed, ops.handleOrderFailed)
	ops.eventBus.Subscribe(models.InventoryReserveFailed, ops.handleInventoryFailed)
	ops.eventBus.Subscribe(models.PaymentProcessFailed, ops.handlePaymentFailed)

}

func (ops *OrderProcessingSaga) StartOrderProcessing(ctx context.Context, orderData *models.Order) error {
	sagaID := fmt.Sprintf("saga_%s", orderData.OrderID)

	ops.mu.Lock()
	ops.sagaInstances[sagaID] = &models.Saga{
		ID:             sagaID,
		Status:         models.SagaStarted,
		CurrentStep:    0,
		OrderData:      orderData,
		CompletedSteps: make([]string, 0),
		StartTime:      time.Now(),
	}
	ops.mu.Unlock()

	log.Printf("🚀 Starting order processing saga: %s", sagaID)

	return ops.requestOrderCreation(ctx, sagaID, orderData)
}

func (ops *OrderProcessingSaga) requestOrderCreation(ctx context.Context, sagaID string, orderData *models.Order) error {
	event := &models.Event{
		ID:        "1",
		Type:      models.OrderCreateRequested,
		SagaID:    sagaID,
		Timestamp: time.Now(),
		Source:    "saga-orchestrator",
	}

	log.Printf("🛒 Saga %s: Requesting order creation", sagaID)
	return ops.eventBus.Publish(ctx, event)
}

func (ops *OrderProcessingSaga) handleOrderCreated(ctx context.Context, event *models.Event) error {
	ops.mu.Lock()
	instance, exists := ops.sagaInstances[event.SagaID]
	if !exists {
		ops.mu.Unlock()
		return fmt.Errorf("saga instance %s not found", event.SagaID)
	}

	instance.CompletedSteps = append(instance.CompletedSteps, "order_created")
	instance.CurrentStep = 1
	ops.mu.Unlock()

	log.Printf("✅ Saga %s: Order created, proceeding to inventory reservation", event.SagaID)

	return ops.requestInventoryReservation(ctx, event)
}

func (ops *OrderProcessingSaga) requestInventoryReservation(ctx context.Context, event *models.Event) error {
	inventoryEvent := &models.Event{
		ID:        "1",
		Type:      models.InventoryReserveRequested,
		SagaID:    event.SagaID,
		Data:      event.Data,
		Timestamp: time.Now(),
		Source:    "saga-orchestrator",
	}

	log.Printf("📦 Saga %s: Requesting inventory reservation", event.SagaID)
	return ops.eventBus.Publish(ctx, inventoryEvent)
}

func (ops *OrderProcessingSaga) requestPaymentProcessing(ctx context.Context, event *models.Event) error {
	paymentEvent := &models.Event{
		ID:        "1",
		Type:      models.PaymentProcessRequested,
		SagaID:    event.SagaID,
		Data:      event.Data,
		Timestamp: time.Now(),
		Source:    "saga-orchestrator",
	}

	log.Printf("💳 Saga %s: Requesting payment processing", event.SagaID)
	return ops.eventBus.Publish(ctx, paymentEvent)
}

func (ops *OrderProcessingSaga) handlePaymentProcessed(ctx context.Context, event *models.Event) error {
	ops.mu.Lock()
	instance, exists := ops.sagaInstances[event.SagaID]
	if !exists {
		ops.mu.Unlock()
		return fmt.Errorf("saga instance %s not found", event.SagaID)
	}

	instance.CompletedSteps = append(instance.CompletedSteps, "payment_processed")
	instance.Status = models.SagaCompleted
	instance.CurrentStep = 3
	endTime := time.Now()
	instance.EndTime = &endTime

	if paymentID, ok := event.Data["payment_id"].(string); ok {
		instance.OrderData.PaymentID = paymentID
	}
	ops.mu.Unlock()

	duration := endTime.Sub(instance.StartTime)
	log.Printf("🎉 Saga %s: Order processing completed successfully in %v", event.SagaID, duration)

	return ops.publishSagaCompleted(ctx, event.SagaID)
}

func (ops *OrderProcessingSaga) handleOrderFailed(ctx context.Context, event *models.Event) error {
	return ops.handleFailure(ctx, event.SagaID, "order creation failed")
}

func (ops *OrderProcessingSaga) handleInventoryFailed(ctx context.Context, event *models.Event) error {
	return ops.handleFailure(ctx, event.SagaID, "inventory reservation failed")
}

func (ops *OrderProcessingSaga) handlePaymentFailed(ctx context.Context, event *models.Event) error {
	return ops.handleFailure(ctx, event.SagaID, "payment processing failed")
}

func (ops *OrderProcessingSaga) handleFailure(ctx context.Context, sagaID, reason string) error {
	ops.mu.Lock()
	instance, exists := ops.sagaInstances[sagaID]
	if !exists {
		ops.mu.Unlock()
		return fmt.Errorf("saga instance %s not found", sagaID)
	}

	instance.Status = models.SagaCompensating
	ops.mu.Unlock()

	log.Printf("❌ Saga %s: %s - starting compensation", sagaID, reason)

	return ops.startCompensation(ctx, sagaID)
}

func (ops *OrderProcessingSaga) startCompensation(ctx context.Context, sagaID string) error {
	ops.mu.RLock()
	instance, exists := ops.sagaInstances[sagaID]
	if !exists {
		ops.mu.RUnlock()
		return fmt.Errorf("saga instance %s not found", sagaID)
	}

	completedSteps := make([]string, len(instance.CompletedSteps))
	copy(completedSteps, instance.CompletedSteps)
	orderData := *instance.OrderData
	ops.mu.RUnlock()

	log.Printf("🔄 Saga %s: Starting compensation for steps: %v", sagaID, completedSteps)

	for i := len(completedSteps) - 1; i >= 0; i-- {
		step := completedSteps[i]
		if err := ops.compensateStep(ctx, sagaID, step, &orderData); err != nil {
			log.Printf("❌ Saga %s: Compensation failed for step %s: %v", sagaID, step, err)
		}
	}

	return nil
}

func (ops *OrderProcessingSaga) compensateStep(ctx context.Context, sagaID, step string, orderData *models.Order) error {
	var event *models.Event

	switch step {
	case "payment_processed":
		event = &models.Event{
			ID:        "1",
			Type:      models.PaymentProcessRequested,
			SagaID:    sagaID,
			Timestamp: time.Now(),
			Source:    "saga-orchestrator",
		}
		log.Printf("💳 Saga %s: Requesting payment refund", sagaID)
	case "inventory_reserved":
		event = &models.Event{
			ID:        "1",
			Type:      models.InventoryReserveRequested,
			SagaID:    sagaID,
			Timestamp: time.Now(),
			Source:    "saga-orchestrator",
		}
		log.Printf("📦 Saga %s: Requesting inventory release", sagaID)
	case "order_created":
		event = &models.Event{
			ID:        "1",
			Type:      models.OrderCreateRequested,
			SagaID:    sagaID,
			Timestamp: time.Now(),
			Source:    "saga-orchestrator",
		}
		log.Printf("🛒 Saga %s: Requesting order cancellation", sagaID)
	default:
		return fmt.Errorf("unknown step for compensation: %s", step)
	}

	return ops.eventBus.Publish(ctx, event)
}

func (ops *OrderProcessingSaga) handleCompensationCompleted(ctx context.Context, event *models.Event) error {
	ops.mu.Lock()
	instance, exists := ops.sagaInstances[event.SagaID]
	if !exists {
		ops.mu.Unlock()
		return fmt.Errorf("saga instance %s not found", event.SagaID)
	}

	if instance.Status == models.SagaCompensating {
		instance.Status = models.SagaCompensated
		endTime := time.Now()
		instance.EndTime = &endTime

		duration := endTime.Sub(instance.StartTime)
		log.Printf("🔄 Saga %s: Compensation completed in %v", event.SagaID, duration)
	}
	ops.mu.Unlock()

	return ops.publishSagaFailed(ctx, event.SagaID)
}

func (ops *OrderProcessingSaga) publishSagaCompleted(ctx context.Context, sagaID string) error {
	event := &models.Event{
		ID:        "1",
		Type:      models.SagaCompletedEvent,
		SagaID:    sagaID,
		Data:      map[string]interface{}{"status": "completed"},
		Timestamp: time.Now(),
		Source:    "saga-orchestrator",
	}
	return ops.eventBus.Publish(ctx, event)
}

func (ops *OrderProcessingSaga) publishSagaFailed(ctx context.Context, sagaID string) error {
	event := &models.Event{
		ID:        "1",
		Type:      models.SagaFailedEvent,
		SagaID:    sagaID,
		Data:      map[string]interface{}{"status": "failed"},
		Timestamp: time.Now(),
		Source:    "saga-orchestrator",
	}
	return ops.eventBus.Publish(ctx, event)
}
