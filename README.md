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
When any files watches by direnv are modified
the extension automatically reloads the environment.

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

*	"direnv: Load .envrc file"
	loads a custom environment from the specified .envrc file

### Status Item

The extension displays a status icon
that indicates whether it is currently working or has succeeded or failed.

Clicking the status item will also reload the custom environment.


## Requirements

This extension requires [direnv] to be installed.
We also recommend hooking direnv into your shell.


## Known Issues

Custom tasks with type `process` don't pick up on the modified environment.
Several task provider extensions provide these kinds of tasks.

When direnv *unsets* an environment variable
then in the terminal it will be set to empty
(what POSIX calls null).
[VSCode does not provide API to unset environment variables for the terminal.][vscode-evc]
The difference between null and unset variables is mostly academic
but some programs insist on treating them distinctly.

[vscode-evc]: https://github.com/microsoft/vscode/issues/185200

direnv executes arbitrary shell scripts
so this extension requires trusted workspaces.


## Acknowledgements

The logo is copyright 2015 Peter Waller
and was created as [the direnv logo](https://github.com/direnv/direnv-logo).
