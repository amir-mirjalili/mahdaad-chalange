# TypeScript Event-Driven Course Management System

A robust, type-safe event-driven architecture implementation demonstrating how to handle side effects without tight coupling in a Node.js/TypeScript application.

## ⚡ Key Features

### 🔒 **Type Safety**
- Compile-time event validation
- Type-safe event payloads
- Generic event handlers
- Interface-driven design

### 📈 **Scalability**
- Non-blocking main business flow
- Independent handler execution
- Easy to add new side effects
- Microservice-ready architecture

### 🛡️ **Resilience**
- Individual handler error isolation
- Graceful failure handling
- Correlation ID tracing
- Structured logging

### 🧪 **Testability**
- Clear separation of concerns
- Interface-based dependency injection
- Easy mocking capabilities
- Comprehensive error scenarios

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Course API    │───▶│  Course Service │───▶│   Event Bus     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                        ┌──────────────────────────────────────────┐
                        │            Event Handlers                │
                        └──────────────────────────────────────────┘
                                       │
                        ┌──────────────┼──────────────┐
                        ▼              ▼              ▼
                ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
                │    Email    │ │  Dashboard  │ │   Search    │
                │   Handler   │ │   Handler   │ │   Handler   │
                └─────────────┘ └─────────────┘ └─────────────┘
```

## 📁 Project Structure

```
src/
├── types/                      # TypeScript type definitions
│   ├── events.ts              # Event payload types
│   ├── models.ts              # Domain model types
│   └── index.ts
├── core/                      # Core business logic
│   ├── events/               # Event system infrastructure
│   │   ├── EventBus.ts
│   │   └── interfaces/
│   └── services/             # Domain services
│       ├── CourseService.ts
│       └── interfaces/
├── handlers/                  # Event handlers (side effects)
│   ├── email/
│   ├── dashboard/
│   ├── search/
│   ├── analytics/
│   └── HandlerRegistry.ts
└── utils/                     # Utility functions
    ├── logger.ts
    └── helpers.ts
```

## 🚦 Quick Start

### Prerequisites

- Node.js 16+ 
- npm
- TypeScript 4.5+

### Installation

```bash
cd course-system

# Install dependencies
npm install

# Install TypeScript globally (if not already installed)
npm install -g typescript ts-node

# Build the project
npm run build
```

### Running the Demo

```bash
# Run in development mode
npm run dev

# Or run the compiled version
npm start
```

### Microservices Migration

The architecture supports easy migration to microservices:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Course API    │    │  Email Service  │    │ Search Service  │
│   (Port 3000)   │    │   (Port 3001)   │    │   (Port 3002)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Message Broker │
                    │ (Redis/RabbitMQ)│
                    └─────────────────┘
```

## 📊 Performance Considerations

### Event Bus Performance

- **In-Memory**: Suitable for single-instance applications
- **Redis Pub/Sub**: For distributed systems with moderate throughput
- **Apache Kafka**: For high-throughput, fault-tolerant systems
- **AWS EventBridge**: For cloud-native serverless architectures

### Scaling Strategies

1. **Horizontal Scaling**: Multiple instances with shared event bus
2. **Handler Isolation**: Move handlers to separate processes/containers  
3. **Event Partitioning**: Route events based on tenant/region
4. **Async Processing**: Queue events for batch processing

