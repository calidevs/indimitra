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
