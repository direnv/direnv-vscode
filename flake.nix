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
      name = attrs.name;
    in
    flake-utils.lib.eachDefaultSystem (system:
      let
        vsix = "${attrs.name}-${attrs.version}.vsix";
        pkgs = import nixpkgs { inherit system; };
      in
      {
        defaultPackage = self.packages.${system}.vsix;

        packages.vsix = pkgs.mkYarnPackage {
          src = ./.;
          name = vsix;
          buildPhase = ''
            # fix Error: ENOENT: no such file or directory, stat '/build/$HASH-source/deps/${name}/${name}
            rm deps/${name}/${name}
            # fix Warning: Using '*' activation is usually a bad idea as it impacts performance.
            echo y |
            yarn run --offline vsce package --yarn
          '';
          installPhase = ''
            mv deps/${name}/${vsix} $out
          '';
          distPhase = "true";
        };

        devShell = pkgs.mkShell {
          inputsFrom = [ self.defaultPackage.${system} ];
        };
      });
}
