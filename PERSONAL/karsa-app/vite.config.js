import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import ical from 'node-ical'

function itsCalendarProxy(icsUrl) {
  const handler = async (req, res) => {
    if (req.url !== '/api/its-calendar') return false

    if (!icsUrl) {
      res.statusCode = 503
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ error: 'ITS_CALENDAR_ICS_URL not configured in .env.local' }))
      return true
    }

    try {
      const data = await ical.async.fromURL(icsUrl)
      const events = Object.values(data)
        .filter((item) => item.type === 'VEVENT' && !item.rrule)
        .map((item) => ({
          uid: item.uid,
          title: item.summary || 'Untitled event',
          start: item.start ? new Date(item.start).toISOString() : null,
          end: item.end ? new Date(item.end).toISOString() : null,
          description: item.description || '',
        }))
      res.statusCode = 200
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify(events))
    } catch (err) {
      res.statusCode = 502
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ error: err.message || 'Failed to fetch/parse ITS calendar feed' }))
    }
    return true
  }

  return {
    name: 'its-calendar-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        handler(req, res).then((handled) => {
          if (!handled) next()
        })
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        handler(req, res).then((handled) => {
          if (!handled) next()
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), itsCalendarProxy(env.ITS_CALENDAR_ICS_URL)],
  }
})
