# Security Policy

To report a security vulnerability, please submit it [here](https://github.com/sindresorhus/execa/security/advisories/new).

No AI slop will be accepted.

## Not vulnerabilities

- Command injection through the `shell` option, or through a command or options that come from untrusted input. Only arguments are escaped.
- On Windows, a batch file that misuses its arguments, like `if "%1" == ""`. No escaping can prevent this. See [Windows escaping](https://github.com/sindresorhus/execa/blob/main/docs/windows.md#escaping).
