---
title: Troubleshooting AI connectivity
description: When Sudar says it cannot reach the AI.
audience: admin
category: ai-literacy
order: 7
marketing: false
---

- Check that the AI app is running on the machine and that the port matches what you typed.
- If Sudar runs in the cloud but your model runs on a laptop, they cannot talk, private AI usually needs Sudar deployed where it can reach your network, or a tunnel/VPN your operator approves.
- Wrong model name is a common mistake: copy the name from `ollama list` or LM Studio exactly.
- Firewalls must allow the Sudar server to open an outbound connection to your private address. Your IT team can confirm.
