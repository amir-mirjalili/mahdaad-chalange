package models

type OrderStatus string
type InventoryStatus string
type PaymentStatus string
type SagaStatus string

const (
	OrderPending   OrderStatus = "pending"
	OrderConfirmed OrderStatus = "confirmed"
	OrderCancelled OrderStatus = "cancelled"

	InventoryReserved InventoryStatus = "reserved"
	InventoryReleased InventoryStatus = "released"

	PaymentProcessed PaymentStatus = "processed"
	PaymentRefunded  PaymentStatus = "refunded"
	PaymentFailed    PaymentStatus = "failed"

	SagaStarted      SagaStatus = "started"
	SagaCompleted    SagaStatus = "completed"
	SagaFailed       SagaStatus = "failed"
	SagaCompensating SagaStatus = "compensating"
	SagaCompensated  SagaStatus = "compensated"
)

type Order struct {
	OrderID       string  `json:"id"`
	CustomerID    string  `json:"customer_id"`
	ProductID     string  `json:"product_id"`
	Quantity      int     `json:"quantity"`
	Amount        float64 `json:"amount"`
	PaymentID     string  `json:"payment_id,omitempty"`
	ReservationID string  `json:"reservation_id,omitempty"`
}
