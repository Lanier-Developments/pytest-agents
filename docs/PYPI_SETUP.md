# PyPI Publishing Setup Guide

This guide walks you through setting up automated PyPI publishing for pytest-agents using GitHub's trusted publishing feature.

## Why Trusted Publishing?

GitHub's trusted publishing uses OpenID Connect (OIDC) instead of long-lived API tokens:

- **More Secure**: No secrets to manage or rotate
- **Automatic**: Works seamlessly with GitHub Actions
- **Recommended**: PyPI's preferred authentication method

## Prerequisites

- GitHub repository with release workflow (✅ already configured)
- PyPI account

## Step-by-Step Setup

### 1. Create PyPI Account

If you don't have a PyPI account yet:

1. Go to https://pypi.org
2. Click **Register** in the top right
3. Fill in the registration form:
   - Username
   - Email address (you'll need to verify this)
   - Password
4. Check your email and click the verification link
5. Log in to PyPI

**Optional but Recommended:**
- Enable two-factor authentication (2FA)
  - Account Settings → Two factor authentication
  - Use an authenticator app (Google Authenticator, Authy, etc.)

### 2. Configure Trusted Publisher

**Important:** Do this BEFORE the first release.

1. Log in to PyPI at https://pypi.org

2. Navigate to **Publishing** settings:
   - Click your username (top right) → **Account settings**
   - Click **Publishing** in the left sidebar
   - Or go directly to: https://pypi.org/manage/account/publishing/

3. Scroll to **"Add a new pending publisher"**

4. Fill in the form with these EXACT values:

   ```
   PyPI Project Name:        superclaude
   Owner:                    kmcallorum
   Repository name:          pytest-agents
   Workflow name:            release.yml
   Environment name:         (leave blank)
   ```

5. Click **Add**

6. You should see the pending publisher listed:
   ```
   superclaude (pending)
   Owner: kmcallorum
   Repository: pytest-agents
   Workflow: release.yml
   ```

### 3. Verify Configuration

The trusted publisher is now registered. On the next release:

1. The GitHub Action will publish to PyPI
2. PyPI will automatically create the `superclaude` project
3. The "pending" status will change to "active"

**Check current configuration:**
```bash
# View pending publishers
# Go to: https://pypi.org/manage/account/publishing/
```

### 4. Test the Setup

Trigger a test release to verify everything works:

**Option A: Push a feature commit**
```bash
git commit -m "feat: test PyPI publishing setup"
git push
```

**Option B: Manual workflow trigger**
```bash
# Trigger release workflow manually
gh workflow run release.yml
```

**Monitor the release:**
```bash
# Watch the workflow
gh run watch

# Check if published to PyPI
# Visit: https://pypi.org/project/superclaude/
```

### 5. Verify Package Installation

Once published, verify the package can be installed:

```bash
# Create test environment
python -m venv test-env
source test-env/bin/activate  # On Windows: test-env\Scripts\activate

# Install from PyPI
pip install superclaude

# Verify installation
superclaude version

# Test basic functionality
superclaude verify

# Cleanup
deactivate
rm -rf test-env
```

## Troubleshooting

### "Project name already exists"

**Issue:** Someone else has already claimed the `superclaude` name on PyPI.

**Solution:**
1. Choose a different name (e.g., `superclaude-ai`, `superclaude-framework`)
2. Update `pyproject.toml`:
   ```toml
   [project]
   name = "superclaude-ai"  # Change this
   ```
3. Update the trusted publisher configuration on PyPI
4. Commit and push the change

### "Invalid Publisher Configuration"

**Issue:** The workflow can't authenticate with PyPI.

**Check:**
1. Verify the PyPI project name matches exactly
2. Confirm owner/repo/workflow names are correct
3. Ensure workflow has `id-token: write` permission (✅ already configured)

**Fix:**
1. Go to https://pypi.org/manage/account/publishing/
2. Delete the pending publisher
3. Re-add with correct values

### "Package already exists" Error

**Issue:** Trying to re-publish the same version.

**Solution:**
Versions are immutable on PyPI. Create a new release:
```bash
git commit -m "fix: update package metadata"
git push
```

This will trigger a new version (e.g., 0.2.1).

### First Publish Fails

**Issue:** The first publish might fail if there's a race condition.

**Solution:**
1. Check the workflow logs: `gh run view --log-failed`
2. If it's a timeout or temporary error, re-run:
   ```bash
   gh run rerun <run-id>
   ```

## Managing Releases

### View Published Versions

```bash
# Via pip
pip index versions superclaude

# Via PyPI website
# Visit: https://pypi.org/project/superclaude/#history
```

### Download Statistics

View package download stats:
- PyPI Stats: https://pypistats.org/packages/superclaude
- Libraries.io: https://libraries.io/pypi/superclaude

### Yanking a Release

If you need to remove a bad release:

1. Go to https://pypi.org/project/superclaude/
2. Select the version
3. Click **Options** → **Yank release**
4. Provide a reason (e.g., "Critical security issue")

**Note:** Yanked releases are still installable with explicit version but won't be installed by default.

### Deleting Releases

**You cannot delete releases from PyPI** once published. You can only yank them.

If you absolutely need to remove something:
- Contact PyPI support: https://pypi.org/help/
- Be prepared to explain why (usually only for legal/security reasons)

## Security Best Practices

### 1. Enable 2FA on PyPI

Two-factor authentication adds an extra security layer:

1. Account Settings → Two factor authentication
2. Scan QR code with authenticator app
3. Save recovery codes in a secure location

### 2. Monitor Publishing Activity

PyPI will email you when:
- A new version is published
- Account settings change
- New publishers are added

Review these emails to detect unauthorized activity.

### 3. Review Workflow Permissions

The release workflow has minimal permissions:
```yaml
permissions:
  contents: write     # For git commits/tags
  packages: write     # For Docker images
  id-token: write     # For PyPI publishing
```

**Never add** additional permissions unless absolutely necessary.

### 4. Audit Trusted Publishers

Regularly review configured publishers:
1. Go to https://pypi.org/manage/account/publishing/
2. Remove any publishers you don't recognize
3. Update if you rename repos or change workflows

## Advanced Configuration

### Multiple Package Names

If publishing multiple packages from one repo:

**pyproject.toml:**
```toml
[project]
name = "superclaude-core"

[project.optional-dependencies]
cli = [...]
agents = [...]
```

**PyPI Setup:**
Add separate trusted publishers for each package.

### Pre-release Versions

Publish pre-releases (alpha, beta, rc):

```bash
# In pyproject.toml
version = "0.3.0a1"  # Alpha
version = "0.3.0b1"  # Beta
version = "0.3.0rc1" # Release candidate
```

PyPI will mark these as pre-releases automatically.

Install pre-releases:
```bash
pip install --pre superclaude
```

### Test PyPI

Test publishing before going to production:

1. Register on Test PyPI: https://test.pypi.org
2. Configure separate trusted publisher
3. Update workflow to publish to Test PyPI first
4. Verify, then publish to production PyPI

## Alternative: API Token Publishing

If trusted publishing doesn't work for your setup:

### 1. Generate API Token

1. Go to https://pypi.org/manage/account/token/
2. Click **Add API token**
3. Name: "GitHub Actions - pytest-agents"
4. Scope: "Entire account" or specific project
5. Copy the token (starts with `pypi-`)

### 2. Add to GitHub Secrets

```bash
# Via GitHub web UI:
# Repository → Settings → Secrets → Actions → New secret
# Name: PYPI_API_TOKEN
# Value: pypi-...

# Or via gh CLI:
gh secret set PYPI_API_TOKEN
# Paste token when prompted
```

### 3. Update Workflow

Modify `.github/workflows/release.yml`:

```yaml
- name: Publish to PyPI
  uses: pypa/gh-action-pypi-publish@release/v1
  with:
    password: ${{ secrets.PYPI_API_TOKEN }}
    skip-existing: true
```

**Note:** This is less secure than trusted publishing.

## Support

### PyPI Help

- Help Center: https://pypi.org/help/
- Support: https://github.com/pypi/support
- Status: https://status.python.org/

### GitHub Actions

- Workflow logs: `gh run view --log-failed`
- Re-run failed jobs: `gh run rerun <run-id>`

### Project Issues

Open an issue if you encounter problems:
```bash
gh issue create --title "PyPI publishing issue" --body "Description"
```

## References

- [PyPI Trusted Publishers](https://docs.pypi.org/trusted-publishers/)
- [GitHub OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [PyPI Publishing Guide](https://packaging.python.org/en/latest/guides/publishing-package-distribution-releases-using-github-actions-ci-cd-workflows/)

---

**Last Updated**: 2026-01-05
