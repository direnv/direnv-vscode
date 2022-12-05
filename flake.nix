{
  description = "";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    flake-compat.url = "github:edolstra/flake-compat";
    flake-compat.flake = false;
    npmlock2nix.url = "github:nix-community/npmlock2nix";
    npmlock2nix.flake = false;
    devshell.url = "github:numtide/devshell";
    devshell.inputs.flake-utils.follows = "flake-utils";
    devshell.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = {
    self,
    devshell,
    flake-utils,
    npmlock2nix,
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
      npm = pkgs.callPackage npmlock2nix {};
    in {
      packages.default = self.packages.${system}.vsix;

      packages.vsix = npm.v2.build {
        src = this;
        buildCommands = ["npm run package"];
        installPhase = "mv ${vsix} $out";
      };

      devShells.default = pkgs.devshell.mkShell {
        # packagesFrom = [self.packages.${system}.default]; # https://github.com/numtide/devshell/issues/5
        packages = [pkgs.nodejs-16_x];
      };
      devShells.npm = npm.v2.shell {src = this;}; # TODO: hook into devshell?
    });
}
