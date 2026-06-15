# OCI Security List — SudarSim ports

In **Networking → Virtual cloud networks → your VCN → Security Lists → Default Security List → Add Ingress Rules**:

| Source CIDR | Protocol | Port(s) | Purpose |
|-------------|----------|---------|---------|
| `0.0.0.0/0` | TCP | 22 | SSH (restrict to your IP in production) |
| `0.0.0.0/0` | TCP | 8090 | SudarSim FastAPI / WebSocket dev |
| `0.0.0.0/0` | TCP | 7880 | LiveKit HTTP |
| `0.0.0.0/0` | TCP | 7881 | LiveKit WebSocket |
| `0.0.0.0/0` | UDP | 50000-60000 | WebRTC media |
| `0.0.0.0/0` | UDP | 3478 | TURN (optional) |

Also assign a **Reserved public IP** to the instance (Instance → Attached VNIC → Public IP → Edit → Reserved public IP).
