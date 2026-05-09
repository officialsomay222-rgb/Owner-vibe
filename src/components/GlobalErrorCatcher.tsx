import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  globalError: string | Event | null;
  promiseRejection: string | null;
  logs: string[];
}

export class GlobalErrorCatcher extends Component<Props, State> {
  private logCatcher = (type: string, args: any[]) => {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    this.setState(prevState => ({
      logs: [...prevState.logs.slice(-19), `[${type.toUpperCase()}] ${msg}`]
    }));
  };

  private origConsoleError = console.error;
  private origConsoleWarn = console.warn;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    globalError: null,
    promiseRejection: null,
    logs: [],
  };

  componentDidMount() {
    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handlePromiseRejection);

    console.error = (...args) => {
      this.logCatcher('error', args);
      this.origConsoleError.apply(console, args);
    };
    console.warn = (...args) => {
      this.logCatcher('warn', args);
      this.origConsoleWarn.apply(console, args);
    };
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handlePromiseRejection);
    console.error = this.origConsoleError;
    console.warn = this.origConsoleWarn;
  }

  handleGlobalError = (event: ErrorEvent) => {
    this.setState({ hasError: true, globalError: event.message || String(event.error) || 'Unknown Global Error' });
  };

  handlePromiseRejection = (event: PromiseRejectionEvent) => {
    this.setState({ hasError: true, promiseRejection: String(event.reason) });
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  private getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      onLine: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      screen: `${window.screen.width}x${window.screen.height}`,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    };
  }

  public render() {
    if (this.state.hasError) {
      const deviceInfo = this.getDeviceInfo();
      return (
        <div style={{
          padding: '20px',
          backgroundColor: '#0a0a0a',
          color: '#ff4444',
          minHeight: '100vh',
          fontFamily: 'monospace',
          wordBreak: 'break-all',
          overflowY: 'auto'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', borderBottom: '2px solid #ff4444', paddingBottom: '8px' }}>
            CRITICAL APP FAILURE
          </h1>

          {this.state.error && (
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff8888' }}>React Error:</h2>
              <pre style={{ backgroundColor: '#220000', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap', border: '1px solid #440000' }}>
                {this.state.error.toString()}
              </pre>
            </div>
          )}

          {this.state.globalError && (
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff8888' }}>Global Error:</h2>
              <pre style={{ backgroundColor: '#220000', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap', border: '1px solid #440000' }}>
                {String(this.state.globalError)}
              </pre>
            </div>
          )}

          {this.state.promiseRejection && (
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff8888' }}>Unhandled Promise Rejection:</h2>
              <pre style={{ backgroundColor: '#220000', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap', border: '1px solid #440000' }}>
                {this.state.promiseRejection}
              </pre>
            </div>
          )}

          {this.state.error?.stack && (
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff8888' }}>Stack Trace:</h2>
              <pre style={{ backgroundColor: '#220000', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap', fontSize: '12px', border: '1px solid #440000', maxHeight: '200px', overflowY: 'auto' }}>
                {this.state.error.stack}
              </pre>
            </div>
          )}

          {this.state.errorInfo?.componentStack && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff8888' }}>Component Stack:</h2>
              <pre style={{ backgroundColor: '#220000', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap', fontSize: '12px', border: '1px solid #440000', maxHeight: '200px', overflowY: 'auto' }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff8888' }}>Device & Browser Info:</h2>
            <pre style={{ backgroundColor: '#220000', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap', fontSize: '12px', border: '1px solid #440000', color: '#aaa' }}>
              {JSON.stringify(deviceInfo, null, 2)}
            </pre>
          </div>

          {this.state.logs.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff8888' }}>Recent Console Errors/Warnings:</h2>
              <pre style={{ backgroundColor: '#220000', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap', fontSize: '12px', border: '1px solid #440000', color: '#ffaa00', maxHeight: '200px', overflowY: 'auto' }}>
                {this.state.logs.join('\n')}
              </pre>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                flex: 1,
                padding: '16px',
                backgroundColor: '#cc0000',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              Force Reload App
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              style={{
                flex: 1,
                padding: '16px',
                backgroundColor: '#660000',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              Clear Data & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorCatcher;
