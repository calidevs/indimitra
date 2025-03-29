import strawberry
from typing import List
from app.graphql.types import Address
from app.services.address_service import (
    create_address,
    get_addresses_by_user,
    update_address,
    delete_address
)


@strawberry.type
class AddressQuery:
    @strawberry.field
    def get_addresses_by_user(self, user_id: str) -> List[Address]:
        return get_addresses_by_user(user_id)


@strawberry.type
class AddressMutation:
    @strawberry.mutation
    def create_address(
        self,
        address: str,
        user_id: str,
        is_primary: bool = False
    ) -> Address:
        return create_address(address, user_id, is_primary)

    @strawberry.mutation
    def update_address(
        self,
        address_id: int,
        address: str = None,
        is_primary: bool = None
    ) -> Address:
        updated = update_address(address_id, address, is_primary)
        if not updated:
            raise Exception("Address not found.")
        return updated

    @strawberry.mutation
    def delete_address(self, address_id: int) -> bool:
        return delete_address(address_id)
