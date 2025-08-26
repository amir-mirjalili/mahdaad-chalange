package payment

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
	eventBus saga.EventBus
	payments map[string]*models.Order
	mu       sync.RWMutex
}

func NewPaymentService(eventBus saga.EventBus) *Service {
	service := &Service{
		eventBus: eventBus,
		payments: make(map[string]*models.Order),
	}

	eventBus.Subscribe(models.PaymentProcessRequested, service.handleProcessPayment)

	return service
}

func (ps *Service) handleProcessPayment(ctx context.Context, event *models.Event) error {
	log.Printf("💳 PaymentService: Processing payment for saga %s", event.SagaID)

	var orderData models.Order

	time.Sleep(200 * time.Millisecond)

	paymentID := fmt.Sprintf("pay_%s_%d", orderData.OrderID, time.Now().Unix())
	orderData.PaymentID = paymentID

	ps.mu.Lock()
	ps.payments[paymentID] = &orderData
	ps.mu.Unlock()

	log.Printf("✅ PaymentService: Payment processed successfully (Payment ID: %s, Amount: %.2f)",
		paymentID, orderData.Amount)

	return ps.publishPaymentCompleted(ctx, event.SagaID)
}

func (ps *Service) publishPaymentCompleted(ctx context.Context, sagaID string) error {
	event := &models.Event{
		ID:        "1",
		Type:      models.PaymentProcessCompleted,
		SagaID:    sagaID,
		Timestamp: time.Now(),
		Source:    "payment-service",
	}
	return ps.eventBus.Publish(ctx, event)
}
