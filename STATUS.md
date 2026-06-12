# STATUS — LCARS-HA-Web
> Cold-pickup doc — read this to re-orient after a break.

## One-liner
Building a LCARS web dashboard for Home Assistant, running in Chrome kiosk mode.
Foundation is the cb-lcars custom card library (Necrotictv/cb-lcars fork of snootched/cb-lcars).

## Current state
**Just started.** Project scaffold created. cb-lcars fork exists on GitHub but has NOT yet been
cloned into this folder. HACS dependencies not yet installed in HA.

## Immediate blockers
- Git not yet initialised in this folder (see commands below)
- cb-lcars not yet installed in HA via HACS
- No dashboard YAML written yet

## Git Setup (run once in PowerShell on Zeke)

**Option A — fresh clone (preferred if folder is empty or only has scaffold files):**
```powershell
# From the 30_Projects parent directory:
cd "C:\Users\Patri\My Drive (patrick.patrickbyrne@gmail.com)\MyVaultObsidian\UberMegaVault\30_Projects"
git clone https://github.com/Necrotictv/cb-lcars.git LCARS-HA-Web

cd LCARS-HA-Web
git remote add upstream https://github.com/snootched/cb-lcars.git
git add PROJECT_MEMORY.md STATUS.md SESSION_ACTION_LOG.md
git commit -m "Add project scaffold (PROJECT_MEMORY, STATUS, SESSION_ACTION_LOG)"
git push origin main
```

**Option B — init into existing folder (scaffold files already here):**
```powershell
cd "C:\Users\Patri\My Drive (patrick.patrickbyrne@gmail.com)\MyVaultObsidian\UberMegaVault\30_Projects\LCARS-HA-Web"
git init
git remote add origin https://github.com/Necrotictv/cb-lcars.git
git remote add upstream https://github.com/snootched/cb-lcars.git
git fetch origin
git checkout -b main --track origin/main
git add PROJECT_MEMORY.md STATUS.md SESSION_ACTION_LOG.md
git commit -m "Add project scaffold (PROJECT_MEMORY, STATUS, SESSION_ACTION_LOG)"
git push origin main
```

## Next session starting point
1. Run git setup above if not done
2. Install HACS dependencies in HA (order: ha-lcars → my-slider-v2 → card-mod → cb-lcars)
3. Open `examples/dashboard-tablet.yaml` in repo for reference
4. Start building first dashboard view
