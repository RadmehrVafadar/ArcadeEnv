import React from 'react'
import ReactDOM from 'react-dom/client'
import Background from './Background.tsx'
import Menu from './menu.tsx'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Background />
    <Menu />
  </React.StrictMode>,
)
