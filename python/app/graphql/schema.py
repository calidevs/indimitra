import strawberry
from app.graphql.resolvers.product_resolver import Query as ProductQuery, Mutation as ProductMutation
from app.graphql.resolvers.user_resolver import Query as UserQuery, Mutation as UserMutation

# TODO: Find a better way to add resolvers to the schema
@strawberry.type
class Query(ProductQuery, UserQuery):
    pass

@strawberry.type
class Mutation(ProductMutation, UserMutation):
    pass

schema = strawberry.Schema(query=Query, mutation=Mutation)
