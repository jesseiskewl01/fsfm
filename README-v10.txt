FSFM WEBSITE V10 — HOMEPAGE INTERACTION PASS

WHAT CHANGED
- Restores a visible vertical scrollbar and normal document scrolling.
- Changes the background behind the rounded Spotify embed to #121212, so the embed corners blend into the window.
- Fixes the Picture Frame empty-state CSS. A hidden placeholder now stays hidden when photos are loaded; the empty photo prompt is also removed.
- Adds real Minimize and Close buttons to the hero, About, Spotify, Events, Social and four new toy windows. Minimize collapses a window to its title bar; the small square button restores it. Close removes that window.
- Closing the hero produces a full-screen FSFM shutdown screen with a restart button. Browsers do not allow a page to close a tab it did not open, so this is a deliberate Windows-style simulation rather than a browser-tab close.
- Blank CMS-managed text on both the homepage and album page is hidden instead of leaving empty labels, badges or text boxes. An empty marquee list hides the marquee.
- Makes the entire Featured Release gadget clickable. Pages CMS now controls its artwork, title, description, link label and destination URL.
- Adds four homepage widgets: Barrel Roll, Bubble Frequency, FSFM Radio and Purble Place. Each has a simple show/hide switch in Pages CMS, and those switches apply on desktop, tablet and mobile layouts.
- The bubble slider starts halfway at the site's original bubble count and speed. Zero switches the bubbles off; the top of the slider doubles both the amount and movement speed. The visitor's slider setting is saved in that browser.
- FSFM Radio is a homepage-only play/pause switch for the supplied groovy.mp3 URL. It does not autoplay, and closing its window stops playback.
- Purble Place opens in a dimmed overlay window with a close button, Escape-key close and a fallback link to open the game in a new tab.
- Raises the marquee star slightly to centre it against the text.

PAGES CMS CHANGES
Open Homepage Gadgets to find the new Fun Widgets switches:
- Show Barrel Roll Button
- Show Bubble Frequency Slider
- Show Homepage Music Player
- Show Purble Place Shortcut

Open Site Content & Identity > Homepage Content to manage the Featured Release:
- Featured Release Title
- Featured Release Description
- Featured Release Artwork
- Featured Release Link Text
- Featured Release Destination URL

The destination accepts a local page such as `the-early-bird.html` or a full `https://` URL. The entire Featured Release card becomes the link.

DEPLOYMENT / MERGE
1. Back up your current GitHub repository.
2. Replace `index.html` with the v10 version.
3. Replace `the-early-bird.html` too. Its design, player, audio links, lyrics and track order are unchanged; the only addition is that blank CMS-managed text fields now hide cleanly.
4. Replace `.pages.yml` with the v10 version.
5. Replace `data/homepage-gadgets.json` and `data/site-content.json` with the v10 versions. If you have made fresh CMS edits since exporting v9, copy those values into the v10 JSON first, rather than overwriting them.
6. Preserve your existing `media/images/cover.png`, all uploaded Picture Frame photos, favicon and other media. The archive contains only an empty `.gitkeep` placeholder in `media/images/` and does not contain your uploaded images.
7. Preserve the `lyrics/` folder and all seven `.lrc` files. They are included unchanged.
8. Publish through your existing host and test the homepage in a desktop browser and a narrow/mobile viewport.

IMPORTANT NOTES
- No GitHub push or deployment has been performed. The package is ready for you to merge and publish.
- The Spotify background change is local styling around the embed. Spotify controls and content remain hosted by Spotify.
- The homepage audio player uses the exact groovy.mp3 URL you supplied. The file must remain publicly accessible at that URL.
- Purble Place is embedded from the third-party play-games.com URL you supplied. The provider may change or block iframe embedding; the fallback link remains available in the popup.
- Because the game is third-party content, its own availability, ads, cookies and behavior are controlled by its provider, not this website.
- The browser's reduced-motion preference suppresses the barrel-roll animation and the ambient bubble animation for accessibility.

VALIDATION
The package is checked for valid JSON and YAML, JavaScript syntax, archive integrity, unchanged album HTML and lyric files, and expected CMS fields. Third-party Spotify/game embeds and hosted audio playback still need a live browser test after deployment.
