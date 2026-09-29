import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center" style={{ minHeight: '60vh' }}>
          <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-circle mb-3">
            <AlertTriangle size={36} />
          </div>
          <h4 className="fw-bold text-dark mb-2">Something went wrong</h4>
          <p className="text-secondary small mb-4" style={{ maxWidth: '500px' }}>
            An unexpected error occurred while rendering this component.
            {this.state.error?.message && (
              <span className="d-block mt-2 font-monospace text-danger bg-light p-2 rounded text-start">
                {this.state.error.message}
              </span>
            )}
          </p>
          <button className="pm-btn pm-btn-primary d-flex align-items-center gap-2" onClick={this.handleReload}>
            <RefreshCw size={15} /> Reload Application
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
