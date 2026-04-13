export async function callAI(systemPrompt, userMessage) {
  const key = import.meta.env.VITE_GROQ_KEY
  if (!key || key.includes('your_')) throw new Error('GROQ KEY MISSING')
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.2,
      max_tokens: 1024
    })
  })
  
  const data = await response.json()
  console.log('Groq response:', data)
  
  if (!response.ok) throw new Error('Groq API error: ' + JSON.stringify(data.error))
  
  return data.choices[0].message.content
}
