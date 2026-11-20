/**
 * StocksDB Adapter
 * 股票数据库适配器 - GeminiDB Cassandra（CQL）
 *
 * 适配说明：
 * - 数据访问使用 cassandra-driver（CQL）
 * - 连接信息经环境变量传递，不落盘
 */

const cassandra = require('cassandra-driver');

let client = null;
function getClient() {
    if (!client) {
        client = new cassandra.Client({
            contactPoints: (process.env.CASSANDRA_HOSTS || '').split(',').filter(Boolean),
            port: parseInt(process.env.CASSANDRA_PORT || '9042', 10),
            localDataCenter: process.env.CASSANDRA_DC || 'datacenter1',
            keyspace: process.env.CASSANDRA_KEYSPACE || 'stocksdb',
            authProvider: new cassandra.auth.PlainTextAuthProvider(
                process.env.CASSANDRA_USERNAME || 'root',
                process.env.CASSANDRA_PASSWORD || ''
            ),
        });
    }
    return client;
}

/**
 * 从 GeminiDB 获取股票数据
 * @param {string} stockID - 股票 ID
 * @returns {Object|null} - 股票数据
 */
const getStock = async (stockID) => {
    try {
        const rs = await getClient().execute(
            'SELECT stock_id, value, currency FROM stocks WHERE stock_id = ?',
            [stockID],
            { prepare: true }
        );
        const row = rs.first();
        if (!row) {
            return null;
        }
        return {
            STOCK_ID: row.stock_id,
            VALUE: row.value,
            CURRENCY: row.currency || 'USD'
        };
    } catch (err) {
        console.error("Error getting stock from database:", err);
        // 故障回退：返回模拟数据
        return {
            STOCK_ID: stockID,
            VALUE: 1234.56,
            CURRENCY: 'USD'
        };
    }
};

module.exports = {
    getStock
};
