from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.models.product import ProductModel
from app.api.dependencies import get_db

router = APIRouter()

@router.get("/products")
def read_products(db: Session = Depends(get_db)):
    products = db.query(ProductModel).all()
    return products