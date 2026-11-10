FSFM WEBSITE V9 — CMS-EDITABLE HOMEPAGE + ALBUM IDENTITY

WHAT CHANGED
- Retains the v8 Windows Vista / Frutiger Aero visual language and existing hero window as the design reference.
- The homepage hero's title bar, badge, title, subtitle and artist handle are editable through Pages CMS.
- The marquee is now populated from a repeatable Pages CMS list. Add, remove, reorder and rewrite messages in Site Content & Identity > Homepage Content > Marquee Messages. The clickable star remains between messages and still cycles wallpapers.
- Homepage bio and album artist statement are editable in Pages CMS.
- The homepage bio, Spotify artist embed, Bandsintown events and social links now sit in Vista-style glass windows.
- Spotify embed now fills a constrained window body rather than floating as a standalone embed.
- Bandsintown and social sections have matching Vista window title bars.
- The homepage social icons have been refurbished with a consistent glossy Aero treatment.
- The homepage mini audio player has been replaced with a Featured Release gadget. It does not start a competing audio stream or pretend playback can continue between pages.
- The album page cover artwork references now point to /media/images/cover.png.
- Browser tab titles, shared site name, page description and favicon image are editable through Pages CMS.

PAGES CMS CONTENT
The existing Homepage Gadgets editor is preserved in .pages.yml and still edits:
- Picture Frame Photos
- Important Dates
- Sticky Note

A new Site Content & Identity editor writes data/site-content.json. It controls:
- Website name and browser tab titles for both pages
- Favicon image upload
- Site description
- Homepage hero copy, marquee message list, bio, window headings, featured release text
- Album title, artist line, artist statement, player heading and Spotify label
- Shared footer text

FAVICON
The CMS field is ready for your chosen icon. It is intentionally blank in the default JSON because you said you wanted to choose the icon yourself. Upload it through the Favicon Image field. Pages CMS will save it into media/images and store its public path in data/site-content.json.

ALBUM ARTWORK
Both pages now use /media/images/cover.png. You said that you have already uploaded cover.png to the Pages CMS images folder. Before deployment, confirm that the committed repository contains media/images/cover.png with that exact filename. The archive includes media/images/.gitkeep but does not include your private/uploaded artwork.

MARQUEE EDITING
In Pages CMS, open Site Content & Identity > Homepage Content > Marquee Messages. Each list item becomes one scrolling message. Reorder the items to change the sequence. The wallpaper-cycle star is generated automatically between messages and is not part of the editable text list.

DEPLOYMENT
1. Back up the current GitHub repository.
2. Upload/replace index.html and the-early-bird.html at the repository root.
3. Preserve the existing lyrics/ directory and all seven .lrc files.
4. Upload the updated .pages.yml at the repository root.
5. Add data/site-content.json while retaining data/homepage-gadgets.json.
6. Preserve media/images/cover.png and any photographs already uploaded there. Do not replace the media folder with the archive's empty placeholder.
7. Publish through your existing hosting provider after inspecting the changes.

IMPORTANT
- No changes have been pushed to GitHub or deployed.
- The homepage and album page still use separate page loads. The homepage now features the album rather than a second player, avoiding the playback interruption issue rather than pretending it is solved.
- Existing OGG audio URLs, album player functionality, lyric files, and track order are unchanged.
- The site-content fetch uses fallback copy so the pages remain readable if the CMS JSON file is temporarily unavailable.

VALIDATION
- JavaScript syntax checks are included in the build process.
- JSON and YAML parse checks are included.
- External Spotify and Bandsintown embeds, hosted OGG playback, and the live CMS repository connection require testing after deployment.
