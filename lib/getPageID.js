module.exports = async (browser, url) => {
  const page = await browser.newPage()
  await page.goto(url)

  try {
    const metas = await page.$$(
      `meta[property^="al:"][property$=":url"]`
    )

    const detected = await Promise.all(metas.map(meta => {
      return page.evaluate(element => {
        const property = element.getAttribute('property')
        const content = element.getAttribute('content')
        const url = new URL(content)

        // <meta property="al:android:url" content="fb://page/${pageID}?referrer=app_link">
        if (property === 'al:android:url') {
          const pathname = url.pathname
          const pageId = pathname.split('/').pop()

          return pageId
        }

        // <meta property="al:ios:url" content="fb://page/?id=${pageId}">
        if (property === 'al:ios:url') {
          const pageId = url.searchParams.get('id')

          return pageId
        }

        return undefined
      }, meta)
    }))

    return detected.find(e => e !== undefined && e !== null)
  } catch (error) {
    console.error(error)

    return null
  } finally {
    await page.close()
  }
}
