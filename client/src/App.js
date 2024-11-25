import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ReservaForm from './components/ReservaForm';
import AdminPanel from './components/AdminPanel';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-[#292828] p-6">
                <div className="max-w-4xl mx-auto bg-[#e1e1e1] p-6 rounded-lg shadow-md">
                    <h1 className="text-4xl font-bold mb-6 text-center">Sistema de Reservas</h1>
                    <Routes>
                        <Route path="/admin" element={<AdminPanel />} />
                        <Route path="/" element={<ReservaForm />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;