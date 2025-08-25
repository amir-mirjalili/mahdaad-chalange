package models

import "time"

type Saga struct {
	ID             string
	Status         SagaStatus
	CurrentStep    int
	OrderData      *Order
	CompletedSteps []string
	StartTime      time.Time
	EndTime        *time.Time
}
