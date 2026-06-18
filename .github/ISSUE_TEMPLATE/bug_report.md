---
name: "Bug Report"
about: "Report a bug in the OrbitStream Checkout SDK"
title: "[BUG] "
labels: ["bug", "needs-triage"]
assignees: ""
---

# Bug Report

## 🔍 Is this a regression?

<!-- Did this work before and now it's broken? If so, which version last worked? -->

## 📝 Description

<!-- A clear and concise description of what the bug is. -->

## 🔄 Steps to Reproduce

1. 
2. 
3. 

## ✅ Expected Behavior

<!-- What you expected to happen. -->

## ❌ Actual Behavior

<!-- What actually happened. Include error messages, stack traces, or API responses. -->

## 🌍 Environment

- **OS**: [e.g., Ubuntu 22.04, macOS 14]
- **Node.js version**: [e.g., 20.11.0]
- **TypeScript version**: [e.g., 5.3.3]
- **SDK version**: [e.g., 0.1.0 or commit hash]
- **Runtime**: [Node.js / Bun / Deno / Browser]
- **OrbitStream Backend version**: [e.g., commit hash or version tag]
- **Stellar network**: [testnet / mainnet]

## 📋 SDK Usage

<!-- Paste the exact code that triggers the bug. -->

```typescript
import { OrbitStream } from '@orbitstream/sdk';

const orbitstream = new OrbitStream({ apiKey: 'sk_test_...' });

// Code that triggers the bug
const session = await orbitstream.createSession({
  amount: 25.00,
  asset: 'USDC',
});
```

## 📋 API Response (if applicable)

<!-- If the bug involves an API response, paste it here. -->

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

## 🔍 Error Output

<!-- Paste the full error message or stack trace. -->

```
[Paste error here]
```

## 🧪 Minimal Reproduction

<!-- Provide the smallest possible code that reproduces the issue. -->

```typescript
// Minimal reproduction
```

## 📎 Additional Context

<!-- Any other context about the problem. -->

## ✅ Checklist

- [ ] I have searched existing issues and this is not a duplicate
- [ ] I am using the latest version of the SDK
- [ ] I have included the exact code that triggers the bug
- [ ] I have included the full error output
