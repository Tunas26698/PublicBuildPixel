import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameComponent } from './components/GameComponent';
import { CreateAvatar } from './pages/CreateAvatar';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div className="w-screen h-screen overflow-hidden bg-black text-white">
            <GameComponent />
          </div>
        } />
        <Route path="/create" element={<CreateAvatar />} />
      </Routes>
    </Router>
  );
}

export default App;
