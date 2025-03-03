import strawberry
from strawberry_sqlalchemy_mapper import StrawberrySQLAlchemyMapper
from app.db import models

# Create a single mapper instance.
mapper = StrawberrySQLAlchemyMapper()

# Generate a GraphQL type for UserModel.
@mapper.type(models.UserModel)
class User:
    pass

# Generate a GraphQL type for ProductModel.
@mapper.type(models.ProductModel)
class Product:
    pass
