{
  description = "";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    flake-compat.url = "github:edolstra/flake-compat";
    flake-compat.flake = false;
    devshell.url = "github:numtide/devshell";
    devshell.inputs.flake-utils.follows = "flake-utils";
    devshell.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = {
    self,
    devshell,
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
      pkgs = import nixpkgs {
        inherit system;
        overlays = [devshell.overlay];
      };
    in {
      packages.default = self.packages.${system}.vsix;

      packages.vsix = pkgs.mkYarnPackage {
        src = this;
        configurePhase = "ln -s $node_modules node_modules";
        buildPhase = "yarn run package";
        installPhase = "mv ${vsix} $out";
        distPhase = ":";
      };

      devShells.default = pkgs.devshell.mkShell {
        # packagesFrom = [self.packages.${system}.default]; # https://github.com/numtide/devshell/issues/5
        packages = [pkgs.nodejs-16_x pkgs.yarn];
      };
    });
}
