FSFM WEBSITE V8 — DESKTOP GADGETS + PAGES CMS FOUNDATION

PACKAGE CONTENTS
- index.html: v7 homepage with the six new desktop gadgets.
- the-early-bird.html: preserved v7 album page.
- lyrics/: all seven LRC lyric files, unchanged.
- .pages.yml: the Pages CMS configuration supplied by the artist.
- data/homepage-gadgets.json: editable gadget content.
- media/images/: destination for images uploaded through Pages CMS.

GADGETS
1. Analog clock: displays the visitor's local time.
2. Calendar: navigable month view; dates from the CMS are marked.
3. Now Playing: compact homepage audio player using the same seven OGG source URLs as the album page.
4. Picture Frame: cycles through images stored in data/homepage-gadgets.json.
5. Important Dates: displays upcoming dates entered in Pages CMS.
6. Sticky Note: displays the message entered in Pages CMS.

LAYOUT AND STORAGE
- Gadgets are intentionally hidden below 1320px viewport width or below 700px viewport height. The mobile and smaller-screen layouts remain gadget-free.
- On larger desktop screens, gadgets begin scattered around the outer edges of the homepage.
- Drag a gadget by its title bar. Keyboard users can focus the title bar and move a gadget with the arrow keys (hold Shift for larger steps).
- Gadget positions are saved in localStorage in the visitor's browser. These positions are per-browser, not global CMS settings.
- Photos, dates and the sticky-note message are read from data/homepage-gadgets.json. Upload photos with Pages CMS; the configured public path is /media/images/.
- The home Now Playing widget is an independent mini-player. Audio does not continue between full-page navigation to the album page; use the album page's own player there.

DEPLOYMENT
1. Make a backup of the current GitHub repository before replacing files.
2. Upload/replace index.html and the-early-bird.html at the repository root.
3. Upload the lyrics folder and all seven LRC files at the repository root.
4. Add .pages.yml at the repository root.
5. Add data/homepage-gadgets.json and the media/ directory at the repository root.
6. Do not rename audio URLs, LRC files, or their paths.
7. The public website will only update when your existing host publishes the new GitHub contents. This package has not been deployed.

PAGES CMS
The .pages.yml file is preserved exactly as supplied. It exposes the homepage gadget JSON file for editing. Uploaded images are stored under media/images and written as /media/images/<filename> paths.

VALIDATION
- JavaScript syntax checked with Node.js.
- CSS and markup inspected for the six gadget IDs and CMS data path.
- The album page and seven LRC files are inherited unchanged from v7.
- Live hosting, external OGG playback, and Pages CMS UI validation require testing from the connected repository/domain after deployment.
