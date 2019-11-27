const Koa = require("koa")
const cors = require("@koa/cors")
const puppeteer = require("puppeteer")

const extractComments = require("./lib/puppeteer")

const app = new Koa()

// port will be assigned by heroku
const port = process.env.PORT || 3000

// use only 1 instance of browser
puppeteer
  .launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--incognito"],
    // set this to false to debug
    headless: true
  })
  .then(browser => {
    app.use(cors())
    app.use(async ctx => {
      const query = ctx.request.query

      if (!query.url) {
        ctx.body = {
          data: []
        }

        return
      }

      const decodedUrl = decodeURIComponent(query.url)
      const metadata = await extractComments(browser, decodedUrl)

      Object.assign(ctx.body, {
        data: metadata
      })

      return
    })

    app.listen(port)

    process.on("SIGTERM", async () => {
      await browser.close()
    })
  })
