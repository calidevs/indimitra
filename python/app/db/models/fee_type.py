from enum import Enum

class FeeType(str, Enum):
    """Enum for order types"""
    DELIVERY = "DELIVERY"
    PICKUP = "PICKUP" 