from typing import List, Optional
from app.db.session import SessionLocal
from app.db.models.fees import FeesModel
from app.db.models.fees import FeeType

def create_fee(store_id: int, fee_rate: float, fee_currency: str, type: str, limit: Optional[float] = None) -> FeesModel:
    """
    Create a new fee for a store.
    
    Args:
        store_id: ID of the store
        fee_rate: Rate of the fee
        fee_currency: Currency of the fee
        type: Type of fee ('delivery' or 'pickup')
        limit: Optional limit for the fee
        
    Returns:
        The created FeesModel instance
    """
    print('type', type)
    if type not in [fee_type.value for fee_type in FeeType]:
        raise ValueError("Fee type must be either 'DELIVERY' or 'PICKUP'")
        
    db = SessionLocal()
    try:
        fee = FeesModel(
            store_id=store_id,
            fee_rate=fee_rate,
            fee_currency=fee_currency,
            type=type,
            limit=limit
        )
        db.add(fee)
        db.commit()
        db.refresh(fee)
        return fee
    finally:
        db.close()

def update_fee(id: int, fee_rate: Optional[float] = None, fee_currency: Optional[str] = None, 
               type: Optional[str] = None, limit: Optional[float] = None) -> Optional[FeesModel]:
    """
    Update an existing fee.
    
    Args:
        id: ID of the fee to update
        fee_rate: New fee rate (optional)
        fee_currency: New fee currency (optional)
        type: New fee type (optional)
        limit: New fee limit (optional)
        
    Returns:
        The updated FeesModel instance, or None if not found
    """
    if type is not None and type not in [fee_type.value for fee_type in FeeType]:
        raise ValueError("Fee type must be either 'DELIVERY' or 'PICKUP'")
        
    db = SessionLocal()
    try:
        fee = db.query(FeesModel).filter(FeesModel.id == id).first()
        if not fee:
            return None
            
        if fee_rate is not None:
            fee.fee_rate = fee_rate
        if fee_currency is not None:
            fee.fee_currency = fee_currency
        if type is not None:
            fee.type = type
        if limit is not None:
            fee.limit = limit
            
        db.commit()
        db.refresh(fee)
        return fee
    finally:
        db.close()

def delete_fee(id: int) -> bool:
    """
    Delete a fee.
    
    Args:
        id: ID of the fee to delete
        
    Returns:
        True if deleted successfully, False if not found
    """
    db = SessionLocal()
    try:
        fee = db.query(FeesModel).filter(FeesModel.id == id).first()
        if not fee:
            return False
            
        db.delete(fee)
        db.commit()
        return True
    finally:
        db.close()

def get_fees_by_store(store_id: int) -> List[FeesModel]:
    """
    Get all fees for a specific store.
    
    Args:
        store_id: ID of the store
        
    Returns:
        List of FeesModel instances for the store
    """
    db = SessionLocal()
    try:
        return db.query(FeesModel).filter(FeesModel.store_id == store_id).all()
    finally:
        db.close() 