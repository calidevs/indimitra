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
    $productItems: [OrderItemInput!]!
  ) {
    createOrder(userId: $userId, addressId: $addressId, productItems: $productItems) {
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
              name
              price
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
          product {
            name
            price
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
  mutation UpdateOrderStatus($orderId: Int!, $status: String!, $driverId: Int, $scheduleTime: DateTime) {
    updateOrderStatus(input: { 
      orderId: $orderId, 
      status: $status, 
      driverId: $driverId, 
      scheduleTime: $scheduleTime
    }) {
      id
      status
      deliveryDate
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
    }
  }
`;

export const GET_USER_PROFILE = `
  query GetUserProfile($userId: String!) {
    getUserProfile(userId: $userId) {
      id
      email
      mobile
      active
      type
      referralId
    }
  }
`;

export const CANCEL_ORDER = `
  mutation CancelOrder($orderId: Int!) {
    cancelOrderById(orderId: $orderId) {
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
    getStoreByManager(managerId: $managerId) {
      id
      name
      address
      radius
    }
  }
`;

export const GET_STORE_INVENTORY = `
  query GetStoreInventory($storeId: Int!) {
    getStoreInventory(storeId: $storeId) {
      id
      quantity
      price
      size
      measurement_unit
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
  mutation AddProductToInventory($storeId: Int!, $productId: Int!, $price: Float!, $quantity: Int!, $size: Float, $measurement_unit: Int) {
    addProductToInventory(storeId: $storeId, productId: $productId, price: $price, quantity: $quantity, size: $size, measurement_unit: $measurement_unit) {
      id
      price
      quantity
    }
  }
`;
