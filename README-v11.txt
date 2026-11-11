FSFM WEBSITE V11 — DESKTOP GADGET POLISH PASS

WHAT CHANGED
- Reworked Barrel Roll, Bubble Frequency, FSFM Radio and Purble Place into genuine draggable Vista desktop gadgets, matching the existing Clock, Calendar, Picture Frame, Important Dates, Featured Release and Sticky Note gadgets. They are no longer full-width/normal-flow content windows.
- All four new gadgets use the existing desktop gadget drag system and saved browser positions. They follow the same large-desktop visibility breakpoint as the existing Clock and Calendar gadgets. Their show/hide controls remain simple booleans in Pages CMS.
- FSFM Radio now loops groovy.mp3 indefinitely while playing. It still starts only after the visitor presses PLAY; it does not autoplay.
- Closing the homepage hero window now shows a short shutdown transition and then redirects the current tab to the configured Spotify track. The redirect uses location.replace(), so the FSFM page is replaced in the current tab rather than added as another history entry.
- Added Homepage Shutdown Redirect URL under Site Content & Identity > Homepage Content in Pages CMS.
- Updated data/site-content.json and the embedded fallback values to the exact site-content defaults supplied by the artist, including the favicon, subtitle, marquee text, biography, featured album details and album statement.
- Kept the album page, seven track/lyric files, player, styling and audio URLs unchanged from v10.

IMPORTANT BROWSER LIMITATION
A webpage cannot forcibly close a browser tab that the visitor opened normally; modern browsers block window.close() unless that tab was opened by script. The homepage close button therefore exits FSFM by navigating the same tab to the configured destination. This is the closest reliable equivalent to shutting the desktop down and taking the visitor straight to Spotify.

PAGES CMS
- Homepage Gadgets > Fun Widgets still contains only four visibility switches:
  - Show Barrel Roll Button
  - Show Bubble Frequency Slider
  - Show Homepage Music Player
  - Show Purble Place Shortcut
- Site Content & Identity > Homepage Content now includes Homepage Shutdown Redirect URL.
- Existing Featured Release fields are unchanged.

DEPLOYMENT / MERGE
1. Back up the current GitHub repository.
2. Replace index.html with the v11 version.
3. Replace .pages.yml with the v11 version.
4. Replace data/site-content.json with the included data/site-content.json. It contains the artist's exact latest values and the new shutdown redirect destination.
5. IMPORTANT: Do not replace your existing data/homepage-gadgets.json wholesale. Merge only the four funWidgets boolean values from the included template into your current file. Preserve your current photos array, dates array, stickyNote text, and any other data you have entered through Pages CMS.
6. Preserve all existing media/images files, including cover.png, your favicon and uploaded Picture Frame photos. The archive contains only a placeholder in media/images/.
7. Preserve the existing lyrics folder and all seven .lrc files. They are included in the archive unchanged.
8. Publish through your current host. Test the draggable widgets, all four visibility switches, radio looping, Purble Place iframe and hero-close redirect after deployment.

VALIDATION
The package was checked for valid JSON/YAML, JavaScript syntax, ZIP integrity, presence of all four desktop gadgets, Pages CMS field coverage, loop audio attribute, redirect configuration, and unchanged album HTML and lyric files. External Spotify/game embeds and actual hosted audio playback still require a live browser test.
