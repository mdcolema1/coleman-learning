export type VoiceInfo = { name: string; lang: string; localService: boolean }

function scoreVoice(v: SpeechSynthesisVoice) {
  const name = v.name.toLowerCase()
  const lang = v.lang.toLowerCase()
  let score = lang.startsWith('en-us') ? 35 : lang.startsWith('en') ? 20 : -20
  const preferred = [
    'natural','neural','premium','enhanced','ava','samantha','jenny','aria','serena','victoria',
    'allison','susan','karen','moira','tessa','google us english','zira'
  ]
  preferred.forEach((term, index) => { if (name.includes(term)) score += 120 - index * 5 })
  if (v.localService) score += 8
  if (/compact|robot|espeak/.test(name)) score -= 45
  return score
}

export function englishVoices() {
  if (!('speechSynthesis' in window)) return [] as SpeechSynthesisVoice[]
  return window.speechSynthesis.getVoices()
    .filter(v => v.lang.toLowerCase().startsWith('en'))
    .sort((a,b) => scoreVoice(b) - scoreVoice(a))
}

export function bestVoice(preferredName?: string) {
  const voices = englishVoices()
  return voices.find(v => v.name === preferredName) || voices[0] || null
}

export function speakText(text: string, preferredName?: string, rate = 0.88) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  const voice = bestVoice(preferredName)
  if (voice) utterance.voice = voice
  utterance.rate = rate
  utterance.pitch = 1.02
  utterance.volume = 1
  window.speechSynthesis.speak(utterance)
}

export function primeVoices(onChange?: () => void) {
  if (!('speechSynthesis' in window)) return () => {}
  window.speechSynthesis.getVoices()
  const handler = () => onChange?.()
  window.speechSynthesis.addEventListener?.('voiceschanged', handler)
  return () => window.speechSynthesis.removeEventListener?.('voiceschanged', handler)
}
