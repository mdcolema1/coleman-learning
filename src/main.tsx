import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './styles.css'
const rootElement=document.getElementById('root')
if(!rootElement) throw new Error('Root element was not found.')
ReactDOM.createRoot(rootElement).render(<ErrorBoundary><App/></ErrorBoundary>)
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/coleman-learning/sw.js').catch(()=>{}))}
