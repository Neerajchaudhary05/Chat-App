import React from 'react'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        // Log the error for debugging
        console.error('ErrorBoundary caught an error:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 text-red-300 bg-[#2b2438] rounded">Something went wrong. Please refresh the page.</div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
