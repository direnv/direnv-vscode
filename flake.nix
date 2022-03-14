{
  description = "";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    flake-compat.url = "github:edolstra/flake-compat";
    flake-compat.flake = false;
  };

  outputs = { self, flake-utils, nixpkgs, ... }:
    let
      attrs = nixpkgs.lib.importJSON ./package.json;
      inherit (attrs) name version;
      vsix = "${name}-${version}.vsix";
    in
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        defaultPackage = self.packages.${system}.vsix;

        packages.vsix = pkgs.mkYarnPackage {
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

        devShell = pkgs.mkShell {
          inputsFrom = [ self.defaultPackage.${system} ];
        };
      });
}
