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
          buildPhase = ''
            rm deps/direnv/direnv
            mkdir deps/direnv/direnv
            yarn run package
          '';
          installPhase = ''
            cd deps/direnv
            mv ${vsix} $out
          '';
          distPhase = ":";
        };

        devShell = with pkgs; mkShell {
          src = ./.;
          buildInputs = [ nodejs yarn ];
        };
      });
}
