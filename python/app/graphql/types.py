import strawberry
from strawberry_sqlalchemy_mapper import StrawberrySQLAlchemyMapper
from app.db import models
from typing import Optional, Union
from datetime import datetime
from app.db.models.order import OrderStatus

# Create a single mapper instance.
mapper = StrawberrySQLAlchemyMapper()

# Generate a GraphQL type for UserModel.
@mapper.type(models.UserModel)
class User:
    pass

# Generate a GraphQL type for ProductModel
@mapper.type(models.ProductModel)
class Product:
    @strawberry.field
    def image(self) -> Optional[str]:
        """Get the product image URL"""
        return self.image if hasattr(self, 'image') else None

# Generate a GraphQL type for CategoryModel
@mapper.type(models.CategoryModel)
class Category:
    pass

# Generate a GraphQL type for OrderModel
@mapper.type(models.OrderModel)
class Order:
    pass

# Generate a GraphQL type for DeliveryModel with computed schedule field
@mapper.type(models.DeliveryModel) 
class Delivery:
    @strawberry.field
    def schedule(self) -> Optional[datetime]:
        """
        Get the schedule time from the related order's deliveryDate.
        This maintains backward compatibility with clients expecting a schedule field.
        """
        if hasattr(self, 'order') and self.order and self.order.deliveryDate:
            return self.order.deliveryDate
        return None
        
    @strawberry.field
    def status(self) -> Optional[OrderStatus]:
        """
        Get the status from the related order.
        This maintains backward compatibility with clients expecting a status field on delivery.
        """
        if hasattr(self, 'order') and self.order:
            return self.order.status
        return None

# Generate a GraphQL type for OrderItemModel
@mapper.type(models.OrderItemModel)
class OrderItem:
    pass

# Generate a GraphQL type for AddressModel
@mapper.type(models.AddressModel)
class Address:
    pass

@mapper.type(models.InventoryModel)
class Inventory:
    pass

@mapper.type(models.StoreModel)
class Store:
    pass

@mapper.type(models.StoreDriverModel)
class StoreDriver:
    pass
