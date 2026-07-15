from fastapi import HTTPException, status


class AppException(HTTPException):
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)


class NotFound(AppException):
    def __init__(self, detail: str = "Recurso não encontrado"):
        super().__init__(detail=detail, status_code=status.HTTP_404_NOT_FOUND)


class Unauthorized(AppException):
    def __init__(self, detail: str = "Não autorizado"):
        super().__init__(detail=detail, status_code=status.HTTP_401_UNAUTHORIZED)


class Forbidden(AppException):
    def __init__(self, detail: str = "Proibido"):
        super().__init__(detail=detail, status_code=status.HTTP_403_FORBIDDEN)


class ValidationError_(AppException):
    def __init__(self, detail: str):
        super().__init__(detail=detail, status_code=status.HTTP_422_UNPROCESSABLE_CONTENT)
