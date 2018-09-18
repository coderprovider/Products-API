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

    return res.send({ apiKey })
  },

  requireApiKey: (req, res, next) => {
    if (!req.query.key) {
      return res.status(401).send('This request requires an API key')
    } else {
      next()
    }
  },

  getUserProductAndCart: (req, res, next) => {
    if (!userProducts[req.query.key]) {
      return res.status(400).send('API key not found')
    } else {
      const { products, cart } = userProducts[req.query.key]
      req.cart = cart
      req.products = products
      next()
    }
  },

  getAllProducts: (req, res) => {
    const { min, max, name, category, id } = req.query

    var filteredProducts = cloneDeep(req.products)

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
    const { name, description, price, image, category } = req.body
    if (!name || !description || !price || !image || !category) {
      return res
        .status(400)
        .send('Required property missing off of request body.')
    } else {
      let id = req.products.reduce((tot, cur) => {
        if (cur.id > tot) tot = cur.id
        return tot
      }, 0)
      id++
      req.products.push({ id, name, description, price, image, category })
      return res.send(req.products)
    }
  },

  getCart: (req, res) => {
    res.send(req.cart)
  },

  addToCart: (req, res) => {
    const { id } = req.params
    let matchIndex = req.cart.findIndex(product => {
      return product.id === +id
    })
    if (matchIndex != -1) {
      req.cart[matchIndex].quantity++
    } else {
      let productToAdd = req.products.find(product => product.id === +id)
      productToAdd = { ...productToAdd }
      productToAdd.quantity = 1
      req.cart.push(productToAdd)
    }
    return res.send(req.cart)
  },

  updateCartQuantity: (req, res) => {
    const { id, quantity } = req.body
    if (id && quantity === 0) {
      req.cart = req.cart.filter(item => item.id !== id)
      return res.status(200).send(req.cart)
    }
    if (!id || !quantity) {
      return res
        .status(400)
        .send('Required property missing off of request body.')
    }
    let matchIndex = req.cart.findIndex(product => {
      return product.id === +id
    })
    if (matchIndex != -1) {
      req.cart[matchIndex].quantity = quantity
      if (req.cart[matchIndex].quantity === 0) {
        req.cart.splice(matchIndex, 1)
      }
      return res.send(req.cart)
    } else {
      return res.status(404).send('Product not found')
    }
  },

  removeFromCart: (req, res) => {
    const { id } = req.params
    let matchIndex = req.cart.findIndex(product => {
      return product.id === +id
    })
    if (matchIndex != -1) {
      if (req.cart[matchIndex].quantity > 1) {
        req.cart[matchIndex].quantity--
        return res.send(req.cart)
      } else {
        req.cart.splice(matchIndex, 1)
        return res.send(req.cart)
      }
    } else {
      return res.status(404).send('Product not found')
    }
  },

  cartCheckout: (req, res) => {
    req.cart = []
    return res.send(req.cart)
  },

  test(req, res) {
    const products = db.get('products')
    res.send(products)
  }
}
