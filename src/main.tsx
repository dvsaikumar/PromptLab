import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { PromptProvider } from './contexts/PromptContext'
import { ErrorBoundary } from './components/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <PromptProvider>
                <App />
            </PromptProvider>
        </ErrorBoundary>
    </React.StrictMode>,
)
