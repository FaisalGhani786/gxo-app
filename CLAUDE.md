@AGENTS.md

# Commit identity

Author commits as the repository owner — `FaisalGhani786 <80543985+FaisalGhani786@users.noreply.github.com>` —
with Claude as the committer (`Claude <noreply@anthropic.com>`) and a `Co-Authored-By` trailer. Vercel's Hobby
plan blocks deployments from commits whose author it can't match to the Vercel account owner:

    GIT_COMMITTER_NAME=Claude GIT_COMMITTER_EMAIL=noreply@anthropic.com git commit ...

# Database changes

Schema changes go in a new file in `supabase/migrations/` (never edit an applied one). The
`Supabase migrations` GitHub Action applies them to the hosted project when they reach `main`.
