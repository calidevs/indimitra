"""
Integration tests for S3 Endpoints Security (Phase 3)

Tests all S3 security scenarios:
- Authentication required for all endpoints
- Authorization: user owns order / manages store
- File type validation
- Malware blocking
"""

import pytest
from unittest.mock import patch, Mock
from fastapi import status

from app.middleware.auth_middleware import CognitoUser


# ============================================================
# S3 Upload URL Tests
# ============================================================

class TestS3UploadSecurity:
    """Test security for S3 upload endpoints"""

    @pytest.mark.integration
    @pytest.mark.security
    @patch("app.middleware.auth_middleware.cognitojwt.decode")
    @patch("app.api.routes.s3.s3")
    def test_upload_url_requires_authentication(self, mock_s3, mock_decode, client):
        """Test that upload URL generation requires authentication"""
        response = client.get(
            "/s3/generate-upload-url?order_id=1&file_name=bill.pdf"
        )

        assert response.status_code == 401
        assert "Missing Authorization header" in response.json()["detail"]

    @pytest.mark.integration
    @pytest.mark.security
    @patch("app.middleware.auth_middleware.cognitojwt.decode")
    @patch("app.api.routes.s3.s3")
    def test_upload_url_user_owns_order_success(
        self, mock_s3, mock_decode, client, test_user, test_order
    ):
        """Test that user can upload to their own order"""
        mock_decode.return_value = {
            "sub": test_user.cognitoId,
            "email": test_user.email
        }

        mock_s3.generate_presigned_url.return_value = "https://s3.aws.com/presigned"

        response = client.get(
            f"/s3/generate-upload-url?order_id={test_order.id}&file_name=bill.pdf",
            headers={"Authorization": "Bearer valid_token"}
        )

        assert response.status_code == 200
        assert "upload_url" in response.json()

    @pytest.mark.integration
    @pytest.mark.security
    @patch("app.middleware.auth_middleware.cognitojwt.decode")
    def test_upload_url_user_denied_other_order(
        self, mock_decode, client, test_user, test_order
    ):
        """Test that user cannot upload to another user's order"""
        # Create a different user's Cognito ID
        mock_decode.return_value = {
            "sub": "other_user_cognito_id",
            "email": "other@example.com"
        }

        response = client.get(
            f"/s3/generate-upload-url?order_id={test_order.id}&file_name=bill.pdf",
            headers={"Authorization": "Bearer valid_token"}
        )

        assert response.status_code == 403
        assert "permission" in response.json()["detail"].lower()

    @pytest.mark.integration
    @pytest.mark.security
    @patch("app.middleware.auth_middleware.cognitojwt.decode")
    @patch("app.api.routes.s3.s3")
    def test_upload_url_admin_access_any_order(
        self, mock_s3, mock_decode, client, admin_user, test_order
    ):
        """Test that admin can upload to any order"""
        mock_decode.return_value = {
            "sub": admin_user.cognitoId,
            "email": admin_user.email
        }

        mock_s3.generate_presigned_url.return_value = "https://s3.aws.com/presigned"

        response = client.get(
            f"/s3/generate-upload-url?order_id={test_order.id}&file_name=bill.pdf",
            headers={"Authorization": "Bearer admin_token"}
        )

        assert response.status_code == 200

    @pytest.mark.integration
    @pytest.mark.security
    @patch("app.middleware.auth_middleware.cognitojwt.decode")
    def test_upload_url_order_not_found(self, mock_decode, client, test_user):
        """Test that non-existent order returns 404"""
        mock_decode.return_value = {
            "sub": test_user.cognitoId,
            "email": test_user.email
        }

        response = client.get(
            "/s3/generate-upload-url?order_id=99999&file_name=bill.pdf",
            headers={"Authorization": "Bearer valid_token"}
        )

        assert response.status_code == 404
        assert "Order not found" in response.json()["detail"]


# ============================================================
# File Type Validation Tests
# ============================================================

