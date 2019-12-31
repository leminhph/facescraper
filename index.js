/* eslint-disable require-atomic-updates */
const Koa = require("koa")
const cors = require("@koa/cors")
const bodyParser = require('koa-bodyparser')

const puppeteer = require("puppeteer")

const getComments = require("./lib/getComments")
const getPageID = require('./lib/getPageID')
const getPageFans = require('./lib/getPageFans')

const app = new Koa()

const port = process.env.PORT || 3333

// use only 1 instance of browser
puppeteer
  .launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--incognito"],
    // set this to false to debug
    headless: process.env.HEADLESS === 'true' ? true : false
  })
  .then(browser => {
    app.use(cors())
    app.use(bodyParser())
    app.use(async ctx => {
      const query = ctx.request.query
      const requestBody = ctx.request.body

      if (!query.url && !query.action) {
        ctx.body = {
          data: []
        }

        return
      }

      const decodedUrl = decodeURIComponent(query.url)

      switch (query.action) {
      case 'getPageFans': {
        const pageFans = await getPageFans(browser, requestBody)

        ctx.body = {
          data: pageFans
        }

        return
      }
      case 'getPageID': {
        const pageId = await getPageID(browser, decodedUrl)

        ctx.body = {
          data: {
            id: pageId
          }
        }

        return
      }
      default: {
        const comments = await getComments(browser, decodedUrl)
        ctx.body = {
          data: comments
        }

        return
      }
      }
    })

    app.listen(port)

    process.on("SIGTERM", async () => {
      await browser.close()
    })
  })
