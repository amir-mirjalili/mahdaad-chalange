package models

import (
	"time"
)

type EventType string

const (
	OrderCreateRequested EventType = "order.create.requested"
	OrderCreateCompleted EventType = "order.create.completed"
	OrderCreateFailed    EventType = "order.create.failed"

	InventoryReserveRequested EventType = "inventory.reserve.requested"
	InventoryReserveCompleted EventType = "inventory.reserve.completed"
	InventoryReserveFailed    EventType = "inventory.reserve.failed"

	PaymentProcessRequested EventType = "payment.process.requested"
	PaymentProcessCompleted EventType = "payment.process.completed"
	PaymentProcessFailed    EventType = "payment.process.failed"

	SagaCompletedEvent EventType = "saga.completed"
	SagaFailedEvent    EventType = "saga.failed"
)

type Event struct {
	ID        string                 `json:"id"`
	Type      EventType              `json:"type"`
	SagaID    string                 `json:"saga_id"`
	Data      map[string]interface{} `json:"data"`
	Timestamp time.Time              `json:"timestamp"`
	Source    string                 `json:"source"`
}
