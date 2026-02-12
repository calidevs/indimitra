import strawberry
from strawberry_sqlalchemy_mapper import StrawberrySQLAlchemyMapper
from app.db import models
from typing import Optional
from datetime import datetime
from app.db.models.order import OrderStatus
from app.db.models.fees import FeeType
from strawberry.scalars import JSON
from app.db.custom_types.encrypted import EncryptedType
from sqlalchemy.sql.sqltypes import LargeBinary

# Create a single mapper instance.
mapper = StrawberrySQLAlchemyMapper()

# Register EncryptedType to be skipped by the mapper
# These columns contain sensitive data and should never be exposed via GraphQL
# Use the same sentinel value that's used for LargeBinary
SkipTypeSentinel = mapper.sqlalchemy_type_to_strawberry_type_map[LargeBinary]
mapper.sqlalchemy_type_to_strawberry_type_map[EncryptedType] = SkipTypeSentinel

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
    # EncryptedType columns (square_access_token, square_refresh_token, etc.)
    # are automatically skipped by the mapper configuration above
    pass

@mapper.type(models.StoreDriverModel)
class StoreDriver:
    pass

# Generate a GraphQL type for StoreLocationCodeModel
@mapper.type(models.StoreLocationCodeModel)
class StoreLocationCode:
    pass

@strawberry.type
class PickupAddress:
    """GraphQL type for store pickup addresses"""
    id: int
    store_id: int
    address: str

    @classmethod
    def from_db(cls, model):
        return cls(
            id=model.id,
            store_id=model.store_id,
            address=model.address
        )

@strawberry.type
class Fee:
    """GraphQL type for store fees"""
    id: int
    store_id: int
    fee_rate: float
    fee_currency: str
    type: FeeType
    limit: Optional[float]

    @classmethod
    def from_db(cls, model):
        return cls(
            id=model.id,
            store_id=model.store_id,
            fee_rate=model.fee_rate,
            fee_currency=model.fee_currency,
            type=model.type,
            limit=model.limit
        )

@strawberry.type
class DashboardStats:
    """GraphQL type for dashboard statistics"""
    total_users: int
    active_users: int
    delivery_agents: int
    users_by_type: JSON

@strawberry.type
class OrderStats:
    """GraphQL type for order statistics"""
    total_orders: int
    recent_orders: int
    orders_by_status: JSON
    orders_by_type: JSON

@strawberry.type
class Payment:
    """GraphQL type for Payment model"""
    id: int
    type: str
    square_payment_id: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    status: Optional[str] = None
    receipt_url: Optional[str] = None
