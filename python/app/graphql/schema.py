import strawberry
from strawberry.extensions import QueryDepthLimiter, MaxAliasesLimiter
from app.graphql.types import mapper, DashboardStats, OrderStats
from app.graphql.resolvers.user_resolver import UserQuery, UserMutation
from app.graphql.resolvers.product_resolver import ProductQuery, ProductMutation
from app.graphql.resolvers.order_resolver import OrderQuery, OrderMutation
from app.graphql.resolvers.delivery_resolver import DeliveryQuery, DeliveryMutation
from app.graphql.resolvers.order_resolver import OrderItemInput
from app.graphql.resolvers.address_resolver import AddressQuery, AddressMutation
from app.graphql.resolvers.inventory_resolver import InventoryQuery, InventoryMutation
from app.graphql.resolvers.store_resolver import StoreQuery, StoreMutation
from app.graphql.resolvers.store_driver_resolver import StoreDriverQuery, StoreDriverMutation
from app.graphql.resolvers.category_resolver import CategoryQuery, CategoryMutation
from app.graphql.resolvers.store_location_code_resolver import StoreLocationCodeQuery, StoreLocationCodeMutation
from app.graphql.resolvers.pickup_address_resolver import PickupAddressQuery, PickupAddressMutation
from app.graphql.resolvers.fee_resolver import FeeQuery, FeeMutation
from app.graphql.resolvers.payment_onboarding_resolver import PaymentOnboardingQuery, PaymentOnboardingMutation
from app.graphql.resolvers.square_credential_resolver import SquareCredentialQuery, SquareCredentialMutation
from app.graphql.resolvers.cart_resolver import CartQuery, CartMutation


@strawberry.type
class Query(
    UserQuery,
    ProductQuery,
    OrderQuery,
    DeliveryQuery,
    AddressQuery,
    InventoryQuery,
    StoreQuery,
    StoreDriverQuery,
    CategoryQuery,
    StoreLocationCodeQuery,
    PickupAddressQuery,
    FeeQuery,
    PaymentOnboardingQuery,
    SquareCredentialQuery,
    CartQuery
):
    pass

@strawberry.type
class Mutation(
    UserMutation,
    ProductMutation,
    OrderMutation,
    DeliveryMutation,
    AddressMutation,
    InventoryMutation,
    StoreMutation,
    StoreDriverMutation,
    CategoryMutation,
    StoreLocationCodeMutation,
    PickupAddressMutation,
    FeeMutation,
    PaymentOnboardingMutation,
    SquareCredentialMutation,
    CartMutation
):
    pass

# Finalize the mapper so that all decorated types are registered.
mapper.finalize()

# Build the schema with security extensions to prevent GraphQL DoS attacks
schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    types=[OrderItemInput, DashboardStats, OrderStats] + list(mapper.mapped_types.values()),
    extensions=[
        QueryDepthLimiter(max_depth=10),  # Prevent deeply nested queries (test query has 10 levels)
        MaxAliasesLimiter(max_alias_count=15)  # Prevent alias-based DoS attacks
    ]
)

