export type SMSMessage ={
    id: string;
    phoneNumber: string;
    message: string;
    priority: 'high' | 'normal' | 'low';
    maxRetries: number;
    currentRetries: number;
    createdAt: Date;
    scheduledAt?: Date;
}