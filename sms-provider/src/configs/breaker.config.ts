export type CircuitBreakerConfig ={
    failureThreshold: number;
    resetTimeout: number;
    monitoringPeriod: number;
}