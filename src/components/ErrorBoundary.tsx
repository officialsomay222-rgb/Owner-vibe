import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          minHeight: '100vh',
          fontFamily: 'monospace',
          wordBreak: 'break-all'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>App Crashed!</h1>

          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Error:</h2>
            <pre style={{ backgroundColor: '#ffcdd2', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
              {this.state.error?.toString()}
            </pre>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Stack Trace:</h2>
            <pre style={{ backgroundColor: '#ffcdd2', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
              {this.state.error?.stack || 'No stack trace available'}
            </pre>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Component Stack:</h2>
            <pre style={{ backgroundColor: '#ffcdd2', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
              {this.state.errorInfo?.componentStack || 'No component stack available'}
            </pre>
          </div>

          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
