import strawberry
from strawberry_sqlalchemy_mapper import StrawberrySQLAlchemyMapper
from app.db import models
from typing import List, Optional
from datetime import datetime
from sqlalchemy import inspect as sa_inspect
from app.db.models.order import OrderStatus
from app.db.models.fees import FeeType
from strawberry.scalars import JSON
from app.db.custom_types.encrypted import EncryptedType
from sqlalchemy.sql.sqltypes import LargeBinary

# Create a single mapper instance.
#
# We register every mapped strawberry type below under a stripped name (e.g.
# `class MeatCut` for `MeatCutModel`). The auto-mapper, however, looks types up
# by `model.__name__` (`"MeatCutModel"`), so without an override it would fail
# to find our hand-mapped types, then silently auto-generate duplicates like
# `MeatCutModelConnection` that bypass our overrides.
#
# This map must contain every model that has a `@mapper.type(...)` declaration
# below. Models NOT in this list (e.g. `PickupAddressModel`, `FeesModel`,
# `PaymentModel`) keep their original `*Model` names so they don't collide
# with the hand-written `@strawberry.type` classes that already exist for them.
_MAPPED_MODEL_TYPE_NAMES = {
    "UserModel": "User",
    "ProductModel": "Product",
    "CategoryModel": "Category",
    "OrderModel": "Order",
    "DeliveryModel": "Delivery",
    "OrderItemModel": "OrderItem",
    "AddressModel": "Address",
    "MeatCutModel": "MeatCut",
    "InventoryModel": "Inventory",
    "StoreModel": "Store",
    "StoreDriverModel": "StoreDriver",
    "StoreLocationCodeModel": "StoreLocationCode",
}


def _model_to_type_name(model):
    return _MAPPED_MODEL_TYPE_NAMES.get(model.__name__, model.__name__)


mapper = StrawberrySQLAlchemyMapper(model_to_type_name=_model_to_type_name)

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

@mapper.type(models.MeatCutModel)
class MeatCut:
    pass

@mapper.type(models.InventoryModel)
class Inventory:
    # Exclude `cut_types` from the auto-generated mapping. The strawberry-sqlalchemy-mapper
    # dataloader has a known bug with many-to-many relationships through a secondary
    # table: it tries to read the secondary column (e.g. `inventory_id`) directly off
    # the related model, raising "'MeatCutModel' object has no attribute 'inventory_id'".
    # We provide our own resolver below that returns a flat list of MeatCut.
    __exclude__ = ("cut_types",)

    @strawberry.field
    def cut_types(self) -> List["MeatCut"]:
        # If the relationship is already eager-loaded (e.g. via selectinload in the
        # service layer), return the cached collection without an extra query.
        try:
            state = sa_inspect(self)
            if "cut_types" not in state.unloaded:
                return list(getattr(self, "cut_types", []) or [])
        except Exception:
            pass

        # Fallback: load directly from the join table.
        from app.db.session import SessionLocal
        from app.db.models.meat_cut import MeatCutModel, inventory_meat_cuts

        db = SessionLocal()
        try:
            return (
                db.query(MeatCutModel)
                .join(
                    inventory_meat_cuts,
                    MeatCutModel.id == inventory_meat_cuts.c.meat_cut_id,
                )
                .filter(inventory_meat_cuts.c.inventory_id == self.id)
                .all()
            )
        finally:
            db.close()

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
