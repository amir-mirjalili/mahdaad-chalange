# Order Processing Saga - Resilient Decoupled Architecture

## Overview

This implementation demonstrates a **resilient, event-driven saga pattern** for order processing with three critical steps:
1. **Create Order** → 2. **Deduct Inventory** → 3. **Process Payment**

The architecture ensures **full decoupling** between services while maintaining **strong consistency** through proper compensation mechanisms.

## Architecture Design

### 🏗️ Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Order Service │    │Inventory Service│    │ Payment Service │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Create Order │ │    │ │Reserve Items│ │    │ │Process Pay. │ │
│ │Cancel Order │ │    │ │Release Items│ │    │ │Refund Pay.  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Event Bus     │
                    │  ┌───────────┐  │
                    │  │Publishers │  │
                    │  │Subscribers│  │
                    │  │Event Queue│  │
                    │  └───────────┘  │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Saga Orchestr.  │
                    │  ┌───────────┐  │
                    │  │State Mgmt │  │
                    │  │Compensation│  │
                    │  │Monitoring │  │
                    │  └───────────┘  │
                    └─────────────────┘
```

