import strawberry
from app.graphql.types import mapper
from app.graphql.resolvers.user_resolver import UserQuery, UserMutation
from app.graphql.resolvers.product_resolver import ProductQuery, ProductMutation

@strawberry.type
class Query(UserQuery, ProductQuery):
    pass

@strawberry.type
class Mutation(UserMutation, ProductMutation):
    pass

# Finalize the mapper so that all decorated types are registered.
mapper.finalize()

# Build the schema and include all mapped types.
schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    types=list(mapper.mapped_types.values())
)
