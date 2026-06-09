// Google Drive sync — OAuth2 direct integration
// Client ID: 363218005929-du0kk0sot9hjrkltube6tq67v7b7etsa.apps.googleusercontent.com

const CLIENT_ID = '363218005929-du0kk0sot9hjrkltube6tq67v7b7etsa.apps.googleusercontent.com'
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file'
const FILE_NAME = 'crv_cmms_data.json'

let tokenClient = null
let accessToken = null

function loadGapi() {
  return new Promise((resolve) => {
    if (window.gapi) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.onload = () => window.gapi.load('client', resolve)
    document.head.appendChild(script)
  })
}

function loadGis() {
  return new Promise((resolve) => {
    if (window.google?.accounts) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.onload = resolve
    document.head.appendChild(script)
  })
}

async function initGapi() {
  await window.gapi.client.init({
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  })
}

async function getToken() {
  return new Promise((resolve, reject) => {
    if (accessToken) { resolve(accessToken); return }
    if (!tokenClient) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (resp) => {
          if (resp.error) { reject(resp.error); return }
          accessToken = resp.access_token
          resolve(accessToken)
        },
      })
    }
    tokenClient.requestAccessToken({ prompt: accessToken ? '' : 'consent' })
  })
}

async function findFile() {
  const resp = await window.gapi.client.drive.files.list({
    spaces: 'appDataFolder',
    q: `name='${FILE_NAME}'`,
    fields: 'files(id,name)',
  })
  return resp.result.files?.[0] || null
}

export async function initDriveSync() {
  try {
    await loadGapi()
    await initGapi()
    await loadGis()
    return true
  } catch (e) {
    console.warn('Drive init failed:', e)
    return false
  }
}

export async function signInGoogle() {
  try {
    await initDriveSync()
    await getToken()
    return true
  } catch (e) {
    console.warn('Google sign-in failed:', e)
    return false
  }
}

export function isSignedIn() {
  return !!accessToken
}

export async function loadFromDrive() {
  try {
    if (!accessToken) return null
    const file = await findFile()
    if (!file) return null
    const resp = await window.gapi.client.drive.files.get({
      fileId: file.id,
      alt: 'media',
    })
    return JSON.parse(resp.body)
  } catch (e) {
    console.warn('Drive load failed:', e)
    return null
  }
}

export async function saveToDrive(payload) {
  try {
    if (!accessToken) return false
    const json = JSON.stringify(payload, null, 2)
    const existing = await findFile()

    const metadata = { name: FILE_NAME, parents: existing ? undefined : ['appDataFolder'] }
    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('media', new Blob([json], { type: 'application/json' }))

    const url = existing
      ? `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'

    const method = existing ? 'PATCH' : 'POST'

    const resp = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    })
    return resp.ok
  } catch (e) {
    console.warn('Drive save failed:', e)
    return false
  }
}
