import strawberry
from typing import Optional
from strawberry.scalars import JSON
from app.services.cart_service import save_cart, get_saved_cart, delete_saved_cart


@strawberry.type
class SavedCart:
    id: int
    userId: int
    storeId: int
    cartData: JSON
    updatedAt: str


@strawberry.type
class CartQuery:
    @strawberry.field
    def get_saved_cart(self, user_id: int, store_id: int) -> Optional[SavedCart]:
        cart = get_saved_cart(user_id, store_id)
        if not cart:
            return None
        return SavedCart(
            id=cart.id,
            userId=cart.userId,
            storeId=cart.storeId,
            cartData=cart.cartData,
            updatedAt=cart.updatedAt.isoformat() if cart.updatedAt else ""
        )


@strawberry.type
class CartMutation:
    @strawberry.mutation
    def save_cart(self, user_id: int, store_id: int, cart_data: JSON) -> SavedCart:
        cart = save_cart(user_id, store_id, cart_data)
        return SavedCart(
            id=cart.id,
            userId=cart.userId,
            storeId=cart.storeId,
            cartData=cart.cartData,
            updatedAt=cart.updatedAt.isoformat() if cart.updatedAt else ""
        )

    @strawberry.mutation
    def delete_saved_cart(self, user_id: int, store_id: int) -> bool:
        return delete_saved_cart(user_id, store_id)
