/**
 * StocksLogic Domain
 * 股票业务逻辑领域层
 */

const StocksDB = require("../adapters/StocksDB");
const CurrenciesService = require("../adapters/CurrencyConverter");

/**
 * 获取股票数据（含货币转换）
 * @param {string} stockID - 股票 ID
 * @returns {Object} - 股票数据
 */
const getStockWithCurrencies = async (stockID) => {
    // 从数据库获取股票数据
    const stockData = await StocksDB.getStock(stockID);

    if (!stockData) {
        throw new Error(`Stock ${stockID} not found`);
    }

    // 获取货币转换数据
    const currencies = await CurrenciesService.getCurrencies();

    // 计算转换后的价值
    const value = stockData.VALUE * (currencies.USD || 1);

    return {
        stockId: stockID,
        value: value,
        baseCurrency: stockData.CURRENCY || 'USD',
        convertedCurrency: 'USD',
        timestamp: new Date().toISOString()
    };
};

module.exports = {
    getStockWithCurrencies
};
