const puppeteer = require("puppeteer")

const url = "https://www.facebook.com/toyotavnsports/posts/669934053429917"

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

const main = async () => {
  const browser = await puppeteer.launch({
    args: ["--incognito"],
    headless: false
  })

  const page = await browser.newPage()
  await page.goto(url)

  // remove CTA banner
  await page.evaluate(() => {
    const headerArea = document.querySelector("#headerArea")
    headerArea.parentElement.removeChild(headerArea)
  })

  // show comments
  const showCommentsButton = await page.$(`[href="${url}"]`)

  if (showCommentsButton) {
    await showCommentsButton.click()
  }

  // wait for comments to show
  await wait(1000)

  // force show all comments
  const commentViewMenu = await page.$(
    `[data-testid="UFI2ViewOptionsSelector/root"]`
  ).click()
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

  // // find and observe the block containing comments
  // await page.evaluate(() => {
  //   const listComments = document.querySelector(`[data-testid="UFI2CommentsList/root_depth_0"]`);
  //   const loadMoreComment = document.querySelector(`[data-testid="UFI2CommentsPagerRenderer/pager_depth_0"]`);

  //   // console.log('TCL: main -> listComments', listComments);
  //   // const observer = new MutationObserver(mutationsList => {
  //   //   console.log('TCL: main -> mutationsList', mutationsList);
  //   //   // Use traditional 'for loops' for IE 11
  //   //   // for (let mutation of mutationsList) {
  //   //   //   if (mutation.type === 'childList') {
  //   //   //     console.log('A child node has been added or removed.');
  //   //   //   } else if (mutation.type === 'attributes') {
  //   //   //     console.log('The ' + mutation.attributeName + ' attribute was modified.');
  //   //   //   }
  //   //   // }
  //   // });

  //   // observer.observe(listComments, { attributes: true, childList: true, subtree: true });
  // });

  // graceful cleanup
  process.on("SIGTERM", async () => {
    await browser.close()
  })
}

main().catch(console.error)
