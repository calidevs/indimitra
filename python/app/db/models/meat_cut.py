from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.db.base import Base


inventory_meat_cuts = Table(
    'inventory_meat_cuts',
    Base.metadata,
    Column('inventory_id', Integer, ForeignKey('inventory.id', ondelete='CASCADE'), primary_key=True),
    Column('meat_cut_id', Integer, ForeignKey('meat_cuts.id', ondelete='CASCADE'), primary_key=True),
)


class MeatCutModel(Base):
    __tablename__ = 'meat_cuts'

    id = Column(Integer, primary_key=True, index=True)
    label = Column(String, nullable=False)
    text = Column(String, nullable=False)

    inventories = relationship("InventoryModel", secondary=inventory_meat_cuts, back_populates="cut_types")
