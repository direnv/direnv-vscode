# Change Log

All notable changes to the "direnv" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]
### Fixed
- Create new .envrc files when they do not exist

## [0.1.0] - 2021-11-27
### Added
- Expose variables set by direnv in the editor process.
  This allows their usage in `${env:VAR}` substitutions
  and other extensions to find binaries on a modified `PATH`.

## [0.0.1] - 2021-11-23
- Initial release

[Unreleased]: https://codeberg.org/mkhl/vscode-direnv/compare/v0.1.0...HEAD
[0.1.0]: https://codeberg.org/mkhl/vscode-direnv/compare/v0.0.1...v0.1.0
[0.0.1]: https://codeberg.org/mkhl/vscode-direnv/releases/tag/v0.0.1