class TestFileTypeValidation:
    """Test file type validation for uploads"""

    @pytest.mark.integration
    @pytest.mark.security
    @patch("app.middleware.auth_middleware.cognitojwt.decode")
    def test_allowed_image_extensions(self, mock_decode, client, test_user, test_order):
        """Test that allowed image extensions are accepted"""
        mock_decode.return_value = {
            "sub": test_user.cognitoId,
            "email": test_user.email
        }

        allowed_images = ["receipt.jpg", "bill.jpeg", "photo.png", "image.gif", "pic.webp", "logo.svg"]

        for filename in allowed_images:
            with patch("app.api.routes.s3.s3") as mock_s3:
                mock_s3.generate_presigned_url.return_value = "https://s3.aws.com/presigned"

                response = client.get(
                    f"/s3/generate-upload-url?order_id={test_order.id}&file_name={filename}",
                    headers={"Authorization": "Bearer valid_token"}
                )

                assert response.status_code == 200, f"Failed for {filename}"

    @pytest.mark.integration
    @pytest.mark.security
    @patch("app.middleware.auth_middleware.cognitojwt.decode")
    def test_allowed_document_extensions(self, mock_decode, client, test_user, test_order):
        """Test that allowed document extensions are accepted"""
        mock_decode.return_value = {
            "sub": test_user.cognitoId,
            "email": test_user.email
        }

        allowed_docs = ["invoice.pdf", "receipt.doc", "bill.docx"]

        for filename in allowed_docs:
            with patch("app.api.routes.s3.s3") as mock_s3:
                mock_s3.generate_presigned_url.return_value = "https://s3.aws.com/presigned"

                response = client.get(
                    f"/s3/generate-upload-url?order_id={test_order.id}&file_name={filename}",
                    headers={"Authorization": "Bearer valid_token"}
                )

                assert response.status_code == 200, f"Failed for {filename}"

    @pytest.mark.integration
    @pytest.mark.security
    @patch("app.middleware.auth_middleware.cognitojwt.decode")
    def test_blocked_executable_extensions(self, mock_decode, client, test_user, test_order):
        """Test that executable files are blocked"""
        mock_decode.return_value = {
            "sub": test_user.cognitoId,
            "email": test_user.email
        }

        blocked_files = [
            "malware.exe",
            "virus.bat",
            "script.sh",
            "program.msi",
            "code.js",
            "app.apk",
            "installer.dmg"
        ]

        for filename in blocked_files:
            response = client.get(
                f"/s3/generate-upload-url?order_id={test_order.id}&file_name={filename}",
                headers={"Authorization": "Bearer valid_token"}
            )

            assert response.status_code == 400, f"Should block {filename}"
            assert "not allowed" in response.json()["detail"].lower()

    @pytest.mark.integration
    @pytest.mark.security
    @patch("app.middleware.auth_middleware.cognitojwt.decode")
    def test_no_extension_blocked(self, mock_decode, client, test_user, test_order):
        """Test that files without extension are blocked"""
        mock_decode.return_value = {
            "sub": test_user.cognitoId,
            "email": test_user.email
        }

        response = client.get(
            f"/s3/generate-upload-url?order_id={test_order.id}&file_name=noextension",
            headers={"Authorization": "Bearer valid_token"}
        )

        assert response.status_code == 400
        assert "not allowed" in response.json()["detail"].lower()


# ============================================================
# S3 View URL Tests
# ============================================================

class TestS3ViewSecurity:
    """Test security for S3 view endpoints"""

    @pytest.mark.integration
    @pytest.mark.security
    def test_view_url_requires_authentication(self, client):
        """Test that view URL generation requires authentication"""
        response = client.get(
            "/s3/generate-view-url?order_id=1&file_name=bill.pdf"
        )

        assert response.status_code == 401

    @pytest.mark.integration
    @pytest.mark.security
    @patch("app.middleware.auth_middleware.cognitojwt.decode")
    @patch("app.api.routes.s3.s3")
    def test_view_url_user_owns_order_success(
        self, mock_s3, mock_decode, client, test_user, test_order
    ):
        """Test that user can view files from their own order"""
        mock_decode.return_value = {
            "sub": test_user.cognitoId,
            "email": test_user.email
        }

        mock_s3.head_object.return_value = {"ContentLength": 1024}
        mock_s3.generate_presigned_url.return_value = "https://s3.aws.com/presigned"

        response = client.get(
            f"/s3/generate-view-url?order_id={test_order.id}&file_name=bill.pdf",
            headers={"Authorization": "Bearer valid_token"}
        )

        assert response.status_code == 200
        assert "view_url" in response.json()

    @pytest.mark.integration
    @pytest.mark.security
    @patch("app.middleware.auth_middleware.cognitojwt.decode")
    def test_view_url_user_denied_other_order(
        self, mock_decode, client, test_order
    ):
        """Test that user cannot view files from another user's order"""
        mock_decode.return_value = {
            "sub": "other_user_cognito_id",
            "email": "other@example.com"
        }

        response = client.get(
            f"/s3/generate-view-url?order_id={test_order.id}&file_name=bill.pdf",
            headers={"Authorization": "Bearer valid_token"}
        )

        assert response.status_code == 403


# ============================================================
# Store Upload Tests
# ============================================================

