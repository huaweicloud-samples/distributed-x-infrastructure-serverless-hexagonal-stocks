/**
 * CurrencyConverterWithCache Adapter
 * 货币转换适配器 - 带缓存版本 (Cache-Aside Pattern)
 *
 * 适配说明：
 * - 缓存: 分布式缓存（可选）
 * - 华为云: DCS Redis
 */

const axios = require('axios');

// DCS 配置
const CACHE_URL = process.env.CACHE_URL || '';
const CACHE_PORT = process.env.CACHE_PORT || 6379;

// 简单的内存缓存（生产环境应使用 DCS）
let cache = {};
const CACHE_TTL = 300; // 5 分钟

/**
 * 获取货币汇率（带缓存）
 * @returns {Object} - 货币汇率
 */
const getCurrencies = async () => {
    const cacheKey = 'currencies';

    // 检查内存缓存
    const cached = cache[cacheKey];
    if (cached && cached.expiry > Date.now()) {
        console.log('Returning cached currencies');
        return cached.data;
    }

    // 尝试连接 DCS Redis
    let redisClient = null;
    try {
        // 注意：生产环境使用 @huaweicloud/dcs-sdk-js
        // const { DCSClient, RedisClient } = require('@huaweicloud/dcs-sdk-js');
        // redisClient = new RedisClient(CACHE_URL, parseInt(CACHE_PORT));
        // const value = await redisClient.get(cacheKey);
        // if (value) return JSON.parse(value);
    } catch (err) {
        console.log('Redis not available, using fallback');
    }

    // 获取新数据
    const CURRENCIES_PATH = process.env.CURRENCIES_PATH;
    let rates = { USD: 1.0, EUR: 0.85, GBP: 0.73, CNY: 6.45 };

    if (CURRENCIES_PATH) {
        try {
            const response = await axios.get(CURRENCIES_PATH, {
                timeout: 5000
            });
            rates = response.data.rates || rates;
        } catch (err) {
            console.error("Error fetching currencies:", err);
        }
    }

    // 更新缓存
    cache[cacheKey] = {
        data: rates,
        expiry: Date.now() + (CACHE_TTL * 1000)
    };

    // 尝试写入 DCS
    try {
        if (redisClient) {
            // await redisClient.set(cacheKey, JSON.stringify(rates), CACHE_TTL);
        }
    } catch (err) {
        console.log('Failed to write to Redis cache');
    }

    return rates;
};

module.exports = {
    getCurrencies
};
