const express = require('express')
const ctrl = require('./controllers/controller')
const path = require('path')

const app = express()
app.use(express.json())

app.use(express.static(path.join(__dirname, '../swagger-ui/dist')))
app.use('/products', express.static(path.join(__dirname, '../swagger-ui/dist')))

app.get('/products/key', ctrl.getApiKey)

app.get('/api/test', ctrl.test)

app.use(ctrl.requireApiKey, ctrl.getUserProductAndCart)

app
  .route('/products/catalog')
  .get(ctrl.getAllProducts)
  .post(ctrl.addNewProduct)

app
  .route('/products/cart')
  .get(ctrl.getCart)
  .put(ctrl.updateCartQuantity)

app.route('/products/cart/checkout').delete(ctrl.cartCheckout)

app
  .route('/products/cart/:id')
  .post(ctrl.addToCart)
  .delete(ctrl.removeFromCart)

const port = 5000
app.listen(port, () =>
  console.log(`View the API docs at http://localhost:${port}`)
)