class TestStoreUploadSecurity:
    """Test security for store image uploads"""

    @pytest.mark.integration
    @pytest.mark.security
    def test_store_upload_requires_authentication(self, client):
        """Test that store upload requires authentication"""
        response = client.get(
            "/s3/generate-store-upload-url?store_id=1&file_name=logo.png"
        )

        assert response.status_code == 401

    @pytest.mark.integration
    @pytest.mark.security
    @patch("app.middleware.auth_middleware.cognitojwt.decode")
    @patch("app.api.routes.s3.s3")
    def test_store_manager_upload_own_store(
        self, mock_s3, mock_decode, client, store_manager_user, test_store
    ):
        """Test that store manager can upload to their own store"""
        mock_decode.return_value = {
            "sub": store_manager_user.cognitoId,
            "email": store_manager_user.email
        }

        mock_s3.generate_presigned_url.return_value = "https://s3.aws.com/presigned"

        response = client.get(
            f"/s3/generate-store-upload-url?store_id={test_store.id}&file_name=logo.png",
            headers={"Authorization": "Bearer manager_token"}
        )

        assert response.status_code == 200

    @pytest.mark.integration
    @pytest.mark.security
    @patch("app.middleware.auth_middleware.cognitojwt.decode")
    def test_store_manager_denied_other_store(
        self, mock_decode, client, store_manager_user, another_store
    ):
        """Test that store manager cannot upload to another store"""
        mock_decode.return_value = {
            "sub": store_manager_user.cognitoId,
            "email": store_manager_user.email
        }

        response = client.get(
            f"/s3/generate-store-upload-url?store_id={another_store.id}&file_name=logo.png",
            headers={"Authorization": "Bearer manager_token"}
        )

        assert response.status_code == 403

    @pytest.mark.integration
    @pytest.mark.security
    @patch("app.middleware.auth_middleware.cognitojwt.decode")
    def test_store_upload_only_images(
        self, mock_decode, client, store_manager_user, test_store
    ):
        """Test that only images can be uploaded to stores"""
        mock_decode.return_value = {
            "sub": store_manager_user.cognitoId,
            "email": store_manager_user.email
        }

        # Document should be rejected
        response = client.get(
            f"/s3/generate-store-upload-url?store_id={test_store.id}&file_name=document.pdf",
            headers={"Authorization": "Bearer manager_token"}
        )

        assert response.status_code == 400
        assert "not allowed" in response.json()["detail"].lower()

    @pytest.mark.integration
    @pytest.mark.security
    @patch("app.middleware.auth_middleware.cognitojwt.decode")
    @patch("app.api.routes.s3.s3")
    def test_admin_upload_any_store(
        self, mock_s3, mock_decode, client, admin_user, test_store
    ):
        """Test that admin can upload to any store"""
        mock_decode.return_value = {
            "sub": admin_user.cognitoId,
            "email": admin_user.email
        }

        mock_s3.generate_presigned_url.return_value = "https://s3.aws.com/presigned"

        response = client.get(
            f"/s3/generate-store-upload-url?store_id={test_store.id}&file_name=logo.png",
            headers={"Authorization": "Bearer admin_token"}
        )

        assert response.status_code == 200


# ============================================================
# Set Bill URL Tests
# ============================================================

class TestSetBillUrlSecurity:
    """Test security for setting bill URLs"""

    @pytest.mark.integration
    @pytest.mark.security
    def test_set_bill_url_requires_authentication(self, client):
        """Test that setting bill URL requires authentication"""
        response = client.post(
            "/orders/1/set-bill-url?file_name=bill.pdf"
        )

        assert response.status_code == 401

    @pytest.mark.integration
    @pytest.mark.security
    @patch("app.middleware.auth_middleware.cognitojwt.decode")
    def test_regular_user_denied_set_bill(
        self, mock_decode, client, test_user, test_order
    ):
        """Test that regular user cannot set bill URL"""
        mock_decode.return_value = {
            "sub": test_user.cognitoId,
            "email": test_user.email
        }

        response = client.post(
            f"/orders/{test_order.id}/set-bill-url?file_name=bill.pdf",
            headers={"Authorization": "Bearer valid_token"}
        )

        assert response.status_code == 403
        assert "store managers and admins" in response.json()["detail"].lower()

    @pytest.mark.integration
    @pytest.mark.security
    @patch("app.middleware.auth_middleware.cognitojwt.decode")
    def test_store_manager_set_bill_own_store(
        self, mock_decode, client, store_manager_user, test_order
    ):
        """Test that store manager can set bill for their store's order"""
        mock_decode.return_value = {
            "sub": store_manager_user.cognitoId,
            "email": store_manager_user.email
        }

        response = client.post(
            f"/orders/{test_order.id}/set-bill-url?file_name=bill.pdf",
            headers={"Authorization": "Bearer manager_token"}
        )

        assert response.status_code == 200

    @pytest.mark.integration
    @pytest.mark.security
    @patch("app.middleware.auth_middleware.cognitojwt.decode")
    def test_admin_set_bill_any_order(
        self, mock_decode, client, admin_user, test_order
    ):
        """Test that admin can set bill for any order"""
        mock_decode.return_value = {
            "sub": admin_user.cognitoId,
            "email": admin_user.email
        }

        response = client.post(
            f"/orders/{test_order.id}/set-bill-url?file_name=bill.pdf",
            headers={"Authorization": "Bearer admin_token"}
        )

        assert response.status_code == 200
