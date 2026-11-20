/**
 * HTTPHandler Port
 * HTTP 处理端口接口
 */

const stock = require("../domains/StocksLogic");

/**
 * 从数据库和缓存获取股票数据
 * @param {string} stockID - 股票 ID
 * @returns {Object} - 股票数据
 */
const retrieveStock = async (stockID) => {
    try {
        const stockWithCurrencies = await stock.getStockWithCurrencies(stockID);
        return stockWithCurrencies;
    }
    catch (err) {
        console.error("Error in retrieveStock:", err);
        return {
            error: "Failed to retrieve stock",
            message: err.message
        };
    }
}

module.exports = {
    retrieveStock
}
