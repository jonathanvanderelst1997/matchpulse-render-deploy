import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class RootErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="root-error-shell">
        <section className="root-error-card">
          <p>MatchPulse beta</p>
          <h1>MatchPulse kon niet laden.</h1>
          <span>
            Er liep iets mis in de interface. Herlaad de pagina; als dit blijft gebeuren, stuur deze fout door.
          </span>
          <code>{this.state.error?.message || 'Unknown interface error'}</code>
          <button type="button" onClick={() => window.location.reload()}>
            Herlaad MatchPulse
          </button>
        </section>
      </main>
    )
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
)
