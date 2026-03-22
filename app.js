const productList = document.getElementById("product-list");
const cartList = document.getElementById("cart-items");
const message = document.getElementById("message");

// load products
async function loadProducts(){
	try{
		const res = await fetch("http://localhost:1024/products");
		const products = await res.json();

		products.forEach(product => {
			const div = document.createElement("div");
			div.className = "product-item";
			div.innerHTML = `
				<h3>${product.name} ($${product.price})</h3>
				<button>Add to Cart</button>
			`;
			productList.appendChild(div);
			div.querySelector("button").addEventListener("click", () => addToCart(product));
		});
	} catch (err) {
		console.error("Error loading products:", err);
		message.textContent = "Failed to load";
	}
}

async function addToCart(product){
	const quantity = 1;

	try{
		const res = await fetch ("http://localhost:1024/order", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ product_id: product.product_id, quantity })
		});

		const data = await res.json();

		if (data.success) {
			const li = document.createElement("li");
			li.textContent = `${product.name} - Quantity: ${quantity}`;
			cartList.appendChild(li);
			showMessage("Added to cart");
		}  else {
			showMessage(data.error);
		}
	} catch(err) {
		console.error("Order failed:", err);
		showMessage("Failed order");
	}
}

function showMessage(msg) {
	message.textContent = msg;
	setTimeout(() => message.textContent = "", 3000);
}

document.getElementById("checkout-button").addEventListener("click", () => {
	cartList.innerHTML = "";
	showMessage("Checked out");
});

document.getElementById('populate-products').addEventListener('click', async() => {
	try {
		const res = await fetch('http://localhost:1024/populate', { method : 'POST' });
		const data = await res.json();
		if (data.success) {
			showMessage("Products populated");
			loadProducts();
		} else {
			showMessage(data.error);
		}
	} catch (err) {
		console.error(err);
		showMessage("Failed to populate");
	}
});

loadProducts();

console.log("Test... test.... js works");
