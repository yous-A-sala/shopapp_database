const productList = document.getElementById("product-list");
const cartList = document.getElementById("cart-items");
const message = document.getElementById("message");
const productCounter = {};

const ballColors = {
	"Red Ball" : "red",
	"Orange Ball" : "orange",
	"Yellow Ball" : "yellow",
	"Green Ball" : "green",
	"Blue Ball" : "blue",
	"Indigo Ball" : "indigo",
	"Violet Ball" : "violet"
};

// load products
async function loadProducts(){
	try{
		const res = await fetch("http://localhost:1024/products");
		const products = await res.json();

		productList.innerHTML = ""; // Clears items when reloading

		products.forEach(product => {
			product.color = ballColors[product.name] || "gray";
			const div = document.createElement("div");
			div.className = "product-item";
			div.dataset.id = product.product_id;
			div.innerHTML = `
				<h3>
					${product.name} ($${product.price})
					<div class="ball" style="background-color: ${product.color};"></div>
				</h3>
				<p>Stock: <span class="stock-count">${product.stock}</span></p>
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

function addToCart(product){
	const quantity = 1;

	if (!productCounter[product.product_id]) {
		productCounter[product.product_id] = { name : product.name, quantity : 0 };
	}

	productCounter[product.product_id].quantity += quantity;

	updateCartDisplay();
	showMessage("Added to cart");
}

function updateCartDisplay() {
	cartList.innerHTML = ""; // clear
	for (const id in productCounter){
		const item = productCounter[id];
		const li = document.createElement("li");
		li.textContent = `${item.name} - Quantity: ${item.quantity}`;
		cartList.appendChild(li);
	}
}

function showMessage(msg) {
	message.textContent = msg;
	setTimeout(() => message.textContent = "", 3000);
}

// 
document.getElementById("checkout-button").addEventListener("click", async() => {
	try {
		const items = [];

		// loop over all items and add only ones with q over 0
		for (const id in productCounter) {
			if (productCounter[id].quantity > 0) {
				items.push({
					product_id : parseInt(id),
					quantity : productCounter[id].quantity
				});
			}
		}

		// if empty return message and do nothing
		if (items.length === 0){
			showMessage("Cart's empty");
			return;
		}

		// send POST request to server
		const res = await fetch("http://localhost:1024/checkout", {
			method : "POST",
			headers : { "Content-Type" : "application/json" },
			body : JSON.stringify({ items })
		});

		// convert from json string to object
		const data = await res.json();

		// if successful, clear cart afterwards
		if (data.success){
			cartList.innerHTML = "";

			for (const id in productCounter){
				const div = document.querySelector(`.product-item[data-id='${id}']`);
				if (div) {
					const stockSpan = div.querySelector(".stock-count");
					stockSpan.textContent = parseInt(stockSpan.textContent) - productCounter[id].quantity;
				}
				productCounter[id].quantity = 0;
			}
			showMessage("Checkout successful");
		} else {
			showMessage(data.error);
		}
	} catch (err) {
		console.error(err);
		showMessage("Checkout failed");
	}
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
