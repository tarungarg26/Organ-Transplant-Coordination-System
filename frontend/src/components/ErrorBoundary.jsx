import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page" style={{ padding: '40px', textAlign: 'center' }}>
          <div className="panel" style={{ maxWidth: '500px', margin: '40px auto', padding: '30px' }}>
            <h2 style={{ color: 'var(--danger)', marginBottom: '10px' }}>Something went wrong</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
              {this.state.error?.message || 'An unexpected error occurred while rendering this page.'}
            </p>
            <button
              className="primary-button"
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/dashboard'; }}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
