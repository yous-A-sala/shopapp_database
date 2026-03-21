const http = require('http');
const { Pool } = require('pg');

// Set up postgres connection
const pool = new Pool({
	user: 'postgres',
	host: 'localhost',
	database: 'shop_db',
	password: 'password',	// change to whatever password
	port: 5432		// psql port number
});

// helper function for JSON
function sendJSON(res, data, status = 200){
	res.writeHead(status, { 'Content-Type' : 'application/json' });
	res.end(JSON.stringify(data));
}

// HTTP requests to set the server up
const server = http.createServer(async (req, res) => {
	if (req.method === 'GET' && req.url === '/') {
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('Jomart backend is up');
	} else if (req.method === 'GET' && req.url === '/products') {
		try{
			const result = await pool.query('SELECT * FROM product');
			sendJSON(res, result.rows);
		} catch(err) {
			console.error(err);
			sendJSON(res, { error: 'Products Error' }, 500);
		}
	} else if (req.method === 'POST' && req.url === '/order'){
		let body = '';

		req.on('data', chunk => {
			body += chunk.toString();
		});

		req.on('end', async() => {
			const client = await pool.connect();
			try {
				const data = JSON.parse(body);
				const { product_id, quantity } = data;

				await client.query('BEGIN');

				// row locking
				const result = await client.query(
					'SELECT stock FROM product WHERE product_id = $1 FOR UPDATE',
					[product_id]
				);

				if (result.rows.length === 0) {
					throw new Error('Product not found');
				}

				const stock = result.rows[0].stock;

				if (stock < quantity) {
					throw new Error('Not enough stock');
				}

				await client.query(
					'UPDATE product SET stock = stock - $1 WHERE product_id = $2',
					[quantity, product_id]
				);

				await client.query('COMMIT');
				sendJSON(res, { success: true });

			} catch (err) {
				await client.query('ROLLBACK');
				console.error(err);
				sendJSON(res, { error: err.message }, 400);
			} finally {
				client.release(); // releases 'client' used for transaction
			}
		});
	}
	else {
		res.writeHead(404, { 'Content-Type': 'text/plain' });
		res.end('Not found');
	}
});


// pick some port to listen to
const PORT = 1024;
server.listen(PORT, () => {
	console.log(`Backend running at http://localhost:${PORT}`);
});
