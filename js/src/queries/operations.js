export const PRODUCTS_QUERY = `
  {
    products {
      id
      name
      price
      description
      category {
        id
        name
      }
    }
  }
`;

export const CREATE_ORDER_MUTATION = `
  mutation CreateOrder(
    $userId: Int!,
    $addressId: Int!,
    $storeId: Int!,
    $productItems: [OrderItemInput!]!
  ) {
    createOrder(
      userId: $userId, 
      addressId: $addressId, 
      storeId: $storeId, 
      productItems: $productItems
    ) {
      id
      createdByUserId
      address { 
        id
      }
      status
      totalAmount
      deliveryDate
      orderItems {
        edges {
          node {
            id
            productId
            quantity
            orderAmount
          }
        }
      }
    }
  }
`;

export const GET_USER_ORDERS = `
  query GetUserOrders($userId: Int!) {
    getOrdersByUser(userId: $userId) {
      id
      address { 
        id
        address
        isPrimary
      }
      status
      totalAmount
      deliveryDate
      orderItems {
        edges {
          node {
            orderAmount
            quantity
            product {
              id
              name
              description
              category {
                id
                name
              }
              inventoryItems {
                edges {
                  node {
                    id
                    price
                    quantity
                    measurement
                    unit
                    storeId
                    productId
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_ALL_ORDERS = `
query GetAllOrders {
  getAllOrders {
    id
    creator {
      email
      mobile
    }
    address { 
      id
      address
      isPrimary
    }
    status
    storeId
    totalAmount
    deliveryDate
    deliveryInstructions
    orderItems {
      edges {
        node {
          id
          product {
            id
            name
            description
          }
          quantity
          orderAmount
        }
      }
    }
  }
}
`;

export const GET_ALL_USERS = `query getAllUsers {
  getAllUsers {
    id
    email
    type
    cognitoId
  }
}`;

export const UPDATE_ORDER_STATUS = `
  mutation UpdateOrderStatus($input: UpdateOrderStatusInput!) {
    updateOrderStatus(input: $input) {
      id
      status
      deliveryDate
      deliveryInstructions
    }
  }
