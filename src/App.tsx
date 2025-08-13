
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CommunityGraph from './components/CommunityGraph';
import CommunityDetail from './components/CommunityDetail';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<CommunityGraph />} />
          <Route path="/community/:id" element={<CommunityDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
