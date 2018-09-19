const express = require('express')
const ctrl = require('./controllers/controller')
const path = require('path')
const morgan = require('morgan')
const cors = require('cors')

const app = express()
app.use(express.json())
app.use(cors())

app.use(morgan('dev'))

app.use(express.static(path.join(__dirname, './swagger-ui/dist')))

app.get('/products/key', ctrl.getApiKey)

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
