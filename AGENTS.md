# AGENTS.md

- Never do any backwards compatibility shims or other hacks that are not clean or are only done for migrations or older versions. We are in dev, so we are rather deleting all data and code that putting in weird hacks or fallbacks!
- If you run the dev server, or any other command that might run forever, make sure to use a timeout
