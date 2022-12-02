{
  description = "";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    flake-compat.url = "github:edolstra/flake-compat";
    flake-compat.flake = false;
  };

  outputs = {
    self,
    flake-utils,
    nixpkgs,
    ...
  }: let
    inherit (nixpkgs.lib.importJSON ./package.json) name version;
    vsix = "${name}-${version}.vsix";
    this = builtins.path {
      path = ./.;
      inherit name;
    };
    systems = nixpkgs.legacyPackages.x86_64-linux.vscodium.meta.platforms;
  in
    flake-utils.lib.eachSystem systems (system: let
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      packages.default = self.packages.${system}.vsix;

      packages.vsix = pkgs.mkYarnPackage {
        src = this;
        configurePhase = "ln -s $node_modules node_modules";
        buildPhase = "yarn run package";
        installPhase = "mv ${vsix} $out";
        distPhase = ":";
      };

      devShell = pkgs.mkShell {
        inputsFrom = [self.packages.${system}.default];
      };
    });
}
