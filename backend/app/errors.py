"""
Unified Error Handling for Backend
"""

from fastapi import HTTPException, status
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """Standard error response format"""
    detail: str
    error_code: str
    status_code: int


class AppError(Exception):
    """Base application error"""

    def __init__(
        self,
        message: str,
        error_code: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: dict = None,
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

    def to_http_exception(self):
        """Convert to FastAPI HTTPException"""
        return HTTPException(
            status_code=self.status_code,
            detail=self.message,
        )


# Specific error classes
class ValidationError(AppError):
    """Input validation error"""

    def __init__(self, message: str, details: dict = None):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
        )


class AuthenticationError(AppError):
    """Authentication failed"""

    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            message=message,
            error_code="AUTH_ERROR",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class PermissionError(AppError):
    """Insufficient permissions"""

    def __init__(self, message: str = "Permission denied"):
        super().__init__(
            message=message,
            error_code="PERMISSION_ERROR",
            status_code=status.HTTP_403_FORBIDDEN,
        )


class NotFoundError(AppError):
    """Resource not found"""

    def __init__(self, resource: str = "Resource"):
        super().__init__(
            message=f"{resource} not found",
            error_code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class ConflictError(AppError):
    """Resource conflict"""

    def __init__(self, message: str):
        super().__init__(
            message=message,
            error_code="CONFLICT",
            status_code=status.HTTP_409_CONFLICT,
        )


class FileError(AppError):
    """File operation error"""

    def __init__(self, message: str, details: dict = None):
        super().__init__(
            message=message,
            error_code="FILE_ERROR",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
        )


class ExternalServiceError(AppError):
    """External service (AI, Geocoding, etc.) error"""

    def __init__(self, service: str, message: str):
        super().__init__(
            message=f"{service} service error: {message}",
            error_code="EXTERNAL_SERVICE_ERROR",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


# Error handler middleware
async def app_exception_handler(request, exc: AppError):
    """Handle application errors"""
    return {
        "detail": exc.message,
        "error_code": exc.error_code,
        "status_code": exc.status_code,
    }
