"""
Celery initialization and task auto-discovery
File: config/celery.py
"""
import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('vtu_backend')

# Load celery settings from Django settings using the 'CELERY_' namespace
app.config_from_object('django.conf:settings', namespace='CELERY')

# Automatically discover all tasks.py files inside your active Django apps
app.autodiscover_tasks()