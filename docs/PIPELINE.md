# HADP Preview Pipeline

The Human-Approved Deployment Pipeline (HADP) is how changes move from an idea into the live site. It keeps the CEO in visual control without slowing the work down.

## The Flow

1. **Feature branch per task.** Every change starts on its own branch, named for the task. Work stays isolated until it is ready to review.

2. **Vercel auto-builds a preview URL.** The moment the branch is pushed, Vercel builds it and publishes a private preview link — a live, clickable version of the change.

3. **CEO approves visually in Slack.** The preview link is posted to Slack. The CEO opens it, looks at the actual result, and says yes or requests changes. No code reading required.

4. **Bridge merges to main.** Once approved, the branch is merged into the main branch.

5. **Vercel auto-deploys production.** Merging triggers an automatic production deploy. The change is live within minutes.