`;

export const GET_DELIVERIES_BY_DRIVER = `
  query GetDeliveriesByDriver($driverId: Int!) {
    getDeliveriesByDriver(driverId: $driverId) {
      id
      orderId
      schedule
      pickedUpTime
      deliveredTime
      status
      comments
      order {
        addressId
        cancelMessage
        cancelledAt
        cancelledByUserId
        createdByUserId
        deliveryDate
        deliveryInstructions
        id
        paymentId
        status
        storeId
        totalAmount
        address {
          address
        }
        orderItems {
          edges {
            node {
              id
              inventoryId
              orderAmount
              orderId
              productId
              quantity
              product {
                categoryId
                description
                id
                image
                name
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_USER_PROFILE = `
  query GetUserProfile($userId: String!) {
    getUserProfile(userId: $userId) {
      id
      email
      type
      stores {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  }
`;

export const GET_ORDERS_BY_STORE = `
  query GetOrdersByStore($storeId: Int!) {
    getOrdersByStore(storeId: $storeId) {
      id
      addressId
      cancelledAt
      cancelledByUserId
      createdByUserId
      deliveryDate
      deliveryInstructions
      id
      paymentId
      status
      storeId
      totalAmount
      address {
        address
      }
      creator {
        mobile
        email
      }
      delivery {
        driverId
      }
      orderItems {
        edges {
          node {
            id
            inventoryId
            orderAmount
            orderId
            productId
            quantity
            product {
              id
              name
              description
            }
          }
        }
      }
    }
  }
`;

export const GET_STORE_DRIVERS = `
  query GetStoreDrivers($storeId: Int!) {
    getStoreDrivers(storeId: $storeId) {
      id
      storeId
      userId
      driver {
        active
        email
        mobile
        referralId
        referredBy
        type
      }
    }
  }
`;

export const CANCEL_ORDER = `
  mutation CancelOrder($orderId: Int!, $cancelMessage: String!, $cancelledByUserId: Int!) {
    cancelOrderById(
      orderId: $orderId, 
      cancelMessage: $cancelMessage, 
      cancelledByUserId: $cancelledByUserId
    ) {
      id
      status
    }
  }
`;

export const GET_ADDRESSES_BY_USER = `
  query GetAddressesByUser($userId: Int!) {
    getAddressesByUser(userId: $userId) {
      id
      address
      isPrimary
    }
  }
`;

export const CREATE_ADDRESS = `
  mutation CreateAddress($address: String!, $userId: Int!, $isPrimary: Boolean) {
    createAddress(address: $address, userId: $userId, isPrimary: $isPrimary) {
      id
      address
      isPrimary
    }
  }
`;

export const UPDATE_ADDRESS = `
  mutation UpdateAddress($addressId: Int!, $address: String, $isPrimary: Boolean) {
    updateAddress(addressId: $addressId, address: $address, isPrimary: $isPrimary) {
      id
      address
      isPrimary
    }
  }
`;

export const DELETE_ADDRESS = `
  mutation DeleteAddress($addressId: Int!) {
    deleteAddress(addressId: $addressId)
  }
`;

export const UPDATE_USER_TYPE = `
  mutation UpdateUserType($requesterId: String!, $targetUserId: String!, $newType: String!) {
    updateUserType(requesterId: $requesterId, targetUserId: $targetUserId, newType: $newType) {
      user {
        id
        email
        type
      }
      error {
        message
      }
    }
  }
`;

export const GET_STORE_INFO = `
  query GetStoreInfo($managerId: Int!) {
    storesByManager(managerUserId: $managerId) {
      id
      name
      address
      radius
    }
  }
`;

export const GET_STORE_INVENTORY = `
  query GetInventoryByStore($storeId: Int!) {
    getInventoryByStore(storeId: $storeId) {
      id
      quantity
      price
      unit
      updatedAt
      product {
        id
        name
        description
        category {
          id
          name
        }
        image
      }
    }
  }
`;

export const UPDATE_INVENTORY_ITEM = `
  mutation UpdateInventoryItem($inventoryId: Int!, $price: Float!, $quantity: Int!) {
    updateInventoryItem(inventoryId: $inventoryId, price: $price, quantity: $quantity) {
      id
      price
      quantity
      updatedAt
    }
  }
`;

export const ADD_PRODUCT_TO_INVENTORY = `
  mutation AddProductToInventory(
    $productId: Int!
    $storeId: Int!
    $price: Float!
    $quantity: Int!
    $measurement: Int
    $unit: String
  ) {
    addProductToInventory(
      productId: $productId
      storeId: $storeId
      price: $price
      quantity: $quantity
      measurement: $measurement
      unit: $unit
    ) {
      id
      measurement
      price
      productId
      quantity
      storeId
      unit
    }
  }
`;

export const GET_STORE_WITH_INVENTORY = `
  query GetStoreWithInventory($managerId: Int!) {
    storesByManager(managerUserId: $managerId) {
      id
      name
      address
      radius
      inventory {
        edges {
          node {
            id
            quantity
            price
            unit
            measurement
            updatedAt
            product {
              id
              name
              description
              category {
                id
                name
              }
              image
            }
          }
        }
      }
    }
    products {
      id
      name
      description
      category {
        id
        name
      }
    }
  }
`;

export const GET_ALL_STORES = `
  query GetAllStores {
    stores {
      id
      name
      address
      radius
    }
  }
`;

// Add this to your js/src/queries/operations.js file

export const GET_STORE_PRODUCTS = `
  query GetStoreProducts($storeId: Int!) {
    store(storeId: $storeId) {
      inventory {
        edges {
          node {
            id
            measurement
            price
            productId
            quantity
            unit
            updatedAt
            product {
              id
              name
              image
              description
              category {
                id
                name
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_STORES = `
  query GetStores {
    stores {
      id
      name
      address
      managerUserId
      drivers {
        edges {
          node {
            driver {
              active
              id
              email
              mobile
              referredBy
              type
            }
          }
        }
      }
    }
  }
`;

// Product queries
export const GET_PRODUCTS = `
  query GetProducts {
    products {
      id
      name
      description
      categoryId
      image
      inventoryItems {
        edges {
          node {
            id
          }
        }
      }
    }
  }
`;

export const CREATE_PRODUCT = `
  mutation CreateProduct($name: String!, $description: String!, $categoryId: Int!) {
    createProduct(name: $name, description: $description, categoryId: $categoryId) {
      id
      name
      description
      categoryId
      image
    }
  }
`;

export const UPDATE_PRODUCT = `
  mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      description
      categoryId
      image
    }
  }
`;

export const DELETE_PRODUCT = `
  mutation DeleteProduct($productId: Int!) {
    deleteProduct(productId: $productId)
  }
`;

export const ASSIGN_DRIVER_TO_STORE = `
  mutation AssignDriverToStore($storeId: Int!, $userId: Int!) {
    assignDriverToStore(storeId: $storeId, userId: $userId) {
      id
      userId
      store {
        name
        drivers {
          edges {
            node {
              driver {
                email
              }
            }
          }
        }
      }
    }
  }
`;
