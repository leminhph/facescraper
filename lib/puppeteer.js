const { wait } = require("./utils")

// https://www.facebook.com/toyotavnsports/posts/669934053429917
// https://www.facebook.com/toyotavnsports/videos/2391237544492248
const extractComments = async (browser, url) => {
  const page = await browser.newPage()
  await page.goto(url)

  try {
    // remove right column that may contains comment section of other posts
    await page.evaluate(() => {
      const rightCol = document.querySelector("#rightCol")

      if (rightCol) {
        // just remove the first child node so layout won't break
        rightCol.removeChild(rightCol.firstChild)
      }
    })

    // remove CTA banner
    await page.evaluate(() => {
      const headerArea = document.querySelector("#headerArea")

      if (headerArea) {
        headerArea.parentElement.removeChild(headerArea)
      }
    })

    // show comments
    const showCommentsButton = await page.$(
      `[data-testid="UFI2CommentsCount/root"]`
    )

    if (showCommentsButton) {
      await showCommentsButton.click()
    }

    // wait for comments to show
    await wait(1000)

    // force show all comments
    const commentViewMenu = await page.$(
      `[data-testid="UFI2ViewOptionsSelector/root"]`
    )
    await commentViewMenu.click()

    /**
     * 1. Most relevant
     * 2. Latest
     * 3. Show all
     */
    const commentViewOptions = await page.$$(
      `[data-testid="UFI2ViewOptionsSelector/menuOption"]`
    )
    await commentViewOptions[commentViewOptions.length - 1].click()

    // wait for all comments to load
    await wait(1000)

    // keep loading comments until exhausted
    let exhausted = false

    while (!exhausted) {
      const loadMoreCommentButton = await page.$(
        `[data-testid="UFI2CommentsPagerRenderer/pager_depth_0"]`
      )

      if (!loadMoreCommentButton) {
        exhausted = true
        break
      }

      await loadMoreCommentButton.hover()
      await loadMoreCommentButton.click()
      await wait(1000)
    }

    // get all comment rows in the page
    const commentBlocks = await page.$$(
      `[data-testid="UFI2Comment/root_depth_0"]`
    )

    const parseComment = block => {
      return page.evaluate(element => {
        const metadata = {}

        // get comment id
        const dataFt = element.getAttribute("data-ft")
        const { ct: encoded } = JSON.parse(dataFt)
        // use atob cuz browser context
        metadata.id = atob(encoded)
          .split(":")
          .pop()

        // get username & user id
        const commentBody = element.querySelector(
          `[data-testid="UFI2Comment/body"]`
        )
        const user = commentBody.querySelector("a")

        if (user) {
          const id = user.href.split("/").pop()
          const name = user.textContent

          Object.assign(metadata, {
            from: {
              id,
              name
            }
          })
        }

        return metadata
      }, block)
    }

    const results = await Promise.all(commentBlocks.map(parseComment))

    return results
  } catch (error) {
    console.error(error)

    return []
  } finally {
    await page.close()
  }
}

module.exports = extractComments
