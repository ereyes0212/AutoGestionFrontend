// lib/rate-limit.ts
import createRateLimit from "next-rate-limit";

export const limiter = createRateLimit({
    interval: 60 * 1000, // 1 minuto
    uniqueTokenPerInterval: 500, // 500 IPs distintas por minuto
});
