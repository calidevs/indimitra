import strawberry
from typing import List, Optional
from app.db.session import get_db
from app.db.models.payment_onboarding import PaymentOnboardingModel, PaymentOnboardingStatus, PaymentMethod
from app.db.models.store import StoreModel
from sqlalchemy.orm import Session


@strawberry.type
class PaymentOnboardingStore:
    """Store information for payment onboarding"""
    id: int
    name: str


@strawberry.type
class PaymentOnboarding:
    id: int
    store: PaymentOnboardingStore
    status: PaymentOnboardingStatus
    paymentMethod: PaymentMethod
    accountDetails: Optional[strawberry.scalars.JSON] = None
    documents: Optional[strawberry.scalars.JSON] = None
    createdAt: str
    updatedAt: str


@strawberry.input
class AccountDetailsInput:
    accountName: str
    accountNumber: str
    bankName: str
    ifscCode: Optional[str] = None
    routingNumber: Optional[str] = None
    swiftCode: Optional[str] = None


@strawberry.input
class CreatePaymentOnboardingInput:
    storeId: int
    paymentMethod: PaymentMethod
    accountDetails: Optional[strawberry.scalars.JSON] = None
    documents: Optional[List[str]] = None


@strawberry.input
class UpdatePaymentOnboardingInput:
    storeId: Optional[int] = None
    status: Optional[PaymentOnboardingStatus] = None
    paymentMethod: Optional[PaymentMethod] = None
    accountDetails: Optional[strawberry.scalars.JSON] = None
    documents: Optional[List[str]] = None


def get_payment_onboarding_list(status: Optional[str] = None, search_term: Optional[str] = None) -> List[PaymentOnboarding]:
    db: Session = next(get_db())
    try:
        query = db.query(PaymentOnboardingModel).join(StoreModel)

        # Filter by status if provided
        if status:
            query = query.filter(PaymentOnboardingModel.status == status)

        # Filter by search term (store name) if provided
        if search_term:
            query = query.filter(StoreModel.name.ilike(f"%{search_term}%"))

        onboarding_list = query.all()

        return [
            PaymentOnboarding(
                id=onboarding.id,
                store=PaymentOnboardingStore(id=onboarding.store.id, name=onboarding.store.name),
                status=onboarding.status,
                paymentMethod=onboarding.paymentMethod,
                accountDetails=onboarding.accountDetails,
                documents=onboarding.documents,
                createdAt=onboarding.createdAt.isoformat() if onboarding.createdAt else "",
                updatedAt=onboarding.updatedAt.isoformat() if onboarding.updatedAt else ""
            )
            for onboarding in onboarding_list
        ]
    finally:
        db.close()


def create_payment_onboarding(input: CreatePaymentOnboardingInput) -> PaymentOnboarding:
    db: Session = next(get_db())
    try:
        # Create new payment onboarding
        new_onboarding = PaymentOnboardingModel(
            storeId=input.storeId,
            status=PaymentOnboardingStatus.PENDING,
            paymentMethod=input.paymentMethod,
            accountDetails=input.accountDetails,
            documents=input.documents or []
        )

        db.add(new_onboarding)
        db.commit()
        db.refresh(new_onboarding)

        return PaymentOnboarding(
            id=new_onboarding.id,
            store=PaymentOnboardingStore(id=new_onboarding.store.id, name=new_onboarding.store.name),
            status=new_onboarding.status,
            paymentMethod=new_onboarding.paymentMethod,
            accountDetails=new_onboarding.accountDetails,
            documents=new_onboarding.documents,
            createdAt=new_onboarding.createdAt.isoformat() if new_onboarding.createdAt else "",
            updatedAt=new_onboarding.updatedAt.isoformat() if new_onboarding.updatedAt else ""
        )
    finally:
        db.close()


def update_payment_onboarding(id: int, input: UpdatePaymentOnboardingInput) -> PaymentOnboarding:
    db: Session = next(get_db())
    try:
        onboarding = db.query(PaymentOnboardingModel).filter(PaymentOnboardingModel.id == id).first()

        if not onboarding:
            raise Exception(f"Payment onboarding with id {id} not found")

        # Update fields if provided
        if input.storeId is not None:
            onboarding.storeId = input.storeId
        if input.status is not None:
            onboarding.status = input.status
        if input.paymentMethod is not None:
            onboarding.paymentMethod = input.paymentMethod
        if input.accountDetails is not None:
            onboarding.accountDetails = input.accountDetails
        if input.documents is not None:
            onboarding.documents = input.documents

        db.commit()
        db.refresh(onboarding)

        return PaymentOnboarding(
            id=onboarding.id,
            store=PaymentOnboardingStore(id=onboarding.store.id, name=onboarding.store.name),
            status=onboarding.status,
            paymentMethod=onboarding.paymentMethod,
            accountDetails=onboarding.accountDetails,
            documents=onboarding.documents,
            createdAt=onboarding.createdAt.isoformat() if onboarding.createdAt else "",
            updatedAt=onboarding.updatedAt.isoformat() if onboarding.updatedAt else ""
        )
    finally:
        db.close()


def delete_payment_onboarding(id: int) -> bool:
    db: Session = next(get_db())
    try:
        onboarding = db.query(PaymentOnboardingModel).filter(PaymentOnboardingModel.id == id).first()

        if not onboarding:
            raise Exception(f"Payment onboarding with id {id} not found")

        db.delete(onboarding)
        db.commit()

        return True
    finally:
        db.close()


@strawberry.type
class PaymentOnboardingQuery:
    @strawberry.field
    def paymentOnboarding(self, status: Optional[str] = None, searchTerm: Optional[str] = None) -> List[PaymentOnboarding]:
        return get_payment_onboarding_list(status, searchTerm)


@strawberry.type
class PaymentOnboardingMutation:
    @strawberry.mutation
    def createPaymentOnboarding(self, input: CreatePaymentOnboardingInput) -> PaymentOnboarding:
        return create_payment_onboarding(input)

    @strawberry.mutation
    def updatePaymentOnboarding(self, id: int, input: UpdatePaymentOnboardingInput) -> PaymentOnboarding:
        return update_payment_onboarding(id, input)

    @strawberry.mutation
    def deletePaymentOnboarding(self, id: int) -> bool:
        return delete_payment_onboarding(id)
