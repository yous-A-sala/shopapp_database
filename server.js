const http = require('http');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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

// helper for static file
function serveFile(res, fp, contentType){
	fs.readFile(fp, (err, content) => {
		if (err){
			res.writeHead(404);
			res.end("File not found");
		} else {
			res.writeHead(200, { 'Content-Type': contentType });
			res.end(content);
		}
	});
}

// HTTP requests to set the server up
const server = http.createServer(async (req, res) => {
	if (req.method === 'GET') {
		if (req.url === '/'){
			serveFile(res, path.join(__dirname, 'index.html'), 'text/html');
		} else if (req.url === '/app.js'){
			serveFile(res, path.join(__dirname, 'app.js'), 'text/javascript');
		} else if (req.url === '/styles.css'){
			serveFile(res, path.join(__dirname, 'styles.css'), 'text/css');
		} else if (req.url === '/products'){
			try {
				const result = await pool.query('SELECT * FROM product');
				sendJSON(res, result.rows);
			} catch(err) {
				console.error(err);
				sendJSON(res, { error: 'Products Error' }, 500);
			}
		} else {
			res.writeHead(404);
			res.end("Not found");
		}
	}  else if (req.method === 'POST' && req.url === '/order'){
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
	} else if (req.method === 'POST' && req.url === '/populate') {
		const client = await pool.connect();
		try {
			await client.query('BEGIN');
			await client.query('TRUNCATE product RESTART IDENTITY'); // reset without it would keep adding 

			const products = [
				{ name : 'Red Ball', price : 1.00, stock : 20 },
				{ name : 'Orange Ball', price : 2.00, stock : 20 },
				{ name : 'Yellow Ball', price : 3.00, stock : 20 },
				{ name : 'Green Ball', price : 4.00, stock : 15 },
				{ name : 'Blue Ball', price : 5.00, stock : 10 },
				{ name : 'Indigo Ball', price : 6.00, stock : 10 },
				{ name : 'Violet Ball', price : 7.00, stock : 10 }
			];

			for (const p of products) {
				await client.query(
					'INSERT INTO product(name, price, stock) VALUES ($1, $2, $3)',
					[p.name, p.price, p.stock]
				);
			}

			await client.query('COMMIT');
			sendJSON(res, {success : true});
		} catch (err) {
			await client.query("ROLLBACK");
			console.error(err);
			sendJSON(res, { error : err.message }, 400);
		} finally {
			client.release();
		}
	} else {
		res.writeHead(404, { 'Content-Type': 'text/plain' });
		res.end('Not found');
	}
});


// pick some port to listen to
const PORT = 1024;
server.listen(PORT, () => {
	console.log(`Backend running at http://localhost:${PORT}`);
});
