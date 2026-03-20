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
