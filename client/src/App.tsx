import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PublicCalendar from './pages/PublicCalendar';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicCalendar />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
