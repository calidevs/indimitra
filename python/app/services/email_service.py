from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
import os
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
