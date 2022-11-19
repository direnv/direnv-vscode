# direnv

[direnv] is an extension for your shell.
It augments existing shells with a new feature
that can load and unload environment variables
depending on the current directory.

This extension adds direnv support to Visual Studio Code
by loading environment variables for the workspace root.

[direnv]: https://direnv.net/


## Features

### Custom Environment

This extension automatically loads the custom environment
direnv provides for the workspace.
If the corresponding .envrc file is not allowed yet
it provides the option to allow or view and then allow the file.

The custom environment is available in [integrated terminals][vscode-terminal],
in [custom tasks of type `shell`][vscode-tasks],
and in [environment variable substitutions (`${env:VAR}`)][vscode-env-vars]

**Only allow .envrc files from sources you trust
since direnv executes arbitrary shell script.**

[vscode-terminal]: https://code.visualstudio.com/docs/editor/integrated-terminal
[vscode-tasks]: https://code.visualstudio.com/docs/editor/tasks#_custom-tasks
[vscode-env-vars]: https://code.visualstudio.com/docs/editor/variables-reference#_environment-variables

### Commands

*	"direnv: Open .envrc file"
	opens an editor with the .envrc file for the workspace,
	which means in the workspace root or any of its parent directories.

*	"direnv: Create .envrc file"
	opens an editor with the .envrc file at the workspace root.

*	"direnv: Allow this .envrc file"
	allows loading a custom environment from the currently opened shell script.

*	"direnv: Block this .envrc file"
	blocks loading a custom environment from the currently opened shell script.

*	"direnv: Reload environment"
	reloads the custom environment for the workspace.

*	"direnv: Reset and reload environment"
	resets the custom environment for the workspace, then reloads it.

### Status Item

The extension displays a status icon
that indicates whether it is currently working or has succeeded or failed.

Clicking the status item will also reload the custom environment.


## Requirements

This extension requires [direnv] to be installed.
We also recommend hooking direnv into your shell.


## Known Issues

This extension does *not* watch the filesystems for changes.
You will have to reload your environment manually for now.

Custom tasks with type `process` don't pick up on the modified environment.
Several task provider extensions provide these kinds of tasks.

Opening a blocked .envrc file without this extension's commands
(e.g. from the command line, the explorer, or the Open File dialog)
does not reliably ask to allow it.
[VSCode does not provide API to support this functionality yet.][vscode-15178]

[vscode-15178]: https://github.com/microsoft/vscode/issues/15178

direnv executes arbitrary shell scripts
so this extension requires trusted workspaces.


## Acknowledgements

The logo is copyright 2015 Peter Waller
and was created as [the direnv logo](https://github.com/direnv/direnv-logo).
