import strawberry
from typing import Optional
from app.services.notification_service import NotificationService

@strawberry.type
class NotificationResponse:
    success: bool
    title: str
    message: str

@strawberry.type
class NotificationMutation:
    @strawberry.mutation
    async def send_test_notification(
        self, 
        title: str, 
        message: str
    ) -> NotificationResponse:
        """
        Send a test push notification
        This is just for testing PWA notifications
        """
        notification_service = NotificationService()
        result = await notification_service.send_test_notification(title, message)
        
        return NotificationResponse(
            success=result["success"],
            title=result["title"],
            message=result["message"]
        )
