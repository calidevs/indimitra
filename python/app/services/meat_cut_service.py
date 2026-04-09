from typing import List, Optional
from sqlalchemy.exc import IntegrityError
from app.db.session import SessionLocal
from app.db.models.meat_cut import MeatCutModel


def get_all_meat_cuts() -> List[MeatCutModel]:
    """Get all meat cuts"""
    db = SessionLocal()
    try:
        return db.query(MeatCutModel).all()
    finally:
        db.close()


def get_meat_cut_by_id(meat_cut_id: int) -> Optional[MeatCutModel]:
    """Get a meat cut by ID"""
    db = SessionLocal()
    try:
        return db.query(MeatCutModel).filter(MeatCutModel.id == meat_cut_id).first()
    finally:
        db.close()


def create_meat_cut(label: str, text: str) -> MeatCutModel:
    """
    Create a new meat cut

    Raises:
        ValueError: If a meat cut with the same label already exists
    """
    db = SessionLocal()
    try:
        existing = db.query(MeatCutModel).filter(MeatCutModel.label == label).first()
        if existing:
            raise ValueError(f"Meat cut with label '{label}' already exists")

        meat_cut = MeatCutModel(label=label, text=text)
        db.add(meat_cut)
        db.commit()
        db.refresh(meat_cut)
        return meat_cut
    except IntegrityError:
        db.rollback()
        raise ValueError("Failed to create meat cut - database integrity error")
    finally:
        db.close()


def update_meat_cut(meat_cut_id: int, label: str, text: str) -> Optional[MeatCutModel]:
    """
    Update an existing meat cut

    Raises:
        ValueError: If another meat cut with the same label already exists
    """
    db = SessionLocal()
    try:
        meat_cut = db.query(MeatCutModel).filter(MeatCutModel.id == meat_cut_id).first()
        if not meat_cut:
            return None

        existing = db.query(MeatCutModel).filter(
            MeatCutModel.label == label,
            MeatCutModel.id != meat_cut_id,
        ).first()
        if existing:
            raise ValueError(f"Another meat cut with label '{label}' already exists")

        meat_cut.label = label
        meat_cut.text = text
        db.commit()
        db.refresh(meat_cut)
        return meat_cut
    except IntegrityError:
        db.rollback()
        raise ValueError("Failed to update meat cut - database integrity error")
    finally:
        db.close()


def delete_meat_cut(meat_cut_id: int) -> bool:
    """
    Delete a meat cut

    Raises:
        ValueError: If meat cut has associated inventories and cannot be deleted
    """
    db = SessionLocal()
    try:
        meat_cut = db.query(MeatCutModel).filter(MeatCutModel.id == meat_cut_id).first()
        if not meat_cut:
            return False

        if meat_cut.inventories and len(meat_cut.inventories) > 0:
            raise ValueError(
                f"Cannot delete meat cut with ID {meat_cut_id} because it is associated with inventories"
            )

        db.delete(meat_cut)
        db.commit()
        return True
    except IntegrityError:
        db.rollback()
        raise ValueError("Failed to delete meat cut - database integrity error")
    finally:
        db.close()
