# Backgrounds

Full-bleed editorial plates behind long-form sections. Judged on how much quiet area they hold, not on their subject.

**How assets arrive here:** Founder approval, and only Founder approval.

    node scripts/media/shortlist-candidates.mjs <brief-id>   # collect 3–5 candidates
    open http://localhost:3003/admin/creative/media-review   # review and approve

Nothing in this directory was chosen by software. Do not add, edit or overwrite a file here by
hand — an image that appears without an approval is an image nobody decided on, and the licence
and attribution the site renders come from the manifest, not from the file.

---

Review briefs filed here: `editorial-buyers`.

Taxonomy is defined in `scripts/media/lib/library.mjs`. Provenance for every approved asset is
recorded in `public/media/premium/manifest.json` and read by the application through
`src/config/media`. See `docs/experience-bible/10-creative-direction.md`.
