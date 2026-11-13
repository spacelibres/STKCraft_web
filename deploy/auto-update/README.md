# GitHub-driven VPS updates

GitHub push webhooks from STKCraft_web, STKCraft-Geocalc and STKCraft-time all
target https://www.stkcraft.com/webhook using the existing server-held HMAC
secret and application/json. Only authenticated main-branch pushes from these
three repositories are accepted. The receiver writes a durable pending marker;
systemd.path activates the existing verified update service. Pushes received
during a build remain pending and trigger another reconciliation after it ends.
The five-minute polling timer is disabled. The path watcher starts at boot and
also notices a pending marker left by a reboot. No GitHub API token is stored
on the VPS.

The main site uses its existing build-before-publish deployment. GeoCalc is
built in a fresh candidate checkout with the exact current time repository
patched into both Cargo dependency graphs. Cargo must resolve the version;
incompatible updates fail rather than silently selecting old time code.
Resolved lockfiles and source inputs are recorded in the candidate checkout.

The candidate reuses kernel bytes via independent hard-linked directory
entries, so replacing a candidate kernel cannot replace the live directory's
entry. Builds use one Rust job, 150% CPU and a 1 GiB service memory cap. The
candidate starts on loopback port 3102 and must pass scene, integration and
Python checks before the live service is stopped for the directory switch.
Startup/health failures and interrupted switches restore the preceding checkout.
Failed candidates are removed; only the two newest previous successful
checkouts are retained for rollback. Candidate traversal permissions are checked
and its HTTP probe runs as the same unprivileged user as the production app.

Install update.sh in /etc/stkcraft-auto-update and the service/timer under
/etc/systemd/system. Keep the versioned GeoCalc build, overlay, native wrapper
and verifier in /etc/stkcraft-geocalc in sync when changing this infrastructure.
Changes to privileged deployment configuration require operator review;
application source updates are automatic.

```sh
systemctl disable --now stkcraft-auto-update.timer
systemctl enable --now stkcraft-auto-update.path
systemctl start stkcraft-auto-update.service
python3 /etc/stkcraft-auto-update/test_rollback.py
systemctl status stkcraft-auto-update.path
journalctl -u stkcraft-auto-update.service -n 100
cat /var/lib/stkcraft-auto-update/web
cat /var/lib/stkcraft-auto-update/geocalc
```

No-change requests skip rebuilds. A failed build leaves the prior revision in
the state files; redeliver the GitHub push or start the update service manually
to retry. A single flock prevents overlapping update jobs. Existing main-site
deployments retain their separate lock.
The main-site and GeoCalc build scripts also share a build lock to avoid
competing memory-intensive builds on the 2 GiB VPS.
