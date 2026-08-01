# Dealers

Exterior cover photography for dealer profiles, and the fallback mark a dealership wears until it uploads its own.

**How assets arrive here:** Founder approval, and only Founder approval.

    node scripts/media/shortlist-candidates.mjs <brief-id>   # collect 3–5 candidates
    open http://localhost:3003/admin/creative/media-review   # review and approve

Nothing in this directory was chosen by software. Do not add, edit or overwrite a file here by
hand — an image that appears without an approval is an image nobody decided on, and the licence
and attribution the site renders come from the manifest, not from the file.

---

Review briefs filed here: `dealer-cover`, `dealer-logo`.

Taxonomy is defined in `scripts/media/lib/library.mjs`. Provenance for every approved asset is
recorded in `public/media/premium/manifest.json` and read by the application through
`src/config/media`. See `docs/experience-bible/10-creative-direction.md`.
