#!/usr/bin/env bash
# SudarSim — Oracle Cloud VM bootstrap (Ubuntu 22.04+ ARM)
# Run as root or with sudo after SSH into the instance.
set -euo pipefail

SUDAR_REPO="${SUDAR_REPO:-https://github.com/Dhanikesh-Karunanithi/Sudar.git}"
SUDAR_DIR="${SUDAR_DIR:-/opt/sudar}"
SIM_PORT="${SIM_PORT:-8090}"

echo "==> Installing system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq git python3 python3-venv python3-pip curl ufw

echo "==> Cloning Sudar repo (shallow)..."
mkdir -p "$(dirname "$SUDAR_DIR")"
if [[ ! -d "$SUDAR_DIR/.git" ]]; then
  git clone --depth 1 "$SUDAR_REPO" "$SUDAR_DIR"
else
  cd "$SUDAR_DIR" && git pull --ff-only || true
fi

echo "==> Python venv + sudar-sim deps..."
cd "$SUDAR_DIR/sudar-sim"
python3 -m venv .venv
source .venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo ""
  echo "!! Edit $SUDAR_DIR/sudar-sim/.env before starting (TOGETHER_API_KEY, SUPABASE, Intelligence URL)."
fi

echo "==> Installing systemd unit..."
cat > /etc/systemd/system/sudar-sim.service <<EOF
[Unit]
Description=SudarSim Voice Service
After=network.target

[Service]
Type=simple
WorkingDirectory=$SUDAR_DIR/sudar-sim
EnvironmentFile=$SUDAR_DIR/sudar-sim/.env
ExecStart=$SUDAR_DIR/sudar-sim/.venv/bin/uvicorn main:app --host 0.0.0.0 --port $SIM_PORT
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable sudar-sim

echo "==> UFW firewall (adjust if you use OCI security lists only)..."
ufw allow OpenSSH
ufw allow "$SIM_PORT/tcp" comment 'SudarSim FastAPI'
ufw allow 7880/tcp comment 'LiveKit HTTP'
ufw allow 7881/tcp comment 'LiveKit WS'
ufw allow 50000:60000/udp comment 'WebRTC media'
echo "y" | ufw enable || true

echo ""
echo "Done. Next steps:"
echo "  1. Edit $SUDAR_DIR/sudar-sim/.env (unset SIM_DEV_MODE for production)"
echo "  2. Open OCI VCN ingress: TCP $SIM_PORT, 7880-7881, UDP 50000-60000"
echo "  3. sudo systemctl start sudar-sim && sudo systemctl status sudar-sim"
echo "  4. Set Learn env: SUDAR_SIM_URL=http://<public-ip>:$SIM_PORT"
