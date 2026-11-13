# GitHub-driven VPS updates

The VPS systemd timer checks the public main branches of STKCraft_web,
STKCraft-Geocalc and STKCraft-time every five minutes and after boot. No
GitHub token or webhook delivery is required for polling. The existing signed
main-site webhook remains available as the faster path.

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
systemctl enable --now stkcraft-auto-update.timer
systemctl start stkcraft-auto-update.service
python3 /etc/stkcraft-auto-update/test_rollback.py
systemctl list-timers stkcraft-auto-update.timer
journalctl -u stkcraft-auto-update.service -n 100
cat /var/lib/stkcraft-auto-update/web
cat /var/lib/stkcraft-auto-update/geocalc
```

No-change checks skip rebuilds. A failed build leaves the prior revision in
the state files so a later timer run retries. A single flock prevents overlap
between pollers. Existing main-site deployments retain their separate lock.
The main-site and GeoCalc build scripts also share a build lock to avoid
competing memory-intensive builds on the 2 GiB VPS.
