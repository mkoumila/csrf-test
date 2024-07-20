const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
 
const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3001
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

const { createCsrfProtect, CsrfError } = require("@edge-csrf/node-http")

// initalize csrf protection middleware
const csrfProtect = createCsrfProtect({
	cookie: {
		secure: true,
	},
})

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // apply csrf protection
	  await csrfProtect(req, res)

      const parsedUrl = parse(req.url, true)
 
      await handle(req, res, parsedUrl)
      
    } catch (err) {
      if (err instanceof CsrfError) {
          res.writeHead(403)
          res.end("invalid csrf token")
          throw new Error(err)
      }
      
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})