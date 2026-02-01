/*
Αυτό είναι το σημείο εισόδου της εφαρμογής που αποδίδει το κύριο στοιχείο App στο DOM χρησιμοποιώντας το ReactDOM.
*/

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
