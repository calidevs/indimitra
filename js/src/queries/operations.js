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
    $userId: String!,
    $address: String!,
    $productItems: [OrderItemInput!]!
  ) {
    createOrder(userId: $userId, address: $address, productItems: $productItems) {
      id
      createdByUserId
      address
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
  query GetUserOrders($userId: String!) {
    getOrdersByUser(userId: $userId) {
      id
      address
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
    address
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
    firstName
    lastName
    email
    type
  }
}`;

export const UPDATE_ORDER_STATUS = `
  mutation UpdateOrderStatus($orderId: Int!, $status: String!, $driverId: String, $scheduleTime: DateTime) {
    updateOrderStatus(input: { 
      orderId: $orderId, 
      status: $status, 
      driverId: $driverId, 
      scheduleTime: $scheduleTime 
    }) {
      id
      status
    }
  }
`;

export const GET_DELIVERIES_BY_DRIVER = `
  query GetDeliveriesByDriver($driverId: String!) {
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
      firstName
      lastName
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
  query GetAddressesByUser($userId: String!) {
    getAddressesByUser(userId: $userId) {
      id
      address
      isPrimary
    }
  }
`;

export const CREATE_ADDRESS = `
  mutation CreateAddress($address: String!, $userId: String!, $isPrimary: Boolean) {
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
