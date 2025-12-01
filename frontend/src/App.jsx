import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Chat from './pages/Chat';
import Extraction from './pages/Extraction';
import Eval from './pages/Eval';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Chat />} />
                <Route path="/extract" element={<Extraction />} />
                <Route path="/eval" element={<Eval />} />
            </Routes>
        </Router>
    );
}

export default App;
