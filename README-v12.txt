FSFM WEBSITE V12 — CMS PAGE-BUILDER FOUNDATION

WHAT THIS VERSION ADDS
- Keeps the V11 homepage as the bespoke Vista desktop experience. It remains the only page with draggable desktop gadgets.
- Keeps The Early Bird.... as its bespoke amber/gold editorial album experience, including the existing seven-track player and synced lyrics.
- Updates data/site-content.json and the homepage's embedded fallback to the latest exact text supplied by the artist, including “jesse freaking scarsbrook”, “OUT NOW....”, and the Ü marquee line.
- Preserves data/homepage-gadgets.json exactly as found in the V11 archive.
- Adds a Pages CMS Pages collection. Each page is a JSON entry in content/pages/ and can be created, edited, renamed, reordered, published/unpublished and deleted through the collection.
- Adds page settings for page type (Vista windows, Editorial, Minimal), navigation visibility, ordering, wallpaper preset/custom image, and per-page SEO/share metadata.
- Adds ordered, hideable blocks: Hero, Marquee, Text, Image, Embed Window, Release Card, Music Player, Divider and Spacer.
- Adds a static page builder. Published entries generate crawlable HTML at /pages/{slug}/index.html.
- Vista-style generated pages use glass windows with close/minimise controls, open transitions, hover states and reduced-motion support. Editorial and Minimal page types use their own visual treatment.
- Generates a sitemap from the homepage, album page and currently published CMS pages. Unpublished/deleted pages are excluded on the next build.
- Adds MusicGroup structured data to the homepage, MusicAlbum structured data and social metadata to the album page, and WebPage/BreadcrumbList structured data to generated pages.

CONTENT PRESERVATION
- The current Site Content & Identity editor remains in place for the bespoke homepage and album page. Its fields and exact current values are preserved. This avoids flattening the homepage's unique desktop system or the album's custom media player into generic blocks.
- Existing homepage gadget controls remain in Homepage Gadgets.
- The V11 ZIP contains placeholder-only media/images/. It does not contain the artist's actual favicon, cover art, picture-frame images or other uploaded media. Keep the live repository's entire media/ folder when merging this package. Do not delete or replace existing media.
- The V11 README says to preserve the live repository's current photos, dates and stickyNote values in data/homepage-gadgets.json. This archive's copy is only the V11 template. Before deployment, compare your live repository's data/homepage-gadgets.json and merge your personal values into the V12 copy.
- Preserve the live repository's current media/, data/homepage-gadgets.json, and any other CMS content that is not represented in this archive.

BUILD
- Node.js 18 or newer is recommended.
- Run `npm run build` before deployment. This generates /pages/ and refreshes sitemap.xml.
- The build script clears and recreates the generated /pages/ directory. Treat /pages/ as build output, not as a place for hand-authored pages.
- No third-party npm dependencies are required.

DEPLOY / MERGE
1. Back up the live GitHub repository.
2. Merge the V12 files into the repository. Preserve the current media/ directory and the current data/homepage-gadgets.json personal values.
3. Preserve the existing lyrics folder and all seven .lrc files. They are included unchanged.
4. Run `npm run build` and inspect the generated page HTML and sitemap.xml.
5. Upload/deploy as usual.
6. Test the homepage, album player and lyrics, desktop gadgets, embeds/audio, new page navigation, mobile layout and a newly published test page.

PAGES CMS NOTES
- Existing “Site Content & Identity” and “Homepage Gadgets” editors remain available.
- The new Pages collection stores one JSON file per page in content/pages/.
- A starter page is included but unpublished. Duplicate it or create a new entry, then publish it.
- New pages are rendered from their ordered block list. The homepage and album page intentionally remain bespoke templates in this version because their unique interactions need dedicated block components before they can safely move into the same renderer.
- `pageType` selects Vista windows, Editorial or Minimal for generated pages. Wallpaper choices include four Vista colourways, Aurora and a custom image.

SEO NOTES
- The canonical site URL is https://fsfm.port82.net/. Update the site URL in the build script, data/site-content.json, and sitemap configuration if the domain changes.
- Structured data helps search engines interpret the site; it does not guarantee indexing, rankings or rich results.
- Generated page content is static HTML, so headings and text are present in the source rather than depending entirely on client-side rendering.
- Submit sitemap.xml through the relevant search engine webmaster tools after deployment.

VALIDATION
- JSON and YAML parse successfully.
- Build script passes Node syntax validation and generates the sitemap.
- V11 album HTML, all seven LRC files and homepage gadget defaults are retained before the SEO build step; album HTML receives generated metadata only.
- Actual Pages CMS rendering, hosted embeds/audio and search-engine indexing still require live testing.
