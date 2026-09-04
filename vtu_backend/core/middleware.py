from django.utils.deprecation import MiddlewareMixin
import logging

logger = logging.getLogger(__name__)

class AuditMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # Example: log each request path
        logger.info(f"Request path: {request.path}")
        return None

    def process_response(self, request, response):
        # Example: log response status
        logger.info(f"Response status: {response.status_code}")
        return response
