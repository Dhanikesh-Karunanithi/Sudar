---
title: Connecting a private server
description: Mental model—install an app, pull a model, paste an address.
audience: admin
category: ai-literacy
order: 4
marketing: false
---

Think of a private AI server like a small web service inside your office or VPN. Sudar talks to it over HTTP, the same way it talks to cloud APIs.

Typical steps: install Ollama or LM Studio on a machine, download a model (for example gemma3:4b), note the address and port (often 11434 for Ollama).

In **Org settings → “Where Sudar runs your AI”**, turn on private server, paste the full address (starting with http:// or https://), and enter the model name exactly as your app shows it.

The “password” for the server is set once on the Sudar server by IT (environment variable), not in the form—this keeps secrets out of the database.
