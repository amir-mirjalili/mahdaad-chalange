package saga

import (
	"context"
	"log"
	"process-order/internal/infrastructure/models"
	"sync"
)

type EventBus interface {
	Publish(ctx context.Context, event *models.Event) error
	Subscribe(eventType models.EventType, handler EventHandler) error
	Start(ctx context.Context) error
	Stop() error
}

type EventHandler func(ctx context.Context, event *models.Event) error

type InMemoryEventBus struct {
	handlers map[models.EventType][]EventHandler
	events   chan *models.Event
	mu       sync.RWMutex
	done     chan struct{}
}

func NewInMemoryEventBus() *InMemoryEventBus {
	return &InMemoryEventBus{
		handlers: make(map[models.EventType][]EventHandler),
		events:   make(chan *models.Event, 1000),
		done:     make(chan struct{}),
	}
}

func (eb *InMemoryEventBus) Publish(ctx context.Context, event *models.Event) error {
	select {
	case eb.events <- event:
		log.Printf("📤 Published event: %s for saga %s", event.Type, event.SagaID)
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func (eb *InMemoryEventBus) Subscribe(eventType models.EventType, handler EventHandler) error {
	eb.mu.Lock()
	defer eb.mu.Unlock()

	eb.handlers[eventType] = append(eb.handlers[eventType], handler)
	log.Printf("📥 Subscribed to event: %s", eventType)
	return nil
}

func (eb *InMemoryEventBus) Start(ctx context.Context) error {
	go func() {
		for {
			select {
			case event := <-eb.events:
				eb.handleEvent(ctx, event)
			case <-eb.done:
				return
			case <-ctx.Done():
				return
			}
		}
	}()
	return nil
}

func (eb *InMemoryEventBus) Stop() error {
	close(eb.done)
	return nil
}

func (eb *InMemoryEventBus) handleEvent(ctx context.Context, event *models.Event) {
	eb.mu.RLock()
	handlers := eb.handlers[event.Type]
	eb.mu.RUnlock()

	for _, handler := range handlers {
		go func(h EventHandler) {
			if err := h(ctx, event); err != nil {
				log.Printf("❌ Error handling event %s: %v", event.Type, err)
			}
		}(handler)
	}
}
