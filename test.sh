for i in {1..3}; do
  curl -X POST http://localhost:1024/order \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 5}' &
done
wait
