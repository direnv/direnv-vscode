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
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        defaultPackage = self.packages.${system}.vsix;

        packages.vsix = pkgs.mkYarnPackage {
          src = ./.;
          configurePhase = "ln -s $node_modules node_modules";
          buildPhase = "yarn run package";
          installPhase = "mv ${vsix} $out";
          distPhase = ":";
        };

        devShell = with pkgs; mkShell {
          src = ./.;
          buildInputs = [ nodejs yarn ];
        };
      });
}
