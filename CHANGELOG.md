# Change Log

All notable changes to this project will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [0.17.0] - 2024-03-12
### Added
- Add direnv.watchForChanges setting

## [0.16.0] - 2024-01-18
### Added
- Windows support 🎉

## [0.15.2] - 2023-09-13
### Fixed
- Windows without workspaces load from the user home directory

## [0.15.1] - 2023-09-13

## [0.15.0] - 2023-09-12
### Added
- Add loadEnvrc command which lets the user load any .envrc file

## [0.14.0] - 2023-06-23
### Changed
- Remove obsolete workarounds for old VS Code versions
- Unset variables unset by direnv from the extension host
  (but still not in the terminal)
### Fixed
- Detect when a blocked .envrc is opened more reliably

## [0.13.0] - 2023-06-09
### Added
- Allow setting extra environment variables

## [0.12.2] - 2023-06-01
### Fixed
- Avoid relying on direnv's internal representations

## [0.12.1] - 2023-04-24
### Fixed
- Avoid disposing watchers when the environment hasn't changed

## [0.12.0] - 2023-04-17
### Changed
- Activate this extension before any language-based ones

## [0.11.0] - 2023-04-15
### Added
- Offer restarting automatically via configuration
### Changed
- Require VSCode 1.71

## [0.10.1] - 2022-11-27
### Fixed
- Fix check whether we need to restart the extension host
- Fix storing the cached environment

## [0.10.0] - 2022-11-24
### Changed
- Store a checksum along with the cached environment.
  If the checksum doesn't match on restore, reset the cache.
### Fixed
- When saving a watched .envrc, don't offer to allow it since we're reloading anyway.
- Update watched files when the .envrc is blocked.
- Keep watching files after they're deleted.

## [0.9.0] - 2022-11-19
### Added
- Watch the same files as direnv, reload when any of them changes

## [0.8.0] - 2022-11-19
### Added
- Log details about changed environment in the `direnv` output channel
- New command to "hard" reset the custom environment

## [0.7.0] - 2022-10-28
### Changed
- Require VSCode 1.66
- "Unset" variables by setting them to the empty string
### Fixed
- Avoid continuously asking to restart
	If this keeps happening to you, please let us know!

## [0.6.1] - 2022-03-25
### Fixed
- Reload window when running with a remote extension host

## [0.6.0] - 2022-03-12
### Added
- Count added variables separate from changed variables
- Cache environment variables for faster startup
- Offer to restart the extension host after receiving updates

## [0.5.0] - 2021-12-28
### Fixed
- Show error when direnv executable is missing
### Added
- Make path to direnv executable configurable
- Offer to install direnv or configure the executable path when it's not found

## [0.4.0] - 2021-12-12
### Fixed
- Handle null values exported by direnv
- Creating a new .envrc uses the intended filename
- Detect when a blocked .envrc is opened more reliably
### Added
- Offer to allow .envrc when saving it
- Show modified environment variable counts in status item
- Show modified environment variable counts or blocked file path in status item tooltip

## [0.3.0] - 2021-12-03
### Added
- Offer to allow blocked .envrc when opening it
### Changed
- Improve status item

## [0.2.0] - 2021-12-01
### Fixed
- Create new .envrc files when they do not exist
### Added
- Notify about errors
### Changed
- Activate as early as possible
- Update status bar icons
- Remove unnecessary dialog options

## [0.1.0] - 2021-11-27
### Added
- Expose variables set by direnv in the editor process.
  This allows their usage in `${env:VAR}` substitutions
  and other extensions to find binaries on a modified `PATH`.

## [0.0.1] - 2021-11-23
- Initial release

[Unreleased]: https://github.com/direnv/direnv-vscode/compare/v0.17.0...HEAD
[0.17.0]: https://github.com/direnv/direnv-vscode/compare/v0.16.0...v0.17.0
[0.16.0]: https://github.com/direnv/direnv-vscode/compare/v0.15.2...v0.16.0
[0.15.2]: https://github.com/direnv/direnv-vscode/compare/v0.15.1...v0.15.2
[0.15.1]: https://github.com/direnv/direnv-vscode/compare/v0.15.0...v0.15.1
[0.15.0]: https://github.com/direnv/direnv-vscode/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/direnv/direnv-vscode/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/direnv/direnv-vscode/compare/v0.12.2...v0.13.0
[0.12.2]: https://github.com/direnv/direnv-vscode/compare/v0.12.1...v0.12.2
[0.12.1]: https://github.com/direnv/direnv-vscode/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/direnv/direnv-vscode/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/direnv/direnv-vscode/compare/v0.10.1...v0.11.0
[0.10.1]: https://github.com/direnv/direnv-vscode/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/direnv/direnv-vscode/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/direnv/direnv-vscode/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/direnv/direnv-vscode/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/direnv/direnv-vscode/compare/v0.6.1...v0.7.0
[0.6.1]: https://github.com/direnv/direnv-vscode/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/direnv/direnv-vscode/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/direnv/direnv-vscode/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/direnv/direnv-vscode/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/direnv/direnv-vscode/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/direnv/direnv-vscode/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/direnv/direnv-vscode/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/direnv/direnv-vscode/releases/tag/v0.0.1
