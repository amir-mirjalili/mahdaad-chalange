# Resilient SMS Service

A production-ready SMS service built with Node.js/TypeScript that handles third-party API failures gracefully using circuit breaker patterns, intelligent retry logic, and priority queuing.

## 🎯 Problem Statement

When depending on external SMS APIs, systems often face:
- **API downtime** causing service failures
- **Slow responses** degrading user experience  
- **Retry storms** overwhelming failing APIs
- **Poor user feedback** during outages

This service solves these issues by staying responsive even when external APIs fail.

## ✨ Features

### 🔌 Circuit Breaker Protection
- **Automatic failure detection** - Opens circuit after configurable failures
- **Smart recovery** - Gradually tests API health before full restoration
- **Prevents cascade failures** - Stops overwhelming downstream services


## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │───▶│  SMS Service     │───▶│ External SMS    │
│                 │    │                  │    │ API             │
└─────────────────┘    │ ┌──────────────┐ │    └─────────────────┘
                       │ │Circuit       │ │              ▲
                       │ │Breaker       │ │              │
                       │ └──────────────┘ │              │
                       │                  │              │
                       │ ┌──────────────┐ │              │
                       │ │Priority      │ │              │
                       │ │Queue         │ │              │
                       │ └──────────────┘ │              │
                       │                  │              │
                       │ ┌──────────────┐ │              │
                       │ │Retry Logic   │ │──────────────┘
                       │ │& Scheduler   │ │
                       │ └──────────────┘ │
                       └──────────────────┘
```

## 🚀 Quick Start

### Installation

```bash
npm install

```

### Basic Usage

```typescript
import { ResilientSMSService, ExternalSMSAPI } from './sms-service';

// Configure circuit breaker
const circuitConfig = {
  failureThreshold: 3,    // Open after 3 failures
  resetTimeout: 5000,     // Try reset after 5 seconds  
  monitoringPeriod: 10000 // Monitor for 10 seconds
};

// Configure retry logic
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000,        // Start with 1 second
  maxDelay: 10000,        // Max 10 seconds
  backoffMultiplier: 2    // Double each time
};

// Create service instance
const externalAPI = new ExternalSMSAPI();
const smsService = new ResilientSMSService(externalAPI, retryConfig, circuitConfig);

// Send SMS (returns immediately)
const result = await smsService.sendSMS('+1234567890', 'Hello World!', 'high');
console.log(`Message queued: ${result.messageId}, Status: ${result.status}`);
```


## 🔧 Configuration

### Circuit Breaker Settings

| Parameter | Default | Description |
|-----------|---------|-------------|
| `failureThreshold` | 3 | Failures before opening circuit |
| `resetTimeout` | 5000ms | Time before attempting reset |
| `monitoringPeriod` | 10000ms | Health monitoring window |

### Retry Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `maxRetries` | 3 | Maximum retry attempts |
| `baseDelay` | 1000ms | Initial retry delay |
| `maxDelay` | 10000ms | Maximum retry delay |
| `backoffMultiplier` | 2 | Delay multiplier per retry |

### Message Priorities

- **`high`** - Emergency alerts, critical notifications
- **`normal`** - Standard messages, confirmations  
- **`low`** - Marketing, non-urgent updates


### Development Setup

```bash
npm install

npm run dev
```
