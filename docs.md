## GET: /api/key
Get a new API key to interact with the products API.
#### Response
```
{
    "apiKey": "37125b91"
}
```

## GET: /api/products
Get an array of all available products.

#### Parameters
| name    | description |
----------|---------------
| key <sup>*required</sup>  | Your API key |
| min | minimum price filter |
| max | maximum price filter |
| name | product name filter |
| category | category filter |
| id | ID of product |

#### Response
An array of all available products, filtered by any applicable parameters included in the request.
```
[
    {
        "id": 1,
        "name": "product name",
        "description": "product description",
        "price": 1.99,
        "image": "http://image.com/100.jpg",
        "category": "product category"
    }
]
```

## POST: /api/products
Add a new product to the array of available products.

#### Parameters
| name    | description |
----------|---------------
| key <sup>*required</sup>  | Your API key |

#### Body <sup>*required</sup>
Request body with name, description, price, image, category properties.
```
{
    "name": "name of new product",
    "description": "description of new product",
    "price": <price of new item as a decimal>,
    "image": "url for product image",
    "category": "category of new product"
}
```

#### Response
An array of all available products, including the newly added product.
```
[
    {
        "id": 1,
        "name": "product name",
        "description": "product description",
        "price": 1.99,
        "image": "http://image.com/100.jpg",
        "category": "product category"
    }
]
```

