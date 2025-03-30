import strawberry
from typing import List, Optional

from app.graphql.types import StoreDriver, User, Store
from app.services.store_driver_service import (
    get_store_drivers,
    get_driver_stores,
    assign_driver_to_store,
    remove_driver_from_store
)

@strawberry.type
class StoreDriverQuery:
    @strawberry.field
    def getStoreDrivers(self, storeId: int) -> List[StoreDriver]:
        """
        Get all drivers assigned to a specific store
        
        Args:
            storeId: Store ID to get drivers for
            
        Returns:
            List of StoreDriver objects with driver information
        """
        return get_store_drivers(store_id=storeId)
    
    @strawberry.field
    def getDriverStores(self, userId: int) -> List[StoreDriver]:
        """
        Get all stores a specific driver is assigned to
        
        Args:
            userId: User ID of the driver
            
        Returns:
            List of StoreDriver objects with store information
        """
        return get_driver_stores(user_id=userId)

@strawberry.type
class StoreDriverMutation:
    @strawberry.mutation
    def assignDriverToStore(self, userId: int, storeId: int) -> Optional[StoreDriver]:
        """
        Assign a delivery driver to a store
        
        Args:
            userId: User ID of the driver
            storeId: Store ID to assign the driver to
            
        Returns:
            StoreDriver if successful, None if the user is not a delivery driver
            or the store doesn't exist
        """
        try:
            return assign_driver_to_store(user_id=userId, store_id=storeId)
        except ValueError as e:
            raise ValueError(str(e))
    
    @strawberry.mutation
    def removeDriverFromStore(self, userId: int, storeId: int) -> bool:
        """
        Remove a driver's assignment from a store
        
        Args:
            userId: User ID of the driver
            storeId: Store ID to remove the driver from
            
        Returns:
            True if successful, False if the assignment doesn't exist
        """
        return remove_driver_from_store(user_id=userId, store_id=storeId) 