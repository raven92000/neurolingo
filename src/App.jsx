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
import AlphabetEcoute from './pages/AlphabetEcoute'
import AlphabetChanson from './pages/AlphabetChanson'
import TestSentence from './pages/TestSentence'
import LessonSentence from './pages/LessonSentence'
import ParentCreateChild from './pages/ParentCreateChild'
import ParentLinkChild from './pages/ParentLinkChild'
import ParentDashboard from './pages/ParentDashboard'
import ChildrenPage from './pages/ChildrenPage'
import ChildDetailPage from './pages/ChildDetailPage'
import ParentChildProgression from './pages/ParentChildProgression'
import ParentChildHistorique from './pages/ParentChildHistorique'
import ParentSettings from './pages/ParentSettings'

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
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/alphabet" element={<Alphabet />} />
        <Route path="/alphabet/ecoute" element={<AlphabetEcoute />} />
        <Route path="/alphabet/chanson" element={<AlphabetChanson />} />
        <Route path="/test-sentence" element={<TestSentence />} />
        <Route path="/lesson-sentence" element={<LessonSentence />} />
        <Route path="/parent-create-child" element={<ParentCreateChild />} />
        <Route path="/parent-link-child" element={<ParentLinkChild />} />
        <Route path="/parent-dashboard" element={<ParentDashboard />} />
        <Route path="/parent-children" element={<ChildrenPage />} />
        <Route path="/parent/enfant/:userId" element={<ChildDetailPage />} />
        <Route path="/parent/enfant/:userId/progression" element={<ParentChildProgression />} />
        <Route path="/parent/enfant/:userId/historique" element={<ParentChildHistorique />} />
        <Route path="/parent-settings" element={<ParentSettings />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App