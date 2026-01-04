import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#FF0000',
          color: 'white',
          padding: '20px',
          overflow: 'auto',
          fontSize: '14px',
          fontFamily: 'monospace',
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
            REACT ERROR CAUGHT
          </h1>
          <div style={{ marginBottom: '20px' }}>
            <strong>Error:</strong>
            <pre style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '10px',
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
            }}>
              {this.state.error?.toString()}
            </pre>
          </div>
          <div>
            <strong>Stack:</strong>
            <pre style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '10px',
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
              fontSize: '10px',
            }}>
              {this.state.error?.stack}
            </pre>
          </div>
          <div style={{ marginTop: '20px' }}>
            <strong>Component Stack:</strong>
            <pre style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '10px',
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
              fontSize: '10px',
            }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: 'white',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
