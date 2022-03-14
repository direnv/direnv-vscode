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
      let
        pkgs = import nixpkgs { inherit system; };
        npm = pkgs.callPackage npmlock2nix { };
        node_modules_attrs = {
          buildInputs = [ pkgs.python3 pkgs.pkg-config pkgs.libsecret ];
        };
      in
      {
        defaultPackage = self.packages.${system}.vsix;

        packages.vsix = npm.build {
          src = ./.;
          name = vsix;
          buildPhase = ''
            cd deps/${name}
            rm direnv
            mkdir direnv
            export VSCE_TESTS=1
            npx --offline vsce package
            ls -hal
          '';
          installPhase = ''
            mv ${vsix} $out
          '';
          distPhase = ":";
        };

        devShell = npm.shell {
          src = ./.;
          inherit node_modules_attrs;
        };
      });
}
