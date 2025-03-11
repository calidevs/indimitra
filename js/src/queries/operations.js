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
