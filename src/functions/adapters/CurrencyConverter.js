/**
 * CurrencyConverter Adapter
 * 货币转换适配器 - 可选缓存版
 *
 * 适配说明：
 * - 缓存: 分布式缓存（可选）
 * - 华为云: axios + DCS SDK
 */

const axios = require('axios');

/**
 * 获取货币汇率
 * @returns {Object} - 货币汇率
 */
const getCurrencies = async () => {
    const CURRENCIES_PATH = process.env.CURRENCIES_PATH;

    // 如果没有配置外部 API，返回默认汇率
    if (!CURRENCIES_PATH) {
        return {
            USD: 1.0,
            EUR: 0.85,
            GBP: 0.73,
            CNY: 6.45
        };
    }

    try {
        const response = await axios.get(CURRENCIES_PATH, {
            timeout: 5000
        });
        return response.data.rates || { USD: 1.0 };
    } catch (err) {
        console.error("Error fetching currencies:", err);
        // 返回默认汇率
        return {
            USD: 1.0,
            EUR: 0.85,
            GBP: 0.73,
            CNY: 6.45
        };
    }
};

module.exports = {
    getCurrencies
};
