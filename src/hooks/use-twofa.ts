import { useEffect, useState, useCallback } from 'react';

interface TwoFARequest {
  requestId: string;
  timestamp: number;
  username: string;
  message: string;
}

export function useTwoFA() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<TwoFARequest | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Create WebSocket connection with error handling
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/twofa`;
      
      console.log('Attempting to connect 2FA WebSocket:', wsUrl);
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log('2FA WebSocket connected');
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'twofa_request' && data.data) {
            console.log('Received 2FA request:', data.data);
            setCurrentRequest(data.data);
            setIsOpen(true);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.onerror = (error) => {
        console.error('2FA WebSocket error:', error);
        // Don't crash the app on WebSocket error
      };

      websocket.onclose = () => {
        console.log('2FA WebSocket disconnected');
      };

      setWs(websocket);

      // Cleanup on unmount
      return () => {
        try {
          websocket.close();
        } catch (e) {
          // Ignore cleanup errors
        }
      };
    } catch (error) {
      console.error('Failed to create 2FA WebSocket:', error);
      // Continue without WebSocket - polling will still work
    }
  }, []);

  // Also poll for existing requests on mount
  useEffect(() => {
    fetch('/api/twofa/status')
      .then(res => res.json())
      .then(data => {
        if (data.pending && data.request) {
          setCurrentRequest(data.request);
          setIsOpen(true);
        }
      })
      .catch(error => {
        console.error('Error checking 2FA status:', error);
      });
  }, []);

  const handleSubmit = useCallback(async (code: string) => {
    if (!currentRequest) return;

    try {
      const response = await fetch('/api/twofa/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: currentRequest.requestId,
          code: code
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit 2FA code');
      }

      setIsOpen(false);
      setCurrentRequest(null);
    } catch (error) {
      console.error('Error submitting 2FA code:', error);
      throw error;
    }
  }, [currentRequest]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Don't clear currentRequest immediately in case user reopens
  }, []);

  return {
    isOpen,
    currentRequest,
    handleSubmit,
    handleClose,
    setIsOpen
  };
}
