from common.config.base import BaseServiceSettings

class Settings(BaseServiceSettings):
    PORT: int = 3023

    # Base de datos - MySQL XAMPP
    DATABASE_URL: str = "mysql+pymysql://root:@127.0.0.1:3306/paseos_appointments"

    # ====================
    # Pagos (PayU Latam)
    # ====================
    PAYU_MERCHANT_ID: str = ""
    PAYU_ACCOUNT_ID: str = ""
    PAYU_API_KEY: str = ""
    PAYU_CURRENCY: str = "COP"
    PAYU_TEST: int = 1  # 1=sandbox, 0=producción (PayU usa 1/0)
    PAYU_PAYMENT_URL: str = "https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/"
    # URLs públicas (ajustar en .env en despliegue)
    PAYU_RESPONSE_URL: str = "http://localhost:3001/payment/response"
    PAYU_CONFIRMATION_URL: str = "http://localhost:3023/invoices/payu/confirmation"

settings = Settings()
