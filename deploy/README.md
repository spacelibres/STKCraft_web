# STKCraft VPS deployment

This deploys the static Next.js export to a Debian/Ubuntu VPS running Caddy,
without touching an existing Caddy site.

## Layout

```
/opt/stkscraft              git clone of this repository (main)
/var/www/stkscraft          published static files (Caddy root)
/etc/stkscraft/webhook.secret  GitHub webhook HMAC secret (0600)
/etc/caddy/conf.d/stkscraft.caddy  isolated Caddy site on :8787
```

The webhook receiver listens on `127.0.0.1:8788` and is exposed by Caddy at
`http://<server>:8787/webhook`. It validates GitHub's
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
`tile8.spacexway.com` Caddy site; it adds an isolated `:8787` block via
`/etc/caddy/conf.d/`.

## GitHub webhook

Create a repository webhook pointing at:

```
http://176.122.160.172:8787/webhook
```

- Content type: `application/json`
- Secret: read `/etc/stkscraft/webhook.secret` on the server
- Events: just `push`

The receiver ignores pushes to branches other than `main`.

To create it with the GitHub CLI from a machine with `gh` authenticated:

```bash
gh api --method POST repos/spacelibres/STKCraft_web/hooks \
  -f name=web -F active=true -f 'events[]=push' \
  -f 'config[url]=http://176.122.160.172:8787/webhook' \
  -f 'config[content_type]=json' \
  -f "config[secret]=$(ssh root@176.122.160.172 'cat /etc/stkscraft/webhook.secret')"
```

Do not commit the secret. For a production domain with HTTPS, put the same
Caddy block behind a TLS site address and point the webhook at that URL.

## Manual operations

```bash
systemctl status stkscraft-webhook
journalctl -u stkscraft-webhook -f
tail -f /var/log/stkscraft-deploy.log
sudo /opt/stkscraft/deploy/deploy.sh
```

## Caddy and ports

- Public site: `:8787`
- Webhook upstream: `127.0.0.1:8788`
- The existing Caddy sites on ports 80/443 are untouched.

The Caddy config also contains a `www.stkscraft.com, stkscraft.com` block. Once
DNS points those names at `176.122.160.172`, Caddy obtains the certificate and
serves the same static root over HTTPS; no redeploy is needed. The current
static export uses root-relative asset paths, so it must be served at the root
of its site address.
