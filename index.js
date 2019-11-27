const Koa = require("koa")
const cors = require("@koa/cors")
const puppeteer = require("puppeteer")

const extractComments = require("./lib/puppeteer")

const app = new Koa()

// use only 1 instance of browser
puppeteer
  .launch({
    args: ["--incognito"],
    // set this to true to debug
    headless: false
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

      ctx.body = {
        data: metadata
      }

      return
    })

    app.listen(3000)

    process.on("SIGTERM", async () => {
      await browser.close()
    })
  })
