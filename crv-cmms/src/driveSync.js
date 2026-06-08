// Google Drive sync via Anthropic API (Claude with Drive MCP)
// The app calls Claude with Drive MCP attached, asking it to read/write the data file.

const DRIVE_FILE_NAME = 'crv_cmms_data.json'

export async function loadFromDrive() {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: `You are a data sync assistant. Your only job is to read and return the contents of a file called "${DRIVE_FILE_NAME}" from Google Drive. Return ONLY the raw JSON content of the file, nothing else. No explanation, no markdown, no backticks. If the file does not exist, return the exact string: FILE_NOT_FOUND`,
        messages: [{ role: 'user', content: `Read the file ${DRIVE_FILE_NAME} from Google Drive and return its full JSON contents.` }],
        mcp_servers: [{ type: 'url', url: 'https://drivemcp.googleapis.com/mcp/v1', name: 'google-drive' }],
      }),
    })
    const data = await res.json()
    const text = data.content?.map(b => b.text || '').join('').trim()
    if (!text || text === 'FILE_NOT_FOUND') return null
    return JSON.parse(text)
  } catch (e) {
    console.warn('Drive load failed:', e)
    return null
  }
}

export async function saveToDrive(payload) {
  try {
    const json = JSON.stringify(payload, null, 2)
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: `You are a data sync assistant. Your only job is to save JSON data to Google Drive. Save the data the user provides as a file named "${DRIVE_FILE_NAME}". If the file already exists, overwrite it. Reply only with: SAVED`,
        messages: [{ role: 'user', content: `Save this to Google Drive as ${DRIVE_FILE_NAME}:\n\n${json}` }],
        mcp_servers: [{ type: 'url', url: 'https://drivemcp.googleapis.com/mcp/v1', name: 'google-drive' }],
      }),
    })
    const data = await res.json()
    const text = data.content?.map(b => b.text || '').join('').trim()
    return text.includes('SAVED')
  } catch (e) {
    console.warn('Drive save failed:', e)
    return false
  }
}
