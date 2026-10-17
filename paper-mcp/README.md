# paper-mcp

An [MCP](https://modelcontextprotocol.io) (stdio) server that gives agents programmatic
access to your Paper documents: list/move/organize files, upload images and PDFs,
run the AI image→markdown conversion, and pull the combined markdown back out.

It talks to the same Convex backend as the app over plain HTTPS and reuses the
existing `userCodeAuth` sign-in (the same "user code" session system the app uses).

## Setup

```bash
cd paper-mcp
npm install
```

Configure the Convex URL — any one of:

- env `PAPER_CONVEX_URL` (e.g. `https://your-app.convex.cloud`)
- the `paper_configure` tool at runtime (persisted to `~/.paper-mcp/config.json`)
- an `.env.local` with `EXPO_PUBLIC_CONVEX_URL` in the repo root

Sign in — any one of:

- env `PAPER_SESSION_TOKEN` — **recommended for Google/Clerk accounts**: log into
  the app, open Profile → "Create agent token", and paste the token here.
- env `PAPER_USER_CODE` (exchanged for a session token, cached in `~/.paper-mcp/session.json`)
- the `paper_sign_in` tool at runtime

> User codes come from the `PAPER_USER_CODES_JSON` env var configured on the
> Convex deployment (`{"<code>": {"userId": "...", "name": "...", "email": "..."}}`).
> Agent tokens come from the app's Profile dialog (requires a signed-in account)
> and live as revocable `user_code_sessions` rows.
> Either way, a valid session token grants full access to that user's lists —
> treat it like a password.

## MCP config

```json
{
  "mcpServers": {
    "paper": {
      "command": "node",
      "args": ["/absolute/path/to/paper-mcp/src/index.mjs"],
      "env": {
        "PAPER_CONVEX_URL": "https://your-app.convex.cloud",
        "PAPER_USER_CODE": "your-user-code"
      }
    }
  }
}
```

## Tools

| Tool | What it does |
| --- | --- |
| `paper_configure` | Save the Convex deployment URL |
| `paper_sign_in` | Exchange a user code for a session token |
| `paper_whoami` | Show the active session / auth state |
| `paper_list_folders` | All folders (id, name, parentId) |
| `paper_create_folder` / `paper_rename_folder` / `paper_move_folder` / `paper_delete_folder` | Folder CRUD. Move refuses cycles; delete unfiles docs and reparents children (same as the app) |
| `paper_list_documents` | All documents, or filtered by `folderId` (`null` = unfiled) |
| `paper_get_document` | Document + all pages (imageUrl, markdown, pageNumber) |
| `paper_get_markdown` | Combined markdown for a whole document; optional `outputPath` writes a file |
| `paper_create_document` / `paper_rename_document` / `paper_move_document` / `paper_delete_document` | Document CRUD |
| `paper_add_image_page` | Upload an image (local path or URL) as a new page |
| `paper_convert_page` | AI-convert one page to markdown (`guidance`, `followUpPrompt` supported) |
| `paper_convert_document` | Convert every page that has an image (4-way concurrency) |
| `paper_import_pdf` | **Full pipeline:** PDF → page images → upload → document → per-page markdown. `source` is a local path or URL; `convert` defaults to `true` |

## Typical agent workflows

Import a PDF and get markdown out:

```
paper_import_pdf { "source": "~/Downloads/week6.pdf", "title": "Week 6" }
```

Move things around:

```
paper_list_folders {}
paper_move_document { "documentId": "abc123", "folderId": "f456" }
paper_move_folder   { "folderId": "f456", "parentId": null }
```

## Notes

- Writes go through the app's own `user_lists` mutations, so everything the MCP
  server does shows up in the app immediately (Convex subscriptions).
- Pages are uploaded via UploadThing exactly like the app; PDFs are rasterized
  with mupdf (WASM — no native deps) at 2x scale.
- Conversion calls the same `mathAi:convertMathImageToMarkdown` action the app uses.
