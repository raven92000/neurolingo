import SentenceExercise from './SentenceExercise'
import { useNavigate } from 'react-router-dom'

const phraseTest = {
  en: "I am happy",
  fr: "Je suis heureux",
  distracteursPhrase: ["Je suis triste", "Je suis fatigué"],
  distracteursMot: ["was", "have", "do"],
  indexCache: 1,
}

export default function TestSentence() {
  const navigate = useNavigate()
  return (
    <SentenceExercise
      phrase={phraseTest}
      profile="tdah"
      onComplete={({ erreurs }) => {
        console.log('Fini ! Erreurs:', erreurs)
        navigate('/dashboard')
      }}
    />
  )
}