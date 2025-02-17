import strawberry
from app.graphql.resolvers.product_resolver import Query, Mutation

schema = strawberry.Schema(query=Query, mutation=Mutation)
