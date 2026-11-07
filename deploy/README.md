# STKCraft VPS deployment

This deploys the static Next.js export to a Debian/Ubuntu VPS running Caddy,
without touching an existing Caddy site.

## Layout

```
/opt/stkscraft              git clone of this repository (main)
/var/www/stkscraft          published static files (Caddy root)
/etc/stkscraft/webhook.secret  GitHub webhook HMAC secret (0600)
/etc/caddy/conf.d/stkscraft.caddy  HTTPS site for www.stkcraft.com
```

The webhook receiver listens only on `127.0.0.1:8788` and is exposed by Caddy at
`https://www.stkcraft.com/webhook`. It validates GitHub's
`X-Hub-Signature-256`, accepts only `refs/heads/main`, and starts
`deploy/deploy.sh`. The deploy script pulls, builds, and swaps the live static
root only after a successful build.

## One-time install

Upload `deploy/install.sh` to the server and run it as root:

```bash
scp deploy/install.sh root@176.122.160.172:/root/install-stkscraft.sh
ssh root@176.122.160.172 'bash /root/install-stkscraft.sh'
```

Or run from a checkout:

```bash
sudo bash deploy/install.sh
```

The script is idempotent. It does not stop or modify the existing
`tile8.spacexway.com` Caddy site; it installs a separate HTTPS site for
`www.stkcraft.com` via `/etc/caddy/conf.d/`.

## GitHub webhook

Create a repository webhook pointing at:

```
https://www.stkcraft.com/webhook
```

- Content type: `application/json`
- Secret: read `/etc/stkscraft/webhook.secret` on the server
- Events: just `push`

The receiver ignores pushes to branches other than `main`. A `204` delivery
means the push was a tag or another ref and was intentionally ignored; `202`
means a deploy was queued.

`caddy` and `stkscraft-webhook` are both enabled at boot; a systemd drop-in
sets `Restart=always` for Caddy. The static site itself has no long-running
Node process.

To create it with the GitHub CLI from a machine with `gh` authenticated:

```bash
gh api --method POST repos/spacelibres/STKCraft_web/hooks \
  -f name=web -F active=true -f 'events[]=push' \
  -f 'config[url]=https://www.stkcraft.com/webhook' \
  -f 'config[content_type]=json' \
  -f "config[secret]=$(ssh root@176.122.160.172 'cat /etc/stkscraft/webhook.secret')"
```

Do not commit the secret. The receiver is only exposed through the HTTPS
`www.stkcraft.com` site; its upstream stays on loopback.

## Manual operations

```bash
systemctl status stkscraft-webhook
journalctl -u stkscraft-webhook -f
tail -f /var/log/stkscraft-deploy.log
sudo /opt/stkscraft/deploy/deploy.sh
```

## Caddy and ports

- Public site: `https://www.stkcraft.com/` on **443**
- Port 80: HTTP→HTTPS redirect and ACME challenges
- Webhook upstream: `127.0.0.1:8788` (loopback only)
- `8787` is not configured, not listening and not reachable
- HTML and mutable assets send `Cache-Control: no-cache`; only hashed
  `/_next/static/*` files are immutable
- The existing Caddy sites on 80/443 are untouched

The current static export uses root-relative asset paths, so it must be served
at the root of its site address.
