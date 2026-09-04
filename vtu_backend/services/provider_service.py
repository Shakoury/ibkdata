"""
Provider service for handling VTU provider integration
File: services/provider_service.py
"""
import time
import logging
import requests
from typing import Dict, Optional
from django.conf import settings
from .models import Provider, ProviderLog

logger = logging.getLogger(__name__)


class ProviderService:
    """
    Service for integrating with VTU providers
    Includes safe failover and retry logic
    """
    
    def __init__(self):
        self.timeout = settings.VTU_SETTINGS['TRANSACTION_TIMEOUT']
    
    def get_available_providers(self) -> list:
        """
        Get list of available providers ordered by priority
        """
        return Provider.objects.filter(
            is_active=True,
            is_healthy=True
        ).order_by('priority')
    
    def process_transaction(self, transaction) -> Dict:
        """
        Process transaction through providers with SAFE failover
        """
        providers = self.get_available_providers()
        
        if not providers.exists():
            logger.error("No available providers found")
            return {
                'success': False,
                'message': 'No available service providers',
                'provider': None
            }
        
        # Try each provider in order of priority
        for provider in providers:
            try:
                logger.info(
                    f"Attempting transaction {transaction.reference} "
                    f"with provider {provider.name}"
                )
                
                result = self._call_provider(provider, transaction)
                
                if result['success']:
                    return {
                        **result,
                        'provider': provider
                    }
                
                # Check if it is safe to failover to the next provider
                if not result.get('failover_allowed', True):
                    logger.critical(
                        f"Ambiguous failure with provider {provider.name}. "
                        f"Failover blocked to prevent double-spending: {result.get('message')}"
                    )
                    return {
                        'success': False,
                        'message': f"Ambiguous transaction status: {result.get('message')}",
                        'provider': provider # Returns provider to prevent blind refunds
                    }
                
                # Safe to try next provider
                logger.warning(
                    f"Provider {provider.name} failed safely: {result.get('message')}. Trying next provider."
                )
                
            except Exception as e:
                logger.error(
                    f"Error with provider {provider.name}: {str(e)}"
                )
                provider.mark_unhealthy()
                continue
        
        # All providers failed safely
        return {
            'success': False,
            'message': 'All service providers failed',
            'provider': None
        }
    
    def _call_provider(self, provider: Provider, transaction) -> Dict:
        """
        Make API call to specific provider with failover allowance tracking
        """
        start_time = time.time()
        endpoint = 'unknown'
        payload = {}
        
        try:
            # Prepare request based on transaction type
            endpoint, payload = self._prepare_request(provider, transaction)
            
            # Make API call
            response = requests.post(
                url=f"{provider.api_base_url}/{endpoint}",
                json=payload,
                headers={
                    'Authorization': f'Bearer {provider.api_key}',
                    'Content-Type': 'application/json'
                },
                timeout=self.timeout
            )
            
            response_time = time.time() - start_time
            
            # Log request/response
            self._log_interaction(
                provider=provider,
                transaction=transaction,
                log_type='RESPONSE',
                endpoint=endpoint,
                request_data=payload,
                response_data=response.json() if response.text else {},
                status_code=response.status_code,
                response_time=response_time
            )
            
            # Parse response
            result = self._parse_response(provider, response)
            
            # Update provider metrics
            provider.update_metrics(
                success=result['success'],
                response_time=response_time
            )
            
            # Deciding if failover is allowed on failure
            if not result['success']:
                # If provider actively rejects it (like low API balance on your account), it's safe to failover.
                # However, if the status code is 500/504, the server processed something but crashed—not safe to failover.
                is_500_error = response.status_code in [500, 502, 503, 504]
                result['failover_allowed'] = not is_500_error
                
            return result
            
        except requests.Timeout:
            response_time = time.time() - start_time
            error_msg = "Request timeout - transaction status is ambiguous"
            
            self._log_interaction(
                provider=provider,
                transaction=transaction,
                log_type='ERROR',
                endpoint=endpoint,
                request_data=payload,
                response_data={},
                status_code=None,
                response_time=response_time,
                error_message=error_msg
            )
            
            provider.update_metrics(success=False, response_time=response_time)
            provider.mark_unhealthy()
            
            # HIGH SECURITY: Block failover on timeouts
            return {
                'success': False,
                'message': error_msg,
                'failover_allowed': False
            }

        except requests.ConnectionError:
            response_time = time.time() - start_time
            error_msg = "Connection error - request never reached the provider"
            
            self._log_interaction(
                provider=provider,
                transaction=transaction,
                log_type='ERROR',
                endpoint=endpoint,
                request_data=payload,
                response_data={},
                status_code=None,
                response_time=response_time,
                error_message=error_msg
            )
            
            provider.update_metrics(success=False, response_time=response_time)
            provider.mark_unhealthy()
            
            # Connection refused before sending data, SAFE to failover
            return {
                'success': False,
                'message': error_msg,
                'failover_allowed': True
            }
            
        except Exception as e:
            response_time = time.time() - start_time
            error_msg = f"Unexpected provider error: {str(e)}"
            
            self._log_interaction(
                provider=provider,
                transaction=transaction,
                log_type='ERROR',
                endpoint=endpoint,
                request_data=payload,
                response_data={},
                status_code=None,
                response_time=response_time,
                error_message=error_msg
            )
            
            provider.update_metrics(success=False, response_time=response_time)
            
            # For general uncaught python exceptions, default to blocking failover to be safe
            return {
                'success': False,
                'message': error_msg,
                'failover_allowed': False
            }
    
    def _prepare_request(self, provider: Provider, transaction) -> tuple:
        """
        Prepare API request based on transaction type
        """
        endpoint_map = {
            'AIRTIME': 'airtime',
            'DATA': 'data',
            'ELECTRICITY': 'electricity',
            'CABLE_TV': 'cable-tv'
        }
        
        endpoint = endpoint_map.get(transaction.type, 'transaction')
        
        payload = {
            'reference': transaction.reference,
            'type': transaction.type,
            'amount': float(transaction.amount),
            'phone_number': transaction.phone_number,
            'network': transaction.network,
            'metadata': transaction.metadata
        }
        
        return endpoint, payload
    
    def _parse_response(self, provider: Provider, response) -> Dict:
        """
        Parse provider response
        """
        try:
            data = response.json()
            
            # Check for success
            if response.status_code == 200 and data.get('status') == 'success':
                return {
                    'success': True,
                    'message': data.get('message', 'Transaction successful'),
                    'provider_reference': data.get('reference', '')
                }
            else:
                return {
                    'success': False,
                    'message': data.get('message', 'Transaction failed')
                }
                
        except Exception as e:
            return {
                'success': False,
                'message': f"Failed to parse response: {str(e)}"
            }
    
    def _log_interaction(
        self, 
        provider: Provider, 
        transaction,
        log_type: str,
        endpoint: str,
        request_data: dict,
        response_data: dict,
        status_code: Optional[int],
        response_time: float,
        error_message: str = ''
    ):
        """Log provider interaction"""
        try:
            ProviderLog.objects.create(
                provider=provider,
                transaction=transaction,
                log_type=log_type,
                endpoint=endpoint,
                request_data=request_data,
                response_data=response_data,
                status_code=status_code,
                response_time=response_time,
                error_message=error_message
            )
        except Exception as e:
            logger.error(f"Failed to log provider interaction: {str(e)}")
    
    def health_check(self, provider: Provider) -> bool:
        """
        Check provider health status
        """
        try:
            response = requests.get(
                url=f"{provider.api_base_url}/health",
                headers={'Authorization': f'Bearer {provider.api_key}'},
                timeout=5
            )
            
            if response.status_code == 200:
                provider.mark_healthy()
                return True
            else:
                provider.mark_unhealthy()
                return False
                
        except Exception as e:
            logger.error(f"Health check failed for {provider.name}: {str(e)}")
            provider.mark_unhealthy()
            return False

    def validate_customer_account(self, provider_type: str, provider_code: str, account_number: str) -> Dict:
        """
        Validate an electricity meter or cable TV decoder number before charging.
        provider_type: 'CABLE_TV' or 'ELECTRICITY'
        provider_code: e.g., 'DSTV', 'IKEDC' (Ikeja Electric)
        account_number: IUC / Smartcard / Meter Number
        """
        providers = self.get_available_providers()
        
        if not providers.exists():
            return {'success': False, 'message': 'No validation providers available'}
            
        # Try the highest priority healthy provider
        provider = providers.first()
        
        # Prepare the validation payload
        endpoint = "validate" 
        payload = {
            "type": provider_type.lower(),
            "service_provider": provider_code.lower(),
            "account_number": account_number
        }
        
        try:
            logger.info(f"Validating {provider_type} account {account_number} via {provider.name}")
            
            response = requests.post(
                url=f"{provider.api_base_url}/{endpoint}",
                json=payload,
                headers={
                    'Authorization': f'Bearer {provider.api_key}',
                    'Content-Type': 'application/json'
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success' and data.get('customer_name'):
                    return {
                        'success': True,
                        'customer_name': data.get('customer_name'),
                        'message': 'Account validated successfully'
                    }
                
                return {
                    'success': False,
                    'message': data.get('message', 'Invalid account details')
                }
                
            return {
                'success': False,
                'message': f'Validation server responded with status: {response.status_code}'
            }
            
        except Exception as e:
            logger.error(f"Pre-validation failed with error: {str(e)}")
            return {
                'success': False,
                'message': 'Could not verify account details due to a connection issue'
            }