const fetchGraphQL = async (query) => {
  const response = await fetch(`http://localhost:8000/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const { data } = await response.json();
  return data;
};

export default fetchGraphQL;
