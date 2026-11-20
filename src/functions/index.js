/**
 * Hexagonal Architecture - Stock Converter Function
 * 基于六边形架构的股票数据查询函数
 *
 * 适配说明：
 * - 网关事件 event.pathParameters.StockID 由 APIG 传入
 * - 数据访问统一走 Cassandra 驱动（GeminiDB）
 * - redis -> DCS SDK
 */

const getStocksRequest = require("./adapters/GetStocksRequest");

/**
 * FunctionGraph Handler
 * @param {Object} event - APIG 请求事件
 * @returns {Object} - HTTP 响应
 */
exports.handler = async (event) => {
    try {
        // 兼容 APIG 路径参数格式
        const stockID = event.pathParameters?.StockID || event.pathParameters?.stockID;

        if (!stockID) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Missing stock ID parameter"
                })
            };
        }

        const response = await getStocksRequest(stockID);
        return response;
    } catch (err) {
        console.error("Error:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Internal server error",
                message: err.message
            })
        };
    }
};
