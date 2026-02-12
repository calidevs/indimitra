from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    def __init__(self):
        self.sg = SendGridAPIClient(os.getenv('SENDGRID_API_KEY'))
        self.from_email = Email(os.getenv('FROM_EMAIL', 'noreply@indimitra.com'))

    def send_order_status_update(self, to_email: str, order_id: str, status: str) -> bool:
        """
        Send an email notification when order status changes
        
        Args:
            to_email (str): Recipient's email address
            order_id (str): Order ID
            status (str): New order status (Accepted/Pickedup/Delivered/Cancelled)
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        try:
            status_messages = {
                'Accepted': 'Your order has been accepted and is being prepared.',
                'Pickedup': 'Your order has been picked up and is on its way.',
                'Delivered': 'Your order has been delivered successfully.',
                'Cancelled': 'Your order has been cancelled.'
            }

            subject = f"Order Status Update - {status}"
            message = f"Dear Customer,\n\n"
            message += f"Your order #{order_id} status has been updated to: {status}\n"
            message += f"{status_messages.get(status, '')}\n\n"
            message += "Thank you for choosing Indimitra!\n"
            message += "Best regards,\nIndimitra Team"

            to_email_obj = To(to_email)
            content = Content("text/plain", message)
            mail = Mail(self.from_email, to_email_obj, subject, content)

            response = self.sg.send(mail)
            return response.status_code == 202

        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return False

    def send_order_confirmation_with_payment(
        self,
        to_email: str,
        order_id: str,
        display_code: str,
        order_total: float,
        payment_id: str,
        payment_amount: float,
        receipt_url: Optional[str] = None,
        order_type: str = "delivery",
        store_name: str = "Indimitra"
    ) -> bool:
        """
        Send order confirmation email with payment details.

        Args:
            to_email: Customer's email address
            order_id: Internal order ID
            display_code: Order display code (shown to customer)
            order_total: Total order amount
            payment_id: Square payment ID (last 8 chars shown to customer)
            payment_amount: Amount charged
            receipt_url: Link to Square receipt (optional)
            order_type: "delivery" or "pickup"
            store_name: Name of the store

        Returns:
            bool: True if email was sent successfully
        """
        try:
            # Mask payment ID for display (show last 8 characters)
            masked_payment_id = f"...{payment_id[-8:]}" if len(payment_id) > 8 else payment_id

            subject = f"Order Confirmation - {display_code}"

            message = f"Dear Customer,\n\n"
            message += f"Thank you for your order from {store_name}!\n\n"
            message += f"ORDER DETAILS\n"
            message += f"{'=' * 40}\n"
            message += f"Order Number: {display_code}\n"
            message += f"Order Type: {order_type.capitalize()}\n"
            message += f"Order Total: ${order_total:.2f}\n\n"

            message += f"PAYMENT CONFIRMATION\n"
            message += f"{'=' * 40}\n"
            message += f"Amount Charged: ${payment_amount:.2f}\n"
            message += f"Transaction Reference: {masked_payment_id}\n"

            if receipt_url:
                message += f"View Receipt: {receipt_url}\n"

            message += f"\n"
            message += f"{'=' * 40}\n\n"

            if order_type.lower() == "delivery":
                message += "Your order is being prepared and will be delivered to your address.\n"
            else:
                message += "Your order is being prepared and will be ready for pickup.\n"

            message += "\nYou will receive updates as your order progresses.\n\n"
            message += "If you have any questions about your order or payment, please contact us "
            message += f"with your order number: {display_code}\n\n"
            message += "Thank you for choosing Indimitra!\n"
            message += "Best regards,\nIndimitra Team"

            to_email_obj = To(to_email)
            content = Content("text/plain", message)
            mail = Mail(self.from_email, to_email_obj, subject, content)

            response = self.sg.send(mail)
            return response.status_code == 202

        except Exception as e:
            print(f"Error sending order confirmation with payment: {str(e)}")
            return False
