import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const { topic, questionCount, difficulty } = await req.json()

    if (!topic || !questionCount || !difficulty) {
      return NextResponse.json({ error: 'Missing required fields', retry: true }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured', retry: false }, { status: 500 })
    }

    const prompt = `Generate ${questionCount} multiple-choice quiz questions about "${topic}" at ${difficulty} difficulty.
Return a JSON object with a "questions" array where each item has:
- "question": the question text
- "options": an array of 4 answer choices (strings)
- "correctAnswer": the correct answer (must match one of the options exactly)

Example:
{
  "questions": [
    {
      "question": "What is the capital of France?",
      "options": ["London", "Paris", "Berlin", "Madrid"],
      "correctAnswer": "Paris"
    }
  ]
}

Return ONLY valid JSON, no markdown or other text.`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000,
    }, { signal: controller.signal })

    clearTimeout(timeout)

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'No response from AI', retry: true }, { status: 500 })
    }

    const parsed = JSON.parse(content)
    const questions = parsed.questions

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Invalid response format', retry: true }, { status: 500 })
    }

    for (const q of questions) {
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || !q.correctAnswer) {
        return NextResponse.json({ error: 'Invalid question format', retry: true }, { status: 500 })
      }
      if (!q.options.includes(q.correctAnswer)) {
        return NextResponse.json({ error: 'Correct answer not in options', retry: true }, { status: 500 })
      }
    }

    return NextResponse.json({ questions })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Generation failed: ${msg}`, retry: true }, { status: 500 })
  }
}
