# Change Log

All notable changes to the "direnv" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

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

[Unreleased]: https://github.com/direnv/direnv-vscode/compare/v0.6.1...HEAD
[0.6.1]: https://github.com/direnv/direnv-vscode/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/direnv/direnv-vscode/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/direnv/direnv-vscode/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/direnv/direnv-vscode/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/direnv/direnv-vscode/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/direnv/direnv-vscode/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/direnv/direnv-vscode/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/direnv/direnv-vscode/releases/tag/v0.0.1
