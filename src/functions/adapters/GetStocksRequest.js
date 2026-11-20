/**
 * GetStocksRequest Adapter
 * 获取股票数据请求适配器
 */

const HTTPHandler = require("../ports/HTTPHandler");

/**
 * 获取股票数据并转换为指定货币
 * @param {string} stockID - 股票 ID
 * @returns {Object} - HTTP 响应
 */
const getStocksRequest = async (stockID) => {
    let res;

    try {
        const stockData = await HTTPHandler.retrieveStock(stockID);

        res = {
            'statusCode': 200,
            'body': JSON.stringify({
                message: stockData,
            })
        };
    } catch (err) {
        console.error("Error retrieving stock:", err);
        return {
            'statusCode': 500,
            'body': JSON.stringify({
                error: "Failed to retrieve stock data",
                message: err.message
            })
        };
    }

    return res;
};

module.exports = getStocksRequest;
