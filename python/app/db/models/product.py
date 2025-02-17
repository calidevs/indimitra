from sqlalchemy import Column, Integer, String, Float
from app.db.base import Base

class ProductModel(Base):
    __tablename__ = 'products'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String)
    price = Column(Float)
    description = Column(String)
    category = Column(String)
