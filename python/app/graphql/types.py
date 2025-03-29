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

# Generate a GraphQL type for OrderModel.
@mapper.type(models.OrderModel)
class Order:
    pass

# Generate a GraphQL type for OrderItemModel.
@mapper.type(models.OrderItemModel)
class OrderItem:
    pass


@mapper.type(models.DeliveryModel) 
class Delivery:
    pass

@mapper.type(models.AddressModel)
class Address:
    pass
