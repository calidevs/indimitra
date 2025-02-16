import graphQLClient from './graphqlClient';

const fetchGraphQL = async (query, variables = {}) => {
  return graphQLClient.request(query, variables);
};

export default fetchGraphQL;
