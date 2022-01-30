{
  description = "";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    flake-compat.url = "github:edolstra/flake-compat";
    flake-compat.flake = false;
    npmlock2nix.url = "github:nix-community/npmlock2nix";
    npmlock2nix.flake = false;
  };

  outputs = { self, flake-utils, npmlock2nix, nixpkgs, ... }:
    let
      attrs = nixpkgs.lib.importJSON ./package.json;
      inherit (attrs) name version;
      vsix = "${name}-${version}.vsix";
    in
    flake-utils.lib.eachDefaultSystem (system:
      if system == "i686-linux" then { } # unsupported by vscode
      else
        let
          pkgs = import nixpkgs {
            inherit system;
            config = { allowUnfree = true; };
          };
          npm = pkgs.callPackage npmlock2nix { };
          node_modules_attrs = {
            buildInputs =
              if pkgs.stdenv.isDarwin
              then [ pkgs.python3 ]
              else [ pkgs.python3 pkgs.pkg-config pkgs.libsecret ];
          };
        in
        {
          defaultPackage = self.packages.${system}.vsix;

          packages.vsix = npm.build {
            src = ./.;
            inherit node_modules_attrs;
            buildCommands = [ "npm run package" ];
            installPhase = "mv ${vsix} $out";
          };

          devShell = npm.shell {
            src = ./.;
            inherit node_modules_attrs;
            packages = if pkgs.stdenv.isDarwin then [ ] else [ pkgs.xvfb-run ];
          };

          checks.test =
            let
              vscode-bin =
                if pkgs.stdenv.isDarwin
                then "${pkgs.vscode}/Applications/Visual Studio Code.app/Contents/MacOS/Electron"
                else "${pkgs.vscode}/lib/vscode/code";
              xvfb-run =
                if pkgs.stdenv.isDarwin
                then ""
                else "${pkgs.xvfb-run}/bin/xvfb-run --auto-servernum";
            in
            npm.build {
              src = ./.;
              inherit node_modules_attrs;
              buildInputs = [ pkgs.direnv ];
              installPhase = "touch $out";
              buildCommands = [
                "mkdir .home"
                "export HOME=$PWD/.home"
                "${xvfb-run} npm test -- '${vscode-bin}'"
              ];
            };
        });
}
