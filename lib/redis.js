import Redis from "ioredis"
import dotenv from "dotenv"

dotenv.config();

export const redis = new Redis(process.env.UPSTASH_REDIS_URL);

//  redis je key-value store
//  await redis.set('foo', 'bar'); // ovako se koristi