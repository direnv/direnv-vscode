# Change Log

All notable changes to the "direnv" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]
### Added
- Offer to allow blocked envrc when opening it
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

[Unreleased]: https://github.com/direnv/direnv-vscode/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/direnv/direnv-vscode/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/direnv/direnv-vscode/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/direnv/direnv-vscode/releases/tag/v0.0.1
