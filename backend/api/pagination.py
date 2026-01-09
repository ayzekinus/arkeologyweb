from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """Default pagination with optional ?page_size= query param."""

    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 500
