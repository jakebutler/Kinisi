# Developer Workflow: Automated and Manual Tasks

This documentation outlines the workflow for maintaining a clean, healthy repository and automating as much as possible. It also highlights the tasks you must complete manually.

---

## Automated Tasks (Handled by Scripts/CI)

### 1. Clean Up Merged Remote Branches
- **Automated by script:**
  - Fetches latest remote branches and prunes deleted ones.
  - Deletes all remote branches merged into `main` (except `main`, `master`, `HEAD`).

### 2. Clean Up Merged Local Branches
- **Automated by script:**
  - Deletes all local branches merged into `main` (except `main`, `master`, current branch).

### 3. Run Tests Before Commit (Optional, if Husky is set up)
- **Automated by pre-commit hook:**
  - Runs `npm test` before allowing a commit.

### 4. Run Tests and Lint on Push/PR (CI)
- **Automated by GitHub Actions:**
  - Runs tests and lint checks on every push and pull request.

---

## Manual Tasks (You Must Complete)

### 1. Review and Approve Pull Requests
- Check PRs for code quality, test coverage, and merge when ready.

### 2. Create Pull Requests
- After pushing a branch, open a PR on GitHub (or use `gh pr create`).

### 3. Resolve Merge Conflicts
- If a PR cannot be merged automatically, resolve conflicts locally and push the fix.

### 4. Review Branch Deletion List
- Before running the branch cleanup script, review the list of branches to be deleted to avoid accidental loss of important work.

### 5. Set Up Automation (One-Time)
- Set up GitHub Actions workflows and Husky pre-commit hooks if not already configured.

---

## Example Scripts

### Clean Up Merged Remote Branches
```bash
git fetch --prune
git branch -r --merged origin/main | grep -vE 'origin/(main|master|HEAD)' | sed 's/origin\///' | xargs -n 1 git push origin --delete
```

### Clean Up Merged Local Branches
```bash
git branch --merged main | grep -vE '(^\*|main|master)' | xargs -n 1 git branch -d
```

---

## Recommended One-Time Setup

1. **Set up Husky for pre-commit tests:**
   ```bash
   npx husky-init && npm install
   npx husky add .husky/pre-commit "npm test"
   ```
2. **Set up GitHub Actions for CI:**
   - Add a `.github/workflows/ci.yml` file with test/lint jobs.

---

## Workflow Summary Table

| Task                        | Automated | Manual |
|-----------------------------|:---------:|:------:|
| Clean merged remote branches|     ✓     |        |
| Clean merged local branches |     ✓     |        |
| Run tests on commit         |     ✓     |        |
| Run tests on push/PR        |     ✓     |        |
| TypeScript type check       |     ✓     |        |
| Security audit              |     ✓     |        |
| Code coverage reporting     |     ✓     |        |
| PR labeling                 |     ✓     |        |
| Stale PR/issue management   |     ✓     |        |
| Review/merge PRs            |           |   ✓    |
| Create PRs                  |           |   ✓    |
| Resolve merge conflicts     |           |   ✓    |
| Review branch deletion      |           |   ✓    |
| Set up automation           |           |   ✓    |

---

## After Automation: What You Still Need To Do
- Review and merge PRs
- Create PRs for new features/fixes
- Resolve merge conflicts
- Occasionally review the branch deletion list
- Maintain and update automation scripts/workflows as needed

---

For any questions or to update automation, see this documentation or contact the repo maintainer.
