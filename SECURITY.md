# Security and privacy

Exploration Atlas is a static client-side application. It does not provide an
account system, server-side authorization, or secret storage.

## Important limitations

- The cartographer PIN is bundled into public JavaScript. It prevents casual
  taps during an event; it is not authentication.
- Checkpoint coordinates and story copy in a public deployment can be
  inspected even when the interface hides them before arrival.
- Photos and progress are stored in the browser's IndexedDB by default, but a
  person with access to the device/browser profile may still read or delete
  them.
- Location is processed in the browser, but the hosting provider still sees
  normal web request metadata.
- A public repository retains deleted information in Git history unless the
  history is rewritten or a clean repository is created.

## Recommended public-demo settings

- Use only public or synthetic routes.
- Keep real faces and private reference photos out of Git.
- Disable the cartographer panel if visitors should not skip stages.
- Keep optional private film and music disabled.
- Do not claim that concealed client-side content is cryptographically secret.

## Reporting a vulnerability

Please use the repository's private security-advisory feature rather than a
public issue when a report may contain sensitive details.

