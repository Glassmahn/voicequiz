import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf-8')
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function getUniqueCode() {
  for (let i = 0; i < 10; i++) {
    const code = generateRoomCode()
    const { data } = await supabase.from('rooms').select('id').eq('code', code).limit(1).maybeSingle()
    if (!data) return code
  }
  throw new Error('Could not generate unique code')
}

const topic = 'General Knowledge'
const questionCount = 5
const difficulty = 'easy'
const timer = 15

console.log('Generating questions...')
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{
    role: 'user',
    content: `Generate ${questionCount} multiple-choice quiz questions about "${topic}" at ${difficulty} difficulty.
Return a JSON object with a "questions" array where each item has:
- "question": the question text
- "options": an array of 4 answer choices (strings)
- "correctAnswer": the correct answer (must match one of the options exactly)
Return ONLY valid JSON.`
  }],
  response_format: { type: 'json_object' },
  temperature: 0.7,
  max_tokens: 2000,
})

const parsed = JSON.parse(completion.choices[0].message.content)
const questions = parsed.questions

console.log(`Generated ${questions.length} questions`)

const code = await getUniqueCode()
console.log(`Room code: ${code}`)

const hostPlayerId = crypto.randomUUID()

const { data: room, error: roomErr } = await supabase
  .from('rooms')
  .insert({
    code,
    host_player_id: hostPlayerId,
    title: topic,
    status: 'waiting',
    question_count: questionCount,
    timer_seconds: timer,
    difficulty,
  })
  .select('*')
  .maybeSingle()

if (roomErr || !room) {
  console.error('Room insert failed:', roomErr)
  process.exit(1)
}

console.log(`Room ID: ${room.id}`)

const { error: playerErr } = await supabase
  .from('players')
  .insert({
    room_id: room.id,
    player_id: hostPlayerId,
    display_name: 'TestHost',
    avatar: 'avatar-0',
    score: 0,
    is_host: true,
  })
  .maybeSingle()

if (playerErr) {
  console.error('Player insert failed:', playerErr)
  await supabase.from('rooms').delete().eq('id', room.id)
  process.exit(1)
}

const questionsToInsert = questions.map((q, i) => ({
  room_id: room.id,
  question_number: i + 1,
  question_text: q.question,
  options: q.options,
  correct_answer: q.correctAnswer,
}))

const { error: qErr } = await supabase.from('questions').insert(questionsToInsert).select('*')

if (qErr) {
  console.error('Questions insert failed:', qErr)
  await supabase.from('rooms').delete().eq('id', room.id)
  process.exit(1)
}

console.log(`Questions inserted: ${questions.length}`)
console.log('')
console.log('=== ROOM READY ===')
console.log(`Room code: ${code}`)
console.log(`Host player ID: ${hostPlayerId}`)
console.log(`URL: http://localhost:3000/play/${code}`)
console.log('')
console.log('Open http://localhost:3000 in a browser to see the landing page.')
console.log('To test as a player, go to http://localhost:3000/play/' + code)
console.log('')
console.log('To rejoin as host (if you refresh), you need to set localStorage:')
console.log(`  localStorage.setItem('voicequiz-playerId', '${hostPlayerId}')`)
console.log(`  localStorage.setItem('voicequiz-displayName', 'TestHost')`)
console.log(`  localStorage.setItem('voicequiz-avatar', 'avatar-0')`)
console.log('Then visit: http://localhost:3000/host/' + code + '/lobby')
