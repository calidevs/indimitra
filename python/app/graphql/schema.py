import strawberry
from app.graphql.types import mapper
from app.graphql.resolvers.user_resolver import UserQuery, UserMutation
from app.graphql.resolvers.product_resolver import ProductQuery, ProductMutation
from app.graphql.resolvers.order_resolver import OrderQuery, OrderMutation
from app.graphql.resolvers.delivery_resolver import DeliveryQuery, DeliveryMutation

@strawberry.type
class Query(UserQuery, ProductQuery, OrderQuery, DeliveryQuery):
    pass

@strawberry.type
class Mutation(UserMutation, ProductMutation, OrderMutation, DeliveryMutation):
    pass

# Finalize the mapper so that all decorated types are registered.
mapper.finalize()

# Build the schema and include all mapped types.
schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    types=list(mapper.mapped_types.values())
)
