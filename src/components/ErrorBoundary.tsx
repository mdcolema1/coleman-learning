import { Component, type ErrorInfo, type ReactNode } from 'react'

export default class ErrorBoundary extends Component<{children:ReactNode},{error:string}> {
  state={error:''}
  static getDerivedStateFromError(error:Error){ return {error:error.message || 'Unknown application error'} }
  componentDidCatch(error:Error, info:ErrorInfo){ console.error('Coleman Learning error', error, info) }
  render(){
    if(this.state.error){
      return <main className="fatal-shell"><section className="fatal-card"><div className="fatal-icon">🛟</div><h1>Learning Program Recovery</h1><p>The page loaded, but one part of the app stopped unexpectedly.</p><code>{this.state.error}</code><button className="primary" onClick={()=>location.reload()}>Reload Program</button></section></main>
    }
    return this.props.children
  }
}
