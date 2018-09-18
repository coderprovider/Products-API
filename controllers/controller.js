const products = require('../products.json')
const cloneDeep = require('lodash.clonedeep')
const getRandomKey = require('uuid/v4')

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)

const userProducts = {}

module.exports = {
  getApiKey: (req, res) => {
    // Generate a random API key using uuid
    const apiKey = getRandomKey().split('-')[0]

    // Create a new empty cart and a copy of all products for the API key and put into db.json
    db.set(apiKey, {
      cart: [],
      products: cloneDeep(products)
    }).write()

    // Send the API key back to the client
    return res.send({ key: apiKey })
  },

  // Middleware
  requireApiKey: (req, res, next) => {
    // Destructure the API key from the request query
    const { key } = req.query
    // Check for an API key in the request query
    if (key === undefined || key.length === 0) {
      // The request was missing an API key
      return res.status(401).send('This request requires an API key.')
    } else {
      // The request had an API key, proceed to the endpoint
      next()
    }
  },

  // Middleware
  getUserProductAndCart: (req, res, next) => {
    // Get the API key from the request query
    const { key } = req.query
    // Check to see that a session has been made in db.json using that API key
    // Returns true or false
    const session = db.has(key).value()

    if (session === false) {
      // No session by the given API key was found.
      return res.status(400).send('API key not found')
    } else {
      // A session was found, proceed to the endpoint
      next()
    }
  },

  getAllProducts: (req, res) => {
    // Get the possible filter types and API key from the request query
    const { min, max, name, category, id, key } = req.query
    // Get the user's products list
    let filteredProducts = db.get(`${key}.products`).value()

    if (min) {
      filteredProducts = filteredProducts.filter(product => {
        return product.price >= min
      })
    }
    if (max) {
      filteredProducts = filteredProducts.filter(product => {
        return product.price <= max
      })
    }
    if (name) {
      filteredProducts = filteredProducts.filter(product => {
        return product.name.includes(name)
      })
    }
    if (category) {
      filteredProducts = filteredProducts.filter(product => {
        return product.category === category
      })
    }
    if (id) {
      filteredProducts = filteredProducts.filter(product => {
        return product.id === id
      })
    }

    return res.send(filteredProducts)
  },

  addNewProduct: (req, res) => {
    // Get the required information from the request body
    const { name, description, price, image, category } = req.body
    // Get the API key from the request query
    const { key } = req.query

    // Check for the required properties before proceeding to creating a new product
    if (!name || !description || !price || !image || !category) {
      return res
        .status(400)
        .send('Required property missing off of request body.')
    } else {
      // Get the list of products based off of the API key
      const products = db.get(`${key}.products`).value()

      // Generate a new ID
      let id = products.reduce((tot, cur) => {
        if (cur.id > tot) tot = cur.id
        return tot
      }, 0)
      id++

      // Push a new product to the end of their products array
      db.get(`${key}.products`)
        .push({ id, name, description, price, image, category })
        .write()

      // Send the updated array of products back to the client
      const updated_products = db.get(`${key}.products`).value()
      return res.send(updated_products)
    }
  },

  getCart: (req, res) => {
    // Get the API key off of the request query
    const { key } = req.query
    // Get the cart based off of the API key
    const cart = db.get(`${key}.cart`).value()
    // Send the cart back to the client
    res.send(cart)
  },

  addToCart: (req, res) => {
    console.log('addToCart was called')
    // Get the id of the product to add off of the request parameters
    const { id } = req.params
    // Get the API key off of the request query
    const { key } = req.query

    // Determine if the product is already in the user's cart
    const products = db.get(`${key}.cart`).value()
    let matchIndex = products.findIndex(product => product.id === +id)

    if (matchIndex != -1) {
      // The product is already in the cart
      // Get the current product's object
      const product = db.get(`${key}.cart[${matchIndex}]`).value()

      // Update the product's quantity property by 1
      db.get(`${key}.cart[${matchIndex}]`)
        .assign({
          quantity: ++product.quantity
        })
        .write()

      // Get the updated cart
      const updated_cart = db.get(`${key}.cart`).value()
      // Send the updated cart back to the client
      res.send(updated_cart)
    } else {
      // Find the object of property to add by id
      let productToAdd = db
        .get(`${key}.products`)
        .find(product => product.id === +id)
        .value()

      // Make sure a valid ID was used to avoid bugs
      if (!productToAdd) {
        return res.status(409).send('Invalid product ID was used.')
      }

      productToAdd = { ...productToAdd }
      productToAdd.quantity = 1

      // Push the new product to the end of the user's cart
      db.get(`${key}.cart`)
        .push(productToAdd)
        .write()

      // Get the updated cart
      const updated_cart = db.get(`${key}.cart`).value()
      // Send the updated cart back to the client
      res.send(updated_cart)
    }
  },

  updateCartQuantity: (req, res) => {
    // Get the API key from the request query
    const { key } = req.query
    // Get the id and quantity from the request body
    const { id, quantity } = req.body

    // Check to see that the required properties exist
    if (!id || quantity === undefined) {
      return res
        .status(400)
        .send('Required property missing off of request body.')
    }

    // Check to see if the product is in the cart already
    const cart = db.get(`${key}.cart`)
    const cartIndex = cart.findIndex(p => p.id === +id)

    if (cartIndex !== -1) {
      // The product is in the cart
      if (quantity <= 0) {
        // Remove the product entirely from the cart
        db.get(`${key}.cart`)
          .remove({ id })
          .write()
      } else if (quantity > 0) {
        // Update the product's quantity to the passed in quantity
        db.get(`${key}.cart[${cartIndex}]`)
          .assign({ quantity })
          .write()
      }

      // Get the updated cart
      const updated_cart = db.get(`${key}.cart`).value()
      // Send the updated cart back to the client
      return res.status(200).send(updated_cart)
    } else {
      // The product was not in the cart
      res.status(404).send('Product not found')
    }
  },

  removeFromCart: (req, res) => {
    // Get the API key from the request query
    const { key } = req.query
    // Get the ID of the product to remove from the request parameters
    const { id } = req.params

    // Check to see if the product is already in the user's cart
    const cart = db.get(`${key}.cart`).value()
    let matchIndex = cart.findIndex(product => product.id === +id)

    if (matchIndex != -1) {
      // The product is already in the user's cart
      const product = db.get(`${key}.cart[${matchIndex}]`).value()

      // Check to see if we need to decrease the quantity or remove the product entirely
      if (product.quantity > 1) {
        // Quantity is greator than one, decrease it by one
        db.get(`${key}.cart[${matchIndex}]`)
          .assign({
            quantity: --product.quantity
          })
          .write()
      } else {
        // Quantity is equal to one, remove the product entirely
        db.get(`${key}.cart`)
          .remove({ id: product.id })
          .write()
      }

      // Get the updated cart
      const updated_cart = db.get(`${key}.cart`).value()
      // Send the updated cart back to the client
      res.send(updated_cart)
    } else {
      // The product is not already in the user's cart
      res.status(404).send('Product not found')
    }
  },

  cartCheckout: (req, res) => {
    // Get the API key from the request query
    const { key } = req.query

    // Remove the existing cart and then create a new empty one
    db.unset(`${key}.cart`).write()
    db.set(`${key}.cart`, []).write()

    // Get the empty cart
    const empty_cart = db.get(`${key}.cart`).value()
    // Send the empty cart to the client
    res.send(empty_cart)
  }
}
