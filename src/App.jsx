import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Lesson from './pages/Lesson'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Stats from './pages/Stats'
import Learn from './pages/Learn'
import Settings from './pages/Settings'
import Pricing from './pages/Pricing'
import Shop from './pages/Shop'
import Alphabet from './pages/Alphabet'
import TestSentence from './pages/TestSentence'
import LessonSentence from './pages/LessonSentence'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lesson" element={<Lesson />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/pricing" element={<Pricing />} />``
        <Route path="/shop" element={<Shop />} />
        <Route path="/alphabet" element={<Alphabet />} />
        <Route path="/test-sentence" element={<TestSentence />} />
        <Route path="/lesson-sentence" element={<LessonSentence />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App