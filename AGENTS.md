<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The Delux app (imported from Google AI Studio) lives in src/delux and renders client-only from the index route, because it stores everything in browser localStorage.
- AI assistant endpoints are server routes at /api/assistant/* backed by the Lovable AI Gateway (src/lib/delux), so the imported client fetch calls stay unchanged.
