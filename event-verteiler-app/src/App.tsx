import React from 'react'
import { EventProvider } from './contexts/EventContext'
import { Dashboard } from './components/dashboard/Dashboard'
import './index.css'

function App() {
  return (
    <EventProvider>
      <div className="min-h-screen bg-background">
        <Dashboard />
      </div>
    </EventProvider>
  )
}

export default App