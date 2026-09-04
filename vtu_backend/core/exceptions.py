from rest_framework.views import exception_handler

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    # You can customize the response here if needed
    if response is not None:
        response.data['status_code'] = response.status_code

    return response
